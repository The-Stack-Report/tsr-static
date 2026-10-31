import _ from "lodash"
import chroma from "chroma-js"

import { assetUrl } from "lib/hosts"

// The Strapi CMS is no longer used: content comes from the static snapshot (lib/staticData.js).

export var placeholderImg = assetUrl("website_assets/Article_missing_img.png")


export const chartCMSProps = [
    {
        CMS_key: "x_key",
        propKey: "xKey"
    },{
        CMS_key: "columns",
        propKey: "columns"
    },{
        CMS_key: "type",
        propKey: "type"
    },{
        CMS_key: "color",
        propKey: "color",
        prepFunction: (c) => {
            if(_.isString(c)) {
                return c
            } else if(_.isArray(c)) {
                return chroma.scale(c)
            } else {
                return "rgb(150,150,150)"
            }
        }
    },{
        CMS_key: "badges_legend",
        propKey: "badgesLegend"
    },{
        CMS_key: "badges_legend_text",
        propKey: "badgesLegendText"
    },{
        CMS_key: "name",
        propKey: "name",
    },{
        CMS_key: "y_axis_tick_label",
        propKey: "yAxisTickLabel"
    },{
        CMS_key: "y_scale_type",
        propKey: "yScaleType"
    }
]