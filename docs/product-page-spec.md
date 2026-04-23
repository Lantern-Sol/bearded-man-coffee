# Product (PDP) build spec — Coffee products

Reference design: Atomic Blonde product page (see discussion 2026-04-22).

This doc captures everything a future session needs to finish the PDP without
re-deriving context. The card-side work (roast label badge + variants +
metafield definitions) is already done — this spec is strictly for the product
page rendering that was deferred.

## Context already in place

Store: `vwzfnb-90.myshopify.com` (Bearded Man Coffee).

**Metafield definitions** (all `ownerType: PRODUCT`, `storefront: PUBLIC_READ`).
Most are *category metafields* scoped to Shopify taxonomy category
**`gid://shopify/TaxonomyCategory/fb-1-3`** — "Food, Beverages & Tobacco >
Beverages > Coffee" — so they only surface in the admin for products assigned
to that category. `custom.card_flavor_notes` is intentionally *not* scoped,
because it's a generic card-display label that any product (coffee, apparel,
merch) may want to use.

| Key | Scope | Type | Purpose | Example |
|---|---|---|---|---|
| `custom.roast_label` | Coffee category | `single_line_text_field` | Label shown on card + PDP gallery badge | `Light Roast` |
| `custom.card_flavor_notes` | All products | `single_line_text_field` | Short label shown under product title on card. Display name in admin: "Card Notes - Label" | `Vanilla \| Cayenne` |
| `custom.roast_profile` | Coffee category | `number_integer` (1–5) | PDP roast slider (light → dark) | `2` |
| `custom.signature_infusion` | Coffee category | `single_line_text_field` | PDP "Signature Infusion" row | `Vanilla & Cayenne` |
| `custom.tasting_notes` | Coffee category | `single_line_text_field` | PDP "Tasting Notes" row | `Vanilla, subtle cayenne heat, smooth, light-bodied` |
| `custom.card_hover_background` | Coffee category | `color` | Background color shown on card hover panel | `#5c3a2a` |
| `custom.card_hover_icon` | Coffee category | `file_reference` (image) | Icon shown on card hover panel | uploaded image |
| `custom.card_hover_tagline` | Coffee category | `single_line_text_field` | Tagline shown on card hover panel | `Where smooth meets just enough edge.` |

Populated values:
- All four coffee products have `roast_label` and `card_flavor_notes` set.
- Atomic Blonde also has `roast_profile`, `signature_infusion`, and
  `tasting_notes` seeded from the design.
- 5 O'Clock Shadow has `card_hover_tagline` ("Where smooth meets just enough
  edge.") and `card_hover_background` (`#5c3a2a`) seeded. `card_hover_icon`
  is blank — merchant uploads the tree icon in admin.
- The other three coffees (Atomic Blonde, Babyface Decaf, Bandholz) have
  hover panel fields blank, and 5 O'Clock Shadow / Babyface Decaf / Bandholz
  have the remaining PDP fields blank — merchant fills them in the admin
  once the PDP consumes them.

The hover panel only renders when the product card gallery block has
"Show hover label" enabled AND the product has a `card_hover_tagline`
populated.

All four coffee products are assigned to category `fb-1-3`, so the metafields
appear automatically in the admin under the product's "Category metafields"
section.

**Variants** — each coffee product now has 8 variants:
- Option 1 `Coffee Pack Size`: `2.5 oz`, `12 oz`, `5 lb (80 oz)`, `Single Serve 24 Pack`
- Option 2 `Grind`: `Ground`, `Whole Bean`
- All priced at `$5.00` (dummy — merchant to adjust per size tier)

**Coffee products & IDs**:
- 5 O'Clock Shadow — `gid://shopify/Product/9130418012417` — Light-Medium Roast
- Atomic Blonde — `gid://shopify/Product/9130418045185` — Light Roast
- Babyface Decaf — `gid://shopify/Product/9130418110721` — Medium Roast
- Bandholz — `gid://shopify/Product/9130418176257` — Medium Roast

## What the PDP needs to render

Working from the Atomic Blonde screenshot, the right column contains (top to
bottom):

1. **Roast label badge** overlaying the gallery image — top-left, same visual
   treatment as the card badge (already rendered via
   `blocks/_product-card-gallery.liquid`). The PDP gallery is a separate block
   (likely `blocks/_product-media-gallery.liquid` or a featured-product
   variant), so the badge rendering needs to be ported there. Reuse the
   `.product-badges` / `.product-badges__badge` classes and read
   `product.metafields.custom.roast_label`.

2. **Title, rating, price** — existing theme blocks handle these, but the
   price block shows a compare-at/sale layout by default. The design shows a
   "$5.00 / $4.25 SAVE 15%" treatment where the $4.25 is a subscription price.
   Subscription is explicitly out of scope — leave as straight price for now.

3. **Short description** — existing `product.description` or the theme's
   description block, truncated to the teaser paragraph shown in the design.
   The long-form description lives below in the Description tab.

