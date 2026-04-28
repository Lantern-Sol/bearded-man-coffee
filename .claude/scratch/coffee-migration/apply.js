// Applies each product update via `shopify store execute`.
// Usage: node apply.js [--exclude handle1,handle2]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE = "vwzfnb-90.myshopify.com";

const MUTATION = `mutation MigrateCoffee($product: ProductUpdateInput!) {
  productUpdate(product: $product) {
    product {
      id
      handle
      category { fullName }
      metafields(first: 5, namespace: "custom") { nodes { key value } }
    }
    userErrors { field message }
  }
}`;

const QUERY_FILE = path.join(__dirname, "_mutation.graphql");
fs.writeFileSync(QUERY_FILE, MUTATION);

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1]]);
    return acc;
  }, []),
);
const excluded = new Set((args.exclude || "").split(",").filter(Boolean));

const plan = JSON.parse(fs.readFileSync(path.join(__dirname, "plan.json"), "utf8"));
const targets = plan.filter((p) => !excluded.has(p.handle));

console.log(`Applying ${targets.length} product updates (excluded: ${[...excluded].join(", ") || "none"})`);

const results = [];
for (const item of targets) {
  const variables = JSON.stringify({ product: item.input });
  const varsFile = `_vars-${item.handle}.json`;
  const outFile = `_out-${item.handle}.json`;
  fs.writeFileSync(path.join(__dirname, varsFile), variables);

  const res = spawnSync(
    "shopify",
    [
      "store",
      "execute",
      "--allow-mutations",
      "--json",
      "--store",
      STORE,
      "--query-file",
      "_mutation.graphql",
      "--variable-file",
      varsFile,
      "--output-file",
      outFile,
    ],
    { encoding: "utf8", cwd: __dirname, shell: true },
  );

  fs.unlinkSync(path.join(__dirname, varsFile));

  let parsed = null;
  let parseError = null;
  const outPath = path.join(__dirname, outFile);
  if (fs.existsSync(outPath)) {
    try {
      parsed = JSON.parse(fs.readFileSync(outPath, "utf8"));
    } catch (e) {
      parseError = e.message;
    }
    fs.unlinkSync(outPath);
  } else {
    parseError = `no output file (exit=${res.status})`;
  }

  const userErrors = parsed?.productUpdate?.userErrors ?? [];
  const ok = res.status === 0 && userErrors.length === 0 && parsed != null;
  results.push({
    handle: item.handle,
    title: item.title,
    action: item.action,
    flags: item.flags,
    ok,
    userErrors,
    parseError,
    exitCode: res.status,
  });
  console.log(
    `${ok ? "✓" : "✗"} ${item.handle.padEnd(22)} ${item.action.padEnd(15)} ${ok ? "" : "ERR " + JSON.stringify(userErrors)}${parseError ? " parseErr=" + parseError : ""}`,
  );
}

fs.writeFileSync(
  path.join(__dirname, "results.json"),
  JSON.stringify(results, null, 2),
);
const failed = results.filter((r) => !r.ok);
console.log(`\nDone. ${results.length - failed.length}/${results.length} succeeded.`);
if (failed.length) {
  console.log("Failures:", failed.map((f) => f.handle).join(", "));
  process.exit(1);
}
