# Homepage — missing sections JSON draft

Drop each block into `templates/index.json` under `"sections": { ... }` and add
its ID to the `"order"` array. Minimal settings rely on the preset's schema
defaults — the theme editor will fill the rest in on first open.

All section IDs below are placeholders (`section_values`, `section_subscription_cta`, …) —
rename them however you like. Collection handles are guesses; swap in real ones.

## 1. Icons with text — FREEDOM / NATURE / POSSIBILITY

```json
"section_values": {
  "type": "section",
  "blocks": {
    "group_freedom": {
      "type": "group",
      "settings": {
        "content_direction": "column",
        "horizontal_alignment_flex_direction_column": "center",
        "vertical_alignment_flex_direction_column": "center",
        "gap": 16,
        "height": "fit",
        "inherit_color_scheme": true
      },
      "blocks": {
        "icon": {
          "type": "icon",
          "settings": { "icon": "star", "width": 32 }
        },
        "heading": {
          "type": "text",
          "settings": {
            "text": "<h3>Freedom</h3>",
            "type_preset": "h4",
            "alignment": "center",
            "width": "100%",
            "max_width": "normal"
          }
        },
        "text": {
          "type": "text",
          "settings": {
            "text": "<p>Break free from the ordinary. Our coffee fuels those who choose their own path and live on their own terms.</p>",
            "type_preset": "paragraph",
            "alignment": "center",
            "width": "100%",
            "max_width": "narrow"
          }
        }
      },
      "block_order": ["icon", "heading", "text"]
    },
    "group_nature": {
      "type": "group",
      "settings": {
        "content_direction": "column",
        "horizontal_alignment_flex_direction_column": "center",
        "vertical_alignment_flex_direction_column": "center",
        "gap": 16,
        "height": "fit",
        "inherit_color_scheme": true
      },
      "blocks": {
        "icon": {
          "type": "icon",
          "settings": { "icon": "mountain", "width": 32 }
        },
        "heading": {
          "type": "text",
          "settings": {
            "text": "<h3>Nature</h3>",
            "type_preset": "h4",
            "alignment": "center",
            "width": "100%",
            "max_width": "normal"
          }
        },
        "text": {
          "type": "text",
          "settings": {
            "text": "<p>Roasted in Colorado's high country. Every batch honors the wild places that inspire us to keep exploring.</p>",
            "type_preset": "paragraph",
            "alignment": "center",
            "width": "100%",
            "max_width": "narrow"
          }
        }
      },
      "block_order": ["icon", "heading", "text"]
    },
    "group_possibility": {
      "type": "group",
      "settings": {
        "content_direction": "column",
        "horizontal_alignment_flex_direction_column": "center",
        "vertical_alignment_flex_direction_column": "center",
        "gap": 16,
        "height": "fit",
        "inherit_color_scheme": true
      },
      "blocks": {
        "icon": {
          "type": "icon",
          "settings": { "icon": "lightning", "width": 32 }
        },
        "heading": {
          "type": "text",
          "settings": {
            "text": "<h3>Possibility</h3>",
            "type_preset": "h4",
            "alignment": "center",
            "width": "100%",
            "max_width": "normal"
          }
        },
        "text": {
          "type": "text",
          "settings": {
            "text": "<p>Great coffee is just the beginning. It's fuel for the dreams you chase and the stories you create.</p>",
            "type_preset": "paragraph",
            "alignment": "center",
            "width": "100%",
            "max_width": "narrow"
          }
        }
      },
      "block_order": ["icon", "heading", "text"]
    }
  },
  "block_order": ["group_freedom", "group_nature", "group_possibility"],
  "name": "t:names.icons_with_text",
  "settings": {
    "content_direction": "row",
    "vertical_on_mobile": true,
    "horizontal_alignment": "space-around",
    "vertical_alignment": "flex-start",
    "gap": 32,
    "section_width": "page-width",
    "color_scheme": "scheme-1",
    "padding-block-start": 48,
    "padding-block-end": 48
  }
}
```

> ⚠️ `icon` field values (`star`, `mountain`, `lightning`) must match icons the
> theme exposes. If they don't render, pick replacements in the theme editor
> from the icon block's dropdown.

## 2. "Build your coffee subscription" CTA banner

Pattern matches the existing "Mountain berry" section (`section_kETjic`) —
heading + description + button in a dark-scheme banner. Set the background
image (wood-grain with coffee bag) in the theme editor after pasting.

