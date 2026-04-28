// Plans the Bearded Man Coffee description-to-metafields migration.
// Usage:
//   node plan.js products.json > plan.json
// products.json is the raw output of the products query (the one with nodes[]).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COFFEE_CATEGORY_ID = "gid://shopify/TaxonomyCategory/fb-1-3";

const ROAST_METAOBJECT = {
  Light: "gid://shopify/Metaobject/400787964161",
  "Light-Medium": "gid://shopify/Metaobject/400090759425",
  Medium: "gid://shopify/Metaobject/400089776385",
  "Medium-Dark": "gid://shopify/Metaobject/400787996929",
  Dark: "gid://shopify/Metaobject/400788029697",
};

// Manual signature-infusion guesses for products with "Seasonal Blend" line
// (no explicit Signature Infusion). Inferred from tasting notes; flagged.
const SEASONAL_INFUSION_GUESS = {
  "fu-man-chai": "Spiced Apple Chai",
  winterstache: "Coconut Cocoa",
  "autumn-bliss": "Pumpkin Spice",
};

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

// Extract text content of each top-level <p>...</p> block.
function paragraphs(html) {
  const matches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  return matches.map((m) => ({
    raw: m[0],
    text: stripTags(m[1]),
  }));
}

function parseRoast(text) {
  // "Roast: Medium (3/5)" or "Roast: Light-Medium (2/5)"
  const m = text.match(/^Roast\s*:\s*(.+?)\s*\((\d)\s*\/\s*5\)\s*$/i);
  if (!m) return null;
  return { label: m[1].trim(), level: Number(m[2]) };
}

function parseTastingNotes(text) {
  const m = text.match(/^Tasting\s*Notes\s*:\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

function parseSecondLine(text) {
  // Possible forms: "Origin: ...", "Signature Infusion: ...", "Seasonal Blend"
  if (/^Seasonal\s*Blend\s*$/i.test(text)) {
    return { kind: "seasonal", value: null };
  }
  let m = text.match(/^Signature\s*Infusion\s*:\s*(.+)$/i);
  if (m) return { kind: "signature", value: m[1].trim() };
  m = text.match(/^Origin\s*:\s*(.+)$/i);
  if (m) return { kind: "origin", value: m[1].trim() };
  return null;
}

function planProduct(product) {
  const flags = [];
  const out = {
    id: product.id,
    handle: product.handle,
    title: product.title,
    flags,
    skip: false,
  };

  // Mountain Berry: just add category, no parsing.
  if (product.handle === "mountain-berry") {
    out.action = "category-only";
    out.input = {
      id: product.id,
      category: COFFEE_CATEGORY_ID,
    };
    flags.push(
      "Description has no coffee structure — only category was added. Manual review needed.",
    );
    return out;
  }

  const ps = paragraphs(product.descriptionHtml || "");
  if (ps.length === 0) {
    out.action = "category-only";
    out.input = { id: product.id, category: COFFEE_CATEGORY_ID };
    flags.push("Description is empty / unparseable.");
    return out;
  }

  // Find the structured leading lines: roast, secondLine, tastingNotes.
  // Walk paragraphs in order; first three "structured" lines should match.
  const structuredIndices = [];
  let roast = null;
  let secondLine = null;
  let tastingNotes = null;

  for (let i = 0; i < Math.min(ps.length, 6); i++) {
    const t = ps[i].text;
    if (!t) {
      structuredIndices.push(i); // empty <p></p> separator after structured block
      continue;
    }
    if (!roast) {
      const r = parseRoast(t);
      if (r) {
        roast = r;
        structuredIndices.push(i);
        continue;
      }
    }
    if (roast && !secondLine) {
      const s = parseSecondLine(t);
      if (s) {
        secondLine = s;
        structuredIndices.push(i);
        continue;
      }
    }
    if (roast && !tastingNotes) {
      const tn = parseTastingNotes(t);
      if (tn) {
        tastingNotes = tn;
        structuredIndices.push(i);
        continue;
      }
    }
    // First non-structured paragraph after we've found roast: stop.
    if (roast) break;
  }

  // Also consume an immediately-following empty paragraph (the "<p></p>" gap).
  const lastStruct = structuredIndices.length
    ? Math.max(...structuredIndices)
    : -1;
  if (
    lastStruct >= 0 &&
    ps[lastStruct + 1] &&
    ps[lastStruct + 1].text === ""
  ) {
    structuredIndices.push(lastStruct + 1);
  }

  if (!roast) {
    out.action = "category-only";
    out.input = { id: product.id, category: COFFEE_CATEGORY_ID };
    flags.push("No Roast line detected — only category was added.");
    return out;
  }

  // Determine signature infusion value.
  let sigInfusion = null;
  if (secondLine?.kind === "signature") {
    sigInfusion = secondLine.value;
  } else if (secondLine?.kind === "seasonal") {
    sigInfusion = SEASONAL_INFUSION_GUESS[product.handle] || null;
    flags.push(
      `Signature Infusion inferred from Seasonal Blend (tasting notes "${tastingNotes ?? "n/a"}") → "${sigInfusion}". Manual review.`,
    );
  } else if (secondLine?.kind === "origin") {
    // Origin coffees: no signature infusion. Not flagged.
    sigInfusion = null;
  } else {
    flags.push("Could not detect second line (Origin/Signature/Seasonal).");
  }

  // Lookup roast metaobject reference by closest match.
  const roastLabel = roast.label;
  const roastMetaobjectId = ROAST_METAOBJECT[roastLabel];
  if (!roastMetaobjectId) {
    flags.push(`Unknown roast label "${roastLabel}" — Roast metaobject not set.`);
  }

  // Build cleaned description: remove paragraphs at structuredIndices.
  const keepHtml = ps
    .map((p, i) => (structuredIndices.includes(i) ? null : p.raw))
    .filter(Boolean)
    .join("\n");

  // Build metafields list.
  const metafields = [
    {
      namespace: "custom",
      key: "roast_profile",
      type: "number_integer",
      value: String(roast.level),
    },
  ];
  if (tastingNotes) {
    metafields.push({
      namespace: "custom",
      key: "tasting_notes",
      type: "single_line_text_field",
      value: tastingNotes,
    });
  } else {
    flags.push("No Tasting Notes line detected.");
  }
  if (sigInfusion) {
    metafields.push({
      namespace: "custom",
      key: "signature_infusion",
      type: "single_line_text_field",
      value: sigInfusion,
    });
  }
  if (roastMetaobjectId) {
    metafields.push({
      namespace: "shopify",
      key: "coffee-roast",
      type: "list.metaobject_reference",
      value: JSON.stringify([roastMetaobjectId]),
    });
  }

  out.action = "full-migrate";
  out.parsed = { roast, secondLine, tastingNotes, sigInfusion };
  out.input = {
    id: product.id,
    category: COFFEE_CATEGORY_ID,
    descriptionHtml: keepHtml,
    metafields,
  };
  return out;
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node plan.js <products.json>");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const nodes = data.products?.nodes ?? data.nodes ?? data;
const plans = nodes.map(planProduct);
console.log(JSON.stringify(plans, null, 2));
