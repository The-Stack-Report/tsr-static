#!/usr/bin/env python3
"""
Build the static data snapshot for The Stack Report static edition.

Reads the raw database exports (never committed) and writes:

  snapshot/          build-time data read by Next.js getStaticProps
  site/public/data/  data fetched by the browser at runtime

Usage:
  TSR_SOURCE=../source python3 etl/build_snapshot.py

TSR_SOURCE must contain:
  stack-report-cms/*.jsonl                  (Strapi/Postgres export)
  stackreport-data/thestackreport/*.jsonl   (MongoDB Extended JSON export)
"""
import gzip
import json
import os
import re
import shutil
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.abspath(os.environ.get("TSR_SOURCE", os.path.join(ROOT, "..", "source")))
CMS_DIR = os.path.join(SOURCE, "stack-report-cms")
MONGO_DIR = os.path.join(SOURCE, "stackreport-data", "thestackreport")

SNAPSHOT = os.path.join(ROOT, "snapshot")
PUBLIC_DATA = os.path.join(ROOT, "site", "public", "data")

SPACES_PREFIXES = [
    "https://the-stack-report.ams3.cdn.digitaloceanspaces.com/",
    "https://the-stack-report.ams3.digitaloceanspaces.com/",
]

# Contracts with at least this many calls get a pre-rendered dashboard page.
PRERENDER_MIN_CALLS = int(os.environ.get("TSR_PRERENDER_MIN_CALLS", "1000"))


# ---------------------------------------------------------------- helpers

def log(*a):
    print("[etl]", *a, flush=True)