```json
"section_subscription_cta": {
  "type": "section",
  "blocks": {
    "heading": {
      "type": "text",
      "name": "t:names.heading",
      "settings": {
        "text": "<h2>Build your coffee subscription</h2>",
        "type_preset": "h2",
        "font": "var(--font-heading--family)",
        "case": "uppercase",
        "alignment": "left",
        "width": "fit-content",
        "max_width": "normal",
        "color": "var(--color-foreground-heading)",
        "padding-block-start": 0,
        "padding-block-end": 8
      }
    },
    "text": {
      "type": "text",
      "settings": {
        "text": "<p>Pick your beans. Set your pace. We'll handle the rest. Fresh-roasted coffee, delivered like clockwork. Pause it, tweak it, or swap things up whenever the trail calls.</p>",
        "type_preset": "paragraph",
        "alignment": "left",
        "width": "fit-content",
        "max_width": "normal",
        "padding-block-start": 0,
        "padding-block-end": 16
      }
    },
    "button": {
      "type": "button",
      "settings": {
        "label": "Start building",
        "link": "shopify://collections/all",
        "style_class": "button",
        "width": "fit-content"
      }
    }
  },
  "block_order": ["heading", "text", "button"],
  "name": "t:names.custom_section",
  "settings": {
    "content_direction": "column",
    "vertical_on_mobile": true,
    "horizontal_alignment": "flex-start",
    "vertical_alignment": "center",
    "horizontal_alignment_flex_direction_column": "flex-start",
    "vertical_alignment_flex_direction_column": "center",
    "gap": 12,
    "section_width": "page-width",
    "section_height": "medium",
    "color_scheme": "scheme-2",
    "padding-block-start": 80,
    "padding-block-end": 80,
    "padding-inline-start": 0,
    "padding-inline-end": 0
  }
}
```

## 3. "Shop coffee by category" collection grid

Uses `collection-list` section with 4 collections. Replace the handles
(`single-origin`, `blends`, `infusion`, `seasonal`) with whatever actually
exists in the store.

```json
"section_shop_by_category": {
  "type": "collection-list",
  "blocks": {
    "group_header": {
      "type": "group",
      "name": "t:names.header",
      "settings": {
        "content_direction": "column",
        "horizontal_alignment": "center",
        "vertical_alignment": "center",
        "gap": 12,
        "width": "fill",
        "height": "fit"
      },
      "blocks": {
        "heading": {
          "type": "text",
          "settings": {
            "text": "<h2>Shop coffee by category</h2>",
            "type_preset": "h4",
            "case": "uppercase",
            "alignment": "center",
            "width": "fit-content",
            "max_width": "normal",
            "padding-block-end": 16
          }
        }
      },
      "block_order": ["heading"]
    },
    "static-collection-card": {
      "type": "_collection-card",
      "name": "t:names.collection_card",
      "static": true,
      "settings": {
        "horizontal_alignment": "flex-start",
        "vertical_alignment": "flex-end",
        "placement": "on_image",
        "inherit_color_scheme": true
      },
      "blocks": {
        "collection-card-image": {
          "type": "_collection-card-image",
          "static": true,
          "settings": { "image_ratio": "portrait" }
        },
        "collection-title": {
          "type": "collection-title",
          "settings": {
            "type_preset": "h5",
            "case": "uppercase",
            "alignment": "left",
            "color": "#ffffff",
            "background": false,
            "padding-block-start": 12,
            "padding-block-end": 12,
            "padding-inline-start": 16,
            "padding-inline-end": 16
          }
        }
      },
      "block_order": ["collection-title"]
    }
  },
  "block_order": ["group_header"],
  "name": "t:names.collection_list",
  "settings": {
    "collection_list": [
      "single-origin",
      "blends",
      "infusion",
      "seasonal"
    ],
    "layout_type": "grid",
    "columns": 4,
    "mobile_columns": "2",
    "columns_gap": 16,
    "rows_gap": 16,
    "section_width": "page-width",
    "color_scheme": "scheme-1",
    "padding-block-start": 48,
    "padding-block-end": 48
  }
}
```

## 4. "What our customers say" testimonials (Multicolumn)

3 columns, each with star icon + quote + author.

