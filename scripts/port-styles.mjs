#!/usr/bin/env node
/**
 * Ports the reference site's component stylesheet into readable, per-feature
 * CSS files.
 *
 * The reference ships one minified Tailwind v4 bundle. Tailwind regenerates
 * the utility layer from our own JSX, so only the hand-written parts are
 * ported: the unlayered `tp-*` component rules and their keyframes. Each rule
 * is assigned to a feature by the first `tp-*` block name it mentions; rule
 * order is preserved within a feature so the cascade behaves identically.
 *
 * Usage: node scripts/port-styles.mjs <reference.css> <out-dir>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , input, outDir] = process.argv;
if (!input || !outDir) {
  console.error("Usage: node scripts/port-styles.mjs <reference.css> <out-dir>");
  process.exit(1);
}

// Block name (text between "tp-" and the first "__"/"--") -> feature file.
const FEATURES = {
  shell: ["curtain", "runner", "header", "nav-link", "menu", "menu-link", "footer", "moon", "twinkle", "basket", "page", "page-head", "arch"],
  home: [
    "scene", "hero", "lineup", "quilt", "meet", "door", "doors", "paths", "fork", "way", "sign",
    "chat", "phone", "msg", "msg-group", "typing", "route", "clip", "passport", "book", "entry",
    "stamp", "horizon", "dusk", "photowall", "facade", "street", "snaps", "night", "qa", "home",
    "house", "lamp", "window",
  ],
  puppies: ["sketchbook", "sketch", "sketches", "sketchpad", "sticker-chip", "chips"],
  puppy: ["storybook", "storypage", "chapter", "tag", "viewer", "ribbon", "trail", "letter", "sent", "envelope"],
  families: ["memories", "wall", "polaroid", "tape"],
  "gone-home": ["tickets", "ticket", "gone-stamp", "gone-strip"],
  "how-it-works": ["journeys", "journey", "switch", "flight", "postcard", "steps", "step", "paper", "board", "ways"],
  faq: ["faqroom", "notes", "note"],
  contact: ["letterform", "blank", "post", "shopfront", "visit"],
  "not-found": ["poster"],
};
const featureOf = new Map(
  Object.entries(FEATURES).flatMap(([file, names]) => names.map((n) => [n, file])),
);

/** Split a CSS string into top-level statements, respecting strings and nesting. */
function splitTopLevel(css) {
  const out = [];
  let depth = 0;
  let start = 0;
  let quote = null;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        out.push(css.slice(start, i + 1).trim());
        start = i + 1;
      }
    } else if (c === ";" && depth === 0) {
      out.push(css.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  return out.filter(Boolean);
}

/** Pretty-print a CSS statement with two-space indentation. */
function pretty(css) {
  let out = "";
  let indent = 0;
  let quote = null;
  let paren = 0;
  const pad = () => "  ".repeat(indent);
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) {
      out += c;
      if (c === "\\") out += css[++i];
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      out += c;
    } else if (c === "(") {
      paren++;
      out += c;
    } else if (c === ")") {
      paren--;
      out += c;
    } else if (c === "{") {
      out = out.trimEnd() + " {\n";
      indent++;
      out += pad();
    } else if (c === "}") {
      out = out.trimEnd();
      if (!out.endsWith(";") && !out.endsWith("{") && !out.endsWith("}")) out += ";";
      indent--;
      out += "\n" + pad() + "}\n" + pad();
    } else if (c === ";" && paren === 0) {
      out += ";\n" + pad();
    } else if (c === ":" && paren === 0 && indent > 0 && isDeclaration(css, i)) {
      out += ": ";
    } else if (c === "," && paren === 0 && indent === 0) {
      out += ",\n";
    } else {
      out += c;
    }
  }
  return out.replace(/\n\s*\n/g, "\n").trim() + "\n";
}

// A ":" separates a property from its value only when the statement ends
// (";" or "}") before any "{" opens; otherwise it belongs to a selector such
// as `a:hover` or `html:has(...)`.
function isDeclaration(css, colon) {
  for (let i = colon + 1; i < css.length; i++) {
    const c = css[i];
    if (c === "{") return false;
    if (c === ";" || c === "}") return true;
  }
  return false;
}

const blockName = (text) => {
  const m = text.match(/\.tp-([a-z]+(?:-[a-z]+)*?)(?=__|--|[^a-z-]|$)/);
  return m ? m[1] : null;
};

function featureFor(text) {
  const name = blockName(text);
  if (!name) return null;
  if (featureOf.has(name)) return featureOf.get(name);
  // Fall back to the longest known prefix, e.g. "msg-group" -> "msg".
  const parts = name.split("-");
  while (parts.length > 1) {
    parts.pop();
    const p = parts.join("-");
    if (featureOf.has(p)) return featureOf.get(p);
  }
  return "misc";
}

// The reference also styles its admin dashboard; none of that is ported.
const isAdmin = (rule) => /\.adm-|\[data-admin\]/.test(rule.slice(0, rule.indexOf("{")));

const css = readFileSync(input, "utf8");
const topLevel = splitTopLevel(css);
const statements = topLevel.filter(
  (s) => !s.startsWith("@layer") && !s.startsWith("@property") && !isAdmin(s),
);

// Hand-written component classes (buttons, links, boards) live in the
// components layer so Tailwind utilities can still override them.
const componentsLayer = topLevel.find((s) => s.startsWith("@layer components"));
const componentRules = splitTopLevel(componentsLayer.slice(componentsLayer.indexOf("{") + 1, -1))
  .filter((rule) => !isAdmin(rule));

const files = new Map();
const keyframes = new Map();
const push = (file, text) => {
  if (!files.has(file)) files.set(file, []);
  files.get(file).push(text);
};

for (const stmt of statements) {
  if (stmt.startsWith("@keyframes")) {
    keyframes.set(stmt.match(/@keyframes\s+([\w-]+)/)[1], stmt);
    continue;
  }
  const isGroup = /^@(media|supports|container)/.test(stmt);
  if (!isGroup) {
    push(featureFor(stmt) ?? "misc", stmt);
    continue;
  }
  // Split a grouped at-rule into one copy per feature, keeping inner order.
  const head = stmt.slice(0, stmt.indexOf("{"));
  const inner = splitTopLevel(stmt.slice(stmt.indexOf("{") + 1, -1));
  const byFeature = new Map();
  for (const rule of inner) {
    const f = featureFor(rule) ?? "misc";
    if (!byFeature.has(f)) byFeature.set(f, []);
    byFeature.get(f).push(rule);
  }
  for (const [f, rules] of byFeature) push(f, `${head}{${rules.join("")}}`);
}

// Place each keyframe with the first feature whose rules reference it.
for (const [name, stmt] of keyframes) {
  const owner = [...files.entries()].find(([, rules]) => rules.some((r) => r.includes(name)));
  push(owner ? owner[0] : "misc", stmt);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "components.css"),
  `@layer components {\n${componentRules.map(pretty).join("\n").replace(/^/gm, "  ").trimEnd()}\n}\n`,
);
console.log(`components.css  ${componentRules.length} rules`);
for (const [file, rules] of files) {
  const body = rules.map(pretty).join("\n");
  writeFileSync(join(outDir, `${file}.css`), body);
  console.log(`${file}.css  ${rules.length} rules`);
}
