// Boolean toggles for website features.
// This is the archived static edition: everything that needed a server is switched off.

export const ARCHIVE_MODE = true

// When true, chart hover tooltips and timeline brushes are disabled as well.
export const FREEZE_CHART_INTERACTIONS = true

export const WALLET_CONNECTION = false

export const INTERPRETATION_LAYER = true

// Chart notes are shown read-only (public curated/community notes only).
export const INTERPRETATION_LAYER_CHART_NOTES = true

export const EXPORT_DATE = process.env.NEXT_PUBLIC_EXPORT_DATE || ""

export const ARCHIVE_NOTICE = "Archived static edition"