def read_jsonl(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def write_json(path, data, pretty=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        if pretty:
            json.dump(data, f, ensure_ascii=False, indent=1)
        else:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def safe_name(s):
    """Filesystem/URL safe file name. Mirrored in site/lib/paths.js -> safeName()."""
    return re.sub(r"[^A-Za-z0-9_.\-]", lambda m: "~%02X" % ord(m.group(0)), s)


def bucket_name(s):
    """Case-insensitive file name for keys that only differ in case (macOS/Windows safe).
    Files named this way hold a dict keyed by the original key. Mirrored in site/lib/paths.js -> bucketName()."""
    return safe_name(s.lower())


def ejson(o):
    """MongoDB Extended JSON -> plain JSON types."""
    if isinstance(o, dict):
        if len(o) == 1:
            k = next(iter(o))
            v = o[k]
            if k in ("$numberInt", "$numberLong"):
                return int(v)
            if k == "$numberDouble":
                f = float(v)
                return None if f != f else f  # NaN -> null
            if k == "$numberDecimal":
                return float(v)
            if k == "$oid":
                return v
            if k == "$date":
                v = ejson(v)
                if isinstance(v, (int, float)):
                    return datetime.fromtimestamp(v / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")
                return v
        return {k: ejson(v) for k, v in o.items()}
    if isinstance(o, list):
        return [ejson(x) for x in o]
    return o


def cms_value(v):
    """The CMS export stores null/bools as strings."""
    if v == "None":
        return None
    if v == "True":
        return True
    if v == "False":
        return False
    return v


def cms_iso(v):
    if not v:
        return None
    if re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", v) and not v.endswith("Z") and "+" not in v[10:]:
        # Postgres timestamps without timezone are UTC in Strapi.
        v = v.split(".")[0] + "." + (v.split(".")[1][:3] if "." in v else "000") + "Z"
    return v


def to_spaces_path(url):
    """Absolute Spaces URL -> bucket-relative path (resolved again by assetUrl())."""
    if not isinstance(url, str):
        return url
    for p in SPACES_PREFIXES:
        if url.startswith(p):
            return url[len(p):]
    return url


SITE_LINK_RE = re.compile(r"https?://(www\.)?thestackreport\.xyz(?=/|\b)")


def relativise_site_links(text):
    if not isinstance(text, str):
        return text
    return SITE_LINK_RE.sub("", text)


# ---------------------------------------------------------------- CMS

def build_cms():
    log("CMS export:", CMS_DIR)
    def norm(k, v):
        v = cms_value(v)
        # Ids are exported inconsistently (int or str): normalise to str for joins.
        if (k == "id" or k.endswith("_id")) and v is not None and not isinstance(v, bool):
            return str(v)
        return v
    t = lambda name: [{k: norm(k, v) for k, v in r.items()} for r in read_jsonl(os.path.join(CMS_DIR, name + ".jsonl"))]
    articles_raw = t("articles")
    categories_raw = t("categories")
    authors_raw = t("authors")
    charts_raw = t("charts")
    landing_raw = t("landing_pages")
    art_cat = t("articles_categories_links")
    art_auth = t("articles_authors_links")
    landing_featured = t("landing_pages_featured_links")

    def meta_dates(r):
        return {
            "createdAt": cms_iso(r.get("created_at")),
            "updatedAt": cms_iso(r.get("updated_at")),
            "publishedAt": cms_iso(r.get("published_at")),
        }

    authors = {
        r["id"]: {
            "id": int(r["id"]),
            "attributes": {
                "full_name": r.get("full_name"),
                "first_name": r.get("first_name"),
                "last_name": r.get("last_name"),
                "profile_pic_url": r.get("profile_pic_url"),
                "twitter": r.get("twitter"),
                "tezos_wallet": r.get("tezos_wallet"),
                "role": r.get("role"),
                "bio": r.get("bio"),
                **meta_dates(r),
            },
        }
        for r in authors_raw
    }
    categories_base = {
        r["id"]: {"id": int(r["id"]), "attributes": {"Category": r.get("category"), **meta_dates(r)}}
        for r in categories_raw
    }

    cats_by_article = defaultdict(list)
    for l in art_cat:
        cats_by_article[l["article_id"]].append(l["category_id"])
    auth_by_article = defaultdict(list)
    for l in art_auth:
        auth_by_article[l["article_id"]].append(l["author_id"])

    def article_attrs(r):
        return {
            "Title": r.get("title"),
            "Snippet": r.get("snippet"),
            "Content": relativise_site_links(r.get("content")),
            "Published": cms_iso(r.get("published")),
            "slug": r.get("slug"),
            "banner_image_url": r.get("banner_image_url"),
            "banner_video_url": r.get("banner_video_url"),
            "meta_description": r.get("meta_description"),
            "preview": bool(r.get("preview")),
            **meta_dates(r),
        }

    articles = []
    for r in articles_raw:
        a = {"id": int(r["id"]), "attributes": article_attrs(r)}
        a["attributes"]["authors"] = {"data": [authors[i] for i in auth_by_article[r["id"]] if i in authors]}
        a["attributes"]["categories"] = {"data": [categories_base[i] for i in cats_by_article[r["id"]] if i in categories_base]}
        articles.append(a)
    articles.sort(key=lambda a: a["attributes"]["Published"] or "", reverse=True)
    articles_by_id = {str(a["id"]): a for a in articles}

    categories = []
    for cid, c in categories_base.items():
        cat = json.loads(json.dumps(c))
        cat["attributes"]["articles"] = {
            "data": [a for a in articles if any(str(x["id"]) == cid for x in a["attributes"]["categories"]["data"])]
        }
        categories.append(cat)
    categories.sort(key=lambda c: c["id"])

    landing = None
    if landing_raw:
        r = landing_raw[0]
        featured_id = next((l["article_id"] for l in landing_featured if l["landing_page_id"] == r["id"]), None)
        landing = {
            "id": int(r["id"]),
            "attributes": {
                "about_tsr": relativise_site_links(r.get("about_tsr")),
                "featured": {"data": articles_by_id.get(featured_id)},
                **meta_dates(r),
            },
        }

    charts = []
    for r in charts_raw:
        attrs = {k: v for k, v in r.items() if k not in ("id", "created_by_id", "updated_by_id", "created_at", "updated_at", "published_at")}
        attrs.update(meta_dates(r))
        charts.append({"id": int(r["id"]), "attributes": attrs})

    write_json(os.path.join(SNAPSHOT, "cms", "articles.json"), articles, pretty=True)
    write_json(os.path.join(SNAPSHOT, "cms", "categories.json"), categories, pretty=True)
    write_json(os.path.join(SNAPSHOT, "cms", "landing.json"), landing, pretty=True)
    write_json(os.path.join(SNAPSHOT, "cms", "charts.json"), charts, pretty=True)
    write_json(os.path.join(SNAPSHOT, "cms", "authors.json"), list(authors.values()), pretty=True)
    # Chart definitions are also needed in the browser (ChartBySlug inside article markdown).
    chart_dir = os.path.join(PUBLIC_DATA, "charts")
    if os.path.isdir(chart_dir):
        shutil.rmtree(chart_dir)
    buckets = defaultdict(dict)
    for c in charts:
        buckets[bucket_name(c["attributes"]["slug"])][c["attributes"]["slug"]] = {"data": [c]}
    for name, by_slug in buckets.items():
        write_json(os.path.join(chart_dir, name + ".json"), by_slug)
    log(f"CMS: {len(articles)} articles, {len(categories)} categories, {len(charts)} charts")
    return charts


# ---------------------------------------------------------------- Mongo: datasets

DATASET_KEEP = [
    "identifier", "#schema", "title", "description", "type", "format", "url", "file_size",
    "date", "last_update", "coverage", "creator", "publisher", "source", "subject", "language", "tags",
]


def build_datasets():
    log("datasets")
    by_id = {}
    legacy = []
    for d in read_jsonl(os.path.join(MONGO_DIR, "datasets.jsonl")):
        d = ejson(d)
        if not d.get("identifier"):
            legacy.append(d)
            continue
        rec = {k: d[k] for k in DATASET_KEEP if k in d}
        fs = rec.get("file_size")
        if isinstance(fs, str):
            try:
                rec["file_size"] = float(fs)
            except ValueError:
                pass
        by_id[rec["identifier"]] = rec

    out_dir = os.path.join(PUBLIC_DATA, "datasets", "by-id")
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    buckets = defaultdict(dict)
    for ident, rec in by_id.items():
        buckets[bucket_name(ident)][ident] = rec
    for name, recs in buckets.items():
        write_json(os.path.join(out_dir, name + ".json"), recs)

    # Catalog grouped into families for the static listing.
    ep_re = re.compile(r"^the-stack-report--tezos-entrypoint-(.+?)-(time-series|summary|network-reduced|network|smart-contracts-top-100|accounts-calling-top-100|smart-contracts|accounts-calling)$")
    entrypoints = defaultdict(dict)
    general = []
    for ident, rec in by_id.items():
        m = ep_re.match(ident)
        light = {k: rec.get(k) for k in ("identifier", "title", "type", "format", "file_size", "last_update", "url")}
        if m:
            entrypoints[m.group(1)][m.group(2)] = light
        else:
            general.append(light)
    general.sort(key=lambda r: r.get("title") or "")
    write_json(os.path.join(SNAPSHOT, "datasets", "general.json"), general, pretty=True)
    write_json(os.path.join(SNAPSHOT, "datasets", "entrypoints.json"), entrypoints)
    # Entrypoint names that only differ in case can not be pre-rendered side by side on
    # case-insensitive file systems; those are served by the entrypoint viewer page instead.
    # Per group of names that only differ in case, the most active one (largest time series)
    # gets the pre-rendered page; the others use the viewer page.
    groups = defaultdict(list)
    for name, fam in entrypoints.items():
        size = (fam.get("time-series") or {}).get("file_size") or 0
        groups[name.lower()].append((-(size if isinstance(size, (int, float)) else 0), name))
    prerender, viewer_only = [], []
    for members in groups.values():
        members.sort()
        for i, (_, name) in enumerate(members):
            (prerender if i == 0 and safe_name(name) == name else viewer_only).append(name)
    write_json(os.path.join(SNAPSHOT, "entrypoints", "prerender.json"), sorted(prerender))
    write_json(os.path.join(ROOT, "site", "lib", "generated", "entrypointsViewerOnly.json"), sorted(viewer_only), pretty=True)
    write_json(os.path.join(SNAPSHOT, "datasets", "legacy.json"), legacy, pretty=True)
    log(f"datasets: {len(by_id)} with identifier ({len(general)} general, {len(entrypoints)} entrypoints), {len(legacy)} legacy")
    return by_id, entrypoints


# ---------------------------------------------------------------- Mongo: data blocks

def flatten_stills(stills):
    out = []

    def walk(s):
        if not isinstance(s, dict):
            return
        url = s.get("spaces_url")
        frame = s.get("frame")
        nr = s.get("nr")
        if isinstance(frame, dict):
            walk(frame)
            if url and not any(o["spaces_url"] == url for o in out):
                out.append({"nr": nr, "frame": None, "spaces_url": url})
        else:
            if url and not any(o["spaces_url"] == url for o in out):
                out.append({"nr": nr, "frame": frame, "spaces_url": url})

    for s in stills or []:
        walk(s)
    # Keep the innermost (which carries the frame nr) and drop duplicates.
    seen = {}
    for o in out:
        if o["spaces_url"] not in seen or (o["frame"] is not None and seen[o["spaces_url"]]["frame"] is None):
            seen[o["spaces_url"]] = o
    return sorted(seen.values(), key=lambda o: (o["nr"] if o["nr"] is not None else 0))


def build_data_blocks():
    log("data_blocks")
    blocks = []
    for d in read_jsonl(os.path.join(MONGO_DIR, "data_blocks.jsonl")):
        d = ejson(d)
        d["stills"] = flatten_stills(d.get("stills"))
        if isinstance(d.get("merged_frames_at"), str) is False and d.get("merged_frames_at") is not None:
            d["merged_frames_at"] = str(d["merged_frames_at"])
        blocks.append(d)
    blocks.sort(key=lambda b: (b.get("endDate") or "", b.get("vid_key")), reverse=True)
    # URL/file slug, unique also on case-insensitive file systems (two keys differ only in case).
    taken = set()
    for b in sorted(blocks, key=lambda b: b["vid_key"]):
        slug = safe_name(b["vid_key"])
        candidate, n = slug, 2
        while candidate.lower() in taken:
            candidate, n = f"{slug}-{n}", n + 1
        taken.add(candidate.lower())
        b["slug"] = candidate
    write_json(os.path.join(SNAPSHOT, "data_blocks", "all.json"), blocks)
    out_dir = os.path.join(PUBLIC_DATA, "data_blocks")
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    for b in blocks:
        write_json(os.path.join(out_dir, b["slug"] + ".json"), b)
    write_json(os.path.join(out_dir, "_index.json"), {b["vid_key"]: b["slug"] for b in blocks})
    log(f"data_blocks: {len(blocks)}")


# ---------------------------------------------------------------- Mongo: chart notes

def build_chart_notes():
    log("chart_notes")
    notes = defaultdict(list)
    kept = 0
    for d in read_jsonl(os.path.join(MONGO_DIR, "chart_notes.jsonl")):
        d = ejson(d)
        if d.get("deleted"):
            continue
        visibility = d.get("visibility") or ("curated" if d.get("curated") else None)
        if visibility not in ("curated", "community"):
            continue
        notes[d["chartId"]].append({
            "_id": d["_id"],
            "note": d.get("note"),
            "date": d.get("date"),
            "chartId": d["chartId"],
            "owner": d.get("owner"),
            "visibility": visibility,
            "curated": bool(d.get("curated")),
            "deleted": False,
            "createdAt": d.get("createdAt"),
            "updatedAt": d.get("updatedAt"),
        })
        kept += 1
    out_dir = os.path.join(PUBLIC_DATA, "notes")
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    buckets = defaultdict(dict)
    for chart_id, ns in notes.items():
        buckets[bucket_name(chart_id)][chart_id] = ns
    for name, by_chart in buckets.items():
        write_json(os.path.join(out_dir, name + ".json"), by_chart)
    write_json(os.path.join(SNAPSHOT, "notes", "index.json"), sorted(notes.keys()))
    write_json(os.path.join(out_dir, "_index.json"), sorted(notes.keys()))
    log(f"chart_notes: kept {kept} public notes on {len(notes)} charts")


# ---------------------------------------------------------------- Mongo: contracts metadata

def round_floats(o, sig=6):
    if isinstance(o, float):
        return float(f"{o:.{sig}g}")
    if isinstance(o, dict):
        return {k: round_floats(v, sig) for k, v in o.items()}
    if isinstance(o, list):
        return [round_floats(v, sig) for v in o]
    return o


CONTRACT_DROP = {"_id", "api_cache_ts", "contract_network_data_url", "contract_xtz_stats_url", "entrypoint_xtz_stats_url"}


def build_contracts():
    log("contracts_metadata (large, this takes a minute)")
    shards = defaultdict(list)
    top14 = []
    prerender = []
    total = 0
    for d in read_jsonl(os.path.join(MONGO_DIR, "contracts_metadata.jsonl")):
        d = ejson(d)
        for k in CONTRACT_DROP:
            d.pop(k, None)
        addr = d.get("address")
        if not addr:
            continue
        total += 1
        shards[bucket_name(addr[3:5])].append(d)
        pos = (d.get("sort_positions") or {}).get("by_calls_past_14_days")
        if pos is not None and pos <= 25:
            top14.append(d)
        if (d.get("total_contract_calls") or 0) >= PRERENDER_MIN_CALLS:
            prerender.append(addr)

    out_dir = os.path.join(PUBLIC_DATA, "contracts", "meta")
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    size = 0
    for prefix, rows in shards.items():
        p = os.path.join(out_dir, prefix + ".json.gz")
        os.makedirs(out_dir, exist_ok=True)
        payload = json.dumps({r["address"]: round_floats(r) for r in rows}, ensure_ascii=False, separators=(",", ":"))
        with gzip.GzipFile(p, "wb", compresslevel=9, mtime=0) as f:
            f.write(payload.encode("utf-8"))
        size += os.path.getsize(p)

    top14.sort(key=lambda d: d["sort_positions"]["by_calls_past_14_days"])
    write_json(os.path.join(SNAPSHOT, "contracts", "top_14d.json"), top14)
    write_json(os.path.join(SNAPSHOT, "contracts", "prerender.json"), sorted(prerender))
    log(f"contracts: {total} in {len(shards)} gzipped shards ({size/1e6:.1f} MB), {len(prerender)} pre-rendered, top list {len(top14)}")


# ---------------------------------------------------------------- external snapshots

def fetch(url, timeout=60, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "tsr-static-etl", **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def build_entrypoints_index(datasets_by_id):
    """The entrypoints rich statistics index is needed at build time (index page + page list)."""
    ident = "the-stack-report--tezos-entrypoints-rich-statistics-index"
    rec = datasets_by_id.get(ident)
    target = os.path.join(SNAPSHOT, "entrypoints", "rich-statistics-index.csv")
    if rec and rec.get("url"):
        try:
            raw = fetch(rec["url"])
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as f:
                f.write(raw)
            log(f"entrypoints index downloaded ({len(raw)/1e3:.0f} KB)")
        except Exception as e:  # keep previous copy if offline
            log("WARNING could not download entrypoints index:", e)
    if not os.path.exists(target):
        log("WARNING entrypoints index missing; entrypoint index page will be empty")


def build_access_cards():
    """One-off snapshot of the TSR access card collection (replaces the live Teztok query)."""
    target = os.path.join(PUBLIC_DATA, "external", "access_cards.json")
    if os.path.exists(target) and not os.environ.get("TSR_REFRESH_EXTERNAL"):
        log("access cards snapshot exists (set TSR_REFRESH_EXTERNAL=1 to refresh)")
        return
    contract = "KT1LaCf37XyoR4eNCzMnw6Ccp5bfPFQrKYxe"
    try:
        raw = fetch(f"https://api.tzkt.io/v1/tokens?contract={contract}&limit=10000&select=tokenId,metadata.name,totalSupply")
        tokens = json.loads(raw)
        cards = [
            {"token_id": int(t["tokenId"]), "name": t.get("metadata.name") or f"Access card #{t['tokenId']}",
             "total_supply": t.get("totalSupply"), "fa2_address": contract}
            for t in tokens
        ]
        cards.sort(key=lambda c: c["token_id"])
        write_json(target, {"source": "api.tzkt.io", "snapshot_at": datetime.now(timezone.utc).isoformat(), "tokens": cards})
        log(f"access cards snapshot saved ({len(cards)} tokens)")
    except Exception as e:
        log("WARNING access cards snapshot failed (the grid will show an archived notice):", e)


# ---------------------------------------------------------------- main

def main():
    if not os.path.isdir(CMS_DIR) or not os.path.isdir(MONGO_DIR):
        sys.exit(f"Source exports not found under {SOURCE}. Set TSR_SOURCE.")
    os.makedirs(SNAPSHOT, exist_ok=True)
    os.makedirs(PUBLIC_DATA, exist_ok=True)
    only = set(sys.argv[1:])
    run = lambda name: not only or name in only

    if run("cms"):
        build_cms()
    datasets_by_id = None
    if run("datasets") or run("entrypoints"):
        datasets_by_id, _ = build_datasets()
    if run("entrypoints"):
        build_entrypoints_index(datasets_by_id)
    if run("data_blocks"):
        build_data_blocks()
    if run("notes"):
        build_chart_notes()
    if run("contracts"):
        build_contracts()
    if run("external"):
        build_access_cards()

    meta_path = os.path.join(SNAPSHOT, "meta.json")
    export_date = None
    if datasets_by_id:
        dates = [r.get("last_update") for r in datasets_by_id.values() if isinstance(r.get("last_update"), str)]
        export_date = max(dates)[:10] if dates else None
    if not export_date and os.path.exists(meta_path):
        export_date = json.load(open(meta_path)).get("export_date")
    write_json(meta_path, {
        "export_date": export_date,
        "snapshot_built_at": datetime.now(timezone.utc).isoformat(),
        "prerender_min_calls": PRERENDER_MIN_CALLS,
    }, pretty=True)
    log("done")


if __name__ == "__main__":
    main()