```json
"section_testimonials": {
  "type": "section",
  "blocks": {
    "group_header": {
      "type": "group",
      "name": "t:names.header",
      "settings": {
        "content_direction": "column",
        "horizontal_alignment_flex_direction_column": "center",
        "vertical_alignment_flex_direction_column": "center",
        "gap": 8,
        "width": "fill",
        "height": "fit"
      },
      "blocks": {
        "heading": {
          "type": "text",
          "settings": {
            "text": "<h2>What our customers say</h2>",
            "type_preset": "h4",
            "case": "uppercase",
            "alignment": "center",
            "width": "100%",
            "max_width": "normal",
            "padding-block-end": 24
          }
        }
      },
      "block_order": ["heading"]
    },
    "group_columns": {
      "type": "group",
      "settings": {
        "content_direction": "row",
        "vertical_on_mobile": true,
        "horizontal_alignment": "space-between",
        "vertical_alignment": "flex-start",
        "gap": 24,
        "width": "fill",
        "height": "fit",
        "inherit_color_scheme": true
      },
      "blocks": {
        "col_1": {
          "type": "group",
          "name": "t:names.column",
          "settings": {
            "content_direction": "column",
            "horizontal_alignment_flex_direction_column": "center",
            "vertical_alignment_flex_direction_column": "flex-start",
            "gap": 12,
            "width": "fill",
            "height": "fit",
            "inherit_color_scheme": false,
            "color_scheme": "scheme-4",
            "padding-block-start": 24,
            "padding-block-end": 24,
            "padding-inline-start": 24,
            "padding-inline-end": 24
          },
          "blocks": {
            "stars": {
              "type": "text",
              "settings": {
                "text": "<p>★ ★ ★ ★ ★</p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%",
                "color": "var(--color-primary)"
              }
            },
            "quote": {
              "type": "text",
              "settings": {
                "text": "<p>I am ADDICTED to this coffee! Every order is professed &amp; shipped quickly. I'm a fan for life.</p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%",
                "max_width": "normal"
              }
            },
            "author": {
              "type": "text",
              "settings": {
                "text": "<p><strong>— Kathi P.</strong></p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%"
              }
            }
          },
          "block_order": ["stars", "quote", "author"]
        },
        "col_2": {
          "type": "group",
          "name": "t:names.column",
          "settings": {
            "content_direction": "column",
            "horizontal_alignment_flex_direction_column": "center",
            "vertical_alignment_flex_direction_column": "flex-start",
            "gap": 12,
            "width": "fill",
            "height": "fit",
            "inherit_color_scheme": false,
            "color_scheme": "scheme-4",
            "padding-block-start": 24,
            "padding-block-end": 24,
            "padding-inline-start": 24,
            "padding-inline-end": 24
          },
          "blocks": {
            "stars": {
              "type": "text",
              "settings": {
                "text": "<p>★ ★ ★ ★ ★</p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%",
                "color": "var(--color-primary)"
              }
            },
            "quote": {
              "type": "text",
              "settings": {
                "text": "<p>Superior quality coffee. Guests at our home have commented on the great flavor. I've been a Yeti fan for a couple years. Now I'm mixing Yeti with Atomic Blonde.</p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%",
                "max_width": "normal"
              }
            },
            "author": {
              "type": "text",
              "settings": {
                "text": "<p><strong>— Dennis H.</strong></p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%"
              }
            }
          },
          "block_order": ["stars", "quote", "author"]
        },
        "col_3": {
          "type": "group",
          "name": "t:names.column",
          "settings": {
            "content_direction": "column",
            "horizontal_alignment_flex_direction_column": "center",
            "vertical_alignment_flex_direction_column": "flex-start",
            "gap": 12,
            "width": "fill",
            "height": "fit",
            "inherit_color_scheme": false,
            "color_scheme": "scheme-4",
            "padding-block-start": 24,
            "padding-block-end": 24,
            "padding-inline-start": 24,
            "padding-inline-end": 24
          },
          "blocks": {
            "stars": {
              "type": "text",
              "settings": {
                "text": "<p>★ ★ ★ ★ ★</p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%",
                "color": "var(--color-primary)"
              }
            },
            "quote": {
              "type": "text",
              "settings": {
                "text": "<p>Great coffee, a good amount of variety and great customer service. But really have enjoyed everything I've purchased from them. I've tried, Big Easy, Moonshiner and Gunslinger.</p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%",
                "max_width": "normal"
              }
            },
            "author": {
              "type": "text",
              "settings": {
                "text": "<p><strong>— Brian P.</strong></p>",
                "type_preset": "paragraph",
                "alignment": "center",
                "width": "100%"
              }
            }
          },
          "block_order": ["stars", "quote", "author"]
        }
      },
      "block_order": ["col_1", "col_2", "col_3"]
    }
  },
  "block_order": ["group_header", "group_columns"],
  "name": "t:names.multicolumn",
  "settings": {
    "content_direction": "column",
    "vertical_on_mobile": true,
    "horizontal_alignment_flex_direction_column": "center",
    "vertical_alignment_flex_direction_column": "flex-start",
    "gap": 24,
    "section_width": "page-width",
    "color_scheme": "scheme-1",
    "padding-block-start": 64,
    "padding-block-end": 64
  }
}
```