4. **Variant selectors** — Shopify auto-renders these from the `Coffee Pack
   Size` and `Grind` options. Verify the built-in `variant-picker` /
   `swatches` block shows them as pill buttons matching the design (the design
   shows boxed rectangular buttons, not dropdowns).

5. **Purchase options** — the design shows a "One-time Purchase" / "Subscription"
   radio card pair. Subscription is out of scope, so omit the radio cards and
   just keep the standard add-to-cart flow. If Subscription is later added via
   an app, revisit.

6. **Quantity + Add to cart** — existing theme blocks.

7. **Free shipping banner** — "Free shipping on all orders $75+". This is a
   static trust-badge style line. Add as a `text` block or a dedicated
   trust-badge snippet positioned below the add-to-cart button.

### Description tab body (below the main buy box)

The tabbed "DESCRIPTION / ADDITIONAL INFORMATION" panel in the design shows a
structured content block sourced entirely from metafields:

1. **ROAST PROFILE** — label "LIGHT" on left, "DARK" on right, five dots in
   between, with the dot at position `custom.roast_profile` filled in. Needs
   a new block `blocks/product-roast-profile.liquid` that:
   - Reads `product.metafields.custom.roast_profile.value` (integer 1–5)
   - Renders 5 dots, filled up to that index
   - Shows "LIGHT" / "DARK" bookend labels
   - Falls back to hidden if metafield is blank

2. **SIGNATURE INFUSION** — heading + `custom.signature_infusion` value on
   next line. Just a two-line key/value. Can be a generic metafield-display
   block or a small dedicated one.

3. **TASTING NOTES** — heading + `custom.tasting_notes` value. Same pattern
   as Signature Infusion.

4. **Long description** — free-form paragraphs from `product.description`
   (the HTML description field in the admin). Example from Atomic Blonde:
   > Easy going at first sip. Then it wakes you up.
   > Atomic Blonde brings smooth, velvety vanilla up front with a light body…

   These are already in `product.description` — reuse the existing
   description block.

### Suggested new blocks

- `blocks/product-roast-profile.liquid` — dots slider. Schema settings: gap,
  dot size, filled color, track color, block-level padding.
- `blocks/product-metafield-row.liquid` — reusable "HEADING \n value" block
  with a metafield key setting. Avoids one-off blocks for Signature Infusion
  and Tasting Notes. Schema picks any `product.metafields.custom.*` key by
  namespace+key text input, with optional heading override.
- Optional: `blocks/product-roast-label.liquid` standalone (instead of
  baking the badge into `_product-media-gallery.liquid` directly). Gives the
  merchant drag-and-drop placement on the PDP.

### Where the PDP lives

Check `templates/product.json` for the PDP template. The right column is
usually a section with `_featured-product` or similar, and blocks are added to
it. Current template is the default Horizon product template — inspect before
editing. The featured-product section already has a `_featured-product-gallery`
block that's the counterpart to `_product-card-gallery` on cards.

## Implementation notes / gotchas

- Metafield reads in Liquid: `{{ product.metafields.custom.roast_label.value }}`.
  Don't forget `.value` — without it you get the metafield object, not the
  string.
- The roast_profile metafield is an integer. When looping `1..5` to render
  dots, compare `forloop.index <= product.metafields.custom.roast_profile.value`.
- Storefront API access is set to `PUBLIC_READ` so Hydrogen/headless clients
  can read these too — don't change to `NONE` without a reason.
- The existing card badge rendering is in
  `blocks/_product-card-gallery.liquid`; grep for `roast_label` to see the
  pattern. Port that pattern, don't re-derive.
- Shopify's variant picker defaults to showing each option separately. The
  design shows "Coffee Pack Size" and "Grind" as two labeled groups with pill
  buttons — the theme's built-in swatches block should already do this, but
  verify the option name label ("Coffee Pack Size: 12 oz") renders.

## Things left intentionally open

- **Variant pricing** — all 8 variants per product are $5.00. Design shows
  "From $5.00" which still holds, but realistically a 5 lb bag should cost
  more than 2.5 oz. Merchant decision.
- **Subscription** — explicitly skipped. If added later, the design's
  one-time/subscription radio cards would come from a subscription app's
  Liquid tags.
- **Reviews** — "8 reviews" shown in design is from a reviews app (Shopify
  Product Reviews, Judge.me, etc.). Not installed yet; leave placeholder.
- **Tabs** — "DESCRIPTION / ADDITIONAL INFORMATION" as tabs vs. stacked.
  Horizon theme doesn't ship tabs by default; either use an app block, a
  custom tabs block, or render both panels stacked.

## Commands for re-auth (if starting fresh)

```bash
shopify store auth --store vwzfnb-90.myshopify.com --scopes write_products,read_products,write_metaobject_definitions,read_metaobject_definitions
```

All metafield definitions + variant option setup already exist in the store —
no mutations needed on a fresh session, just theme work.