## 5. "Explore our blog" + "Come visit us" image tiles

Two-column layout with each column = clickable group + overlay heading. Set
each column's background image in the theme editor after pasting.

```json
"section_blog_visit": {
  "type": "section",
  "blocks": {
    "col_blog": {
      "type": "group",
      "name": "Blog tile",
      "settings": {
        "content_direction": "column",
        "horizontal_alignment_flex_direction_column": "flex-start",
        "vertical_alignment_flex_direction_column": "flex-end",
        "gap": 0,
        "width": "fill",
        "height": "custom",
        "custom_height": 60,
        "inherit_color_scheme": false,
        "color_scheme": "scheme-2",
        "toggle_overlay": true,
        "overlay_color": "#00000044",
        "overlay_style": "solid",
        "link": "/blogs/news",
        "padding-block-start": 32,
        "padding-block-end": 32,
        "padding-inline-start": 32,
        "padding-inline-end": 32
      },
      "blocks": {
        "heading": {
          "type": "text",
          "settings": {
            "text": "<h3>Explore our blog</h3>",
            "type_preset": "h4",
            "case": "uppercase",
            "alignment": "left",
            "color": "#ffffff",
            "width": "fit-content",
            "max_width": "normal"
          }
        }
      },
      "block_order": ["heading"]
    },
    "col_visit": {
      "type": "group",
      "name": "Visit tile",
      "settings": {
        "content_direction": "column",
        "horizontal_alignment_flex_direction_column": "flex-start",
        "vertical_alignment_flex_direction_column": "flex-end",
        "gap": 0,
        "width": "fill",
        "height": "custom",
        "custom_height": 60,
        "inherit_color_scheme": false,
        "color_scheme": "scheme-2",
        "toggle_overlay": true,
        "overlay_color": "#00000044",
        "overlay_style": "solid",
        "link": "/pages/contact",
        "padding-block-start": 32,
        "padding-block-end": 32,
        "padding-inline-start": 32,
        "padding-inline-end": 32
      },
      "blocks": {
        "heading": {
          "type": "text",
          "settings": {
            "text": "<h3>Come visit us</h3>",
            "type_preset": "h4",
            "case": "uppercase",
            "alignment": "left",
            "color": "#ffffff",
            "width": "fit-content",
            "max_width": "normal"
          }
        }
      },
      "block_order": ["heading"]
    }
  },
  "block_order": ["col_blog", "col_visit"],
  "name": "t:names.multicolumn",
  "settings": {
    "content_direction": "row",
    "vertical_on_mobile": true,
    "horizontal_alignment": "space-between",
    "vertical_alignment": "stretch",
    "gap": 16,
    "section_width": "page-width",
    "color_scheme": "scheme-1",
    "padding-block-start": 48,
    "padding-block-end": 48
  }
}
```

## Update to `"order"` array

Append these IDs at the end (adjust order if you want different placement):

```json
"order": [
  "hero_jVaWmY",
  "section_kETjic",
  "collection_tab_AYHJjB",
  "section_7qz96L",
  "section_values",
  "section_subscription_cta",
  "section_shop_by_category",
  "section_testimonials",
  "section_blog_visit"
]
```

## Open questions before applying

1. **Icons** — `star` / `mountain` / `lightning` values are guesses. Confirm
   they match icon keys available in the `icon` block's schema, otherwise
   pick from its dropdown after applying.
2. **Background images** — set via the theme editor after pasting
   (subscription CTA banner + both blog/visit tiles).
3. **Collection handles** — `single-origin`, `blends`, `infusion`, `seasonal`
   must match real collections; otherwise the grid will render empty cards.
