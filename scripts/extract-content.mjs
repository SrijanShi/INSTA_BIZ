#!/usr/bin/env node
/**
 * Extracts the reference site's content into typed JSON under src/content/.
 *
 * Next.js App Router pages embed their React Server Component payload in
 * `self.__next_f.push([1, "..."])` script tags. Client components receive
 * their data as plain JSON props inside that payload, so the content can be
 * recovered exactly (including image focal points and blur placeholders)
 * without scraping rendered text.
 *
 * Usage: node scripts/extract-content.mjs <dir-with-downloaded-html>
 *   expects: index.html, puppies.html, happy-families.html, gone-home.html,
 *            faq.html and puppy/<slug>.html for every puppy.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , dir] = process.argv;
if (!dir) {
  console.error("Usage: node scripts/extract-content.mjs <dir>");
  process.exit(1);
}
const outDir = new URL("../src/content/", import.meta.url).pathname;

/** Concatenate a page's RSC payload chunks into one string. */
function rscPayload(file) {
  const html = readFileSync(join(dir, file), "utf8");
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)];
  return chunks.map((m) => JSON.parse(`"${m[1]}"`)).join("");
}

/** Parse the JSON value that follows `"key":` (searching from `from`). */
function propAfter(payload, key, from = 0) {
  const at = payload.indexOf(`"${key}":`, from);
  if (at < 0) throw new Error(`prop "${key}" not found`);
  const start = at + key.length + 3;
  // Walk to the end of the JSON value by bracket matching.
  let depth = 0;
  let inString = false;
  for (let i = start; i < payload.length; i++) {
    const c = payload[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) return { value: JSON.parse(payload.slice(start, i + 1)), end: i + 1 };
    }
  }
  throw new Error(`unterminated prop "${key}"`);
}

/** First `key` prop whose value satisfies `predicate`. */
function findProp(payload, key, predicate) {
  for (let from = 0; ; ) {
    const found = propAfter(payload, key, from);
    if (predicate(found.value)) return found;
    from = found.end;
  }
}

/** RSC dedupes repeated objects as "$..." path references; we never keep those. */
function assertNoRefs(label, value) {
  const refs = JSON.stringify(value).match(/"\$[a-zA-Z@][^"]*"/g);
  if (refs) throw new Error(`${label} contains RSC references: ${refs.slice(0, 3).join(", ")}`);
}

const write = (name, value) => {
  writeFileSync(join(outDir, name), JSON.stringify(value, null, 2) + "\n");
  console.log(`src/content/${name}`);
};

mkdirSync(outDir, { recursive: true });

// Available puppies: the /puppies browser receives complete puppy objects.
const listing = rscPayload("puppies.html");
const listed = propAfter(listing, "puppies");
const available = listed.value;
available.forEach((p) => assertNoRefs(`puppy ${p.slug}`, p));

// Gone-home puppies are only rendered on the server, so rebuild the same
// shape from their ticket (gone-home.html) and detail page (viewer media
// prop + the Breed / Boy or girl / Age / Where facts).
const GENDERS = { Boy: "male", Girl: "female", "Boy & girl": "male-female" };
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const goneHtml = readFileSync(join(dir, "gone-home.html"), "utf8");
const tickets = [...goneHtml.matchAll(/<li class="tp-ticket"[\s\S]*?<\/a><\/li>/g)].map(([li]) => ({
  slug: li.match(/href="\/puppies\/([a-z0-9-]+)"/)[1],
  name: li.match(/tp-ticket__name">([^<]*)</)[1],
  meta: li.match(/tp-ticket__meta">([^<]*)</)[1],
  from: li.match(/tp-ticket__route"><span>([^<]*)</)[1],
}));

const gone = tickets.map((ticket, i) => {
  const page = rscPayload(join("puppy", `${ticket.slug}.html`));
  const media = findProp(page, "media", Array.isArray).value;
  assertNoRefs(`media ${ticket.slug}`, media);
  const texts = [...page.matchAll(/"children":"([^"$\\]{1,200})"/g)].map((m) => m[1]);
  const start = texts.indexOf("the day they went home");
  const fact = (label) => {
    const at = texts.indexOf(label, start);
    return at < 0 ? undefined : texts[at + 1];
  };
  const breed = fact("Breed");
  // A few pages render the gender row differently; the ticket still says e.g.
  // "Pomsky, boy".
  const ticketGender = ticket.meta.split(", ").at(-1);
  const pageGender = fact("Boy or girl");
  const genderLabel = pageGender in GENDERS ? pageGender : ticketGender[0].toUpperCase() + ticketGender.slice(1);
  const local = fact("Where") !== "Imported for you";
  const viewerName = page.match(/"name":"([^"]*)","media":\[/)[1];
  return {
    id: `gone-${i + 1}`,
    slug: ticket.slug,
    // Unnamed puppies are listed by breed (e.g. "Pomeranian", "Boy").
    name: viewerName === breed ? "" : viewerName,
    displayName: ticket.name,
    breed,
    gender: GENDERS[genderLabel],
    genderLabel,
    age: fact("Age") ?? "",
    colour: "",
    description: "",
    records: [],
    status: "gone-home",
    featured: false,
    seoDescription: "",
    cover: media[0],
    media,
    origin: local ? { slug: "local", name: "In Dubai" } : { slug: "imported", name: "Imported" },
    collections: [],
    breeds: [{ slug: slugify(breed), name: breed }],
    published: true,
    wentHomeFrom: ticket.from,
  };
});

write("puppies.json", [...available, ...gone]);

// Breeds offered as filters on /puppies (follows the puppies prop).
const breeds = propAfter(listing, "breeds", listed.end).value;
assertNoRefs("breeds", breeds);
write("breeds.json", breeds);

// Happy families photo wall.
const photos = propAfter(rscPayload("happy-families.html"), "photos").value;
assertNoRefs("photos", photos);
write("families.json", photos);

// FAQs.
const faqs = propAfter(rscPayload("faq.html"), "faqs").value;
assertNoRefs("faqs", faqs);
write("faqs.json", faqs);

// Home page sections are CMS records: { key, heading, body, data, media }.
const home = rscPayload("index.html");
const sections = {};
for (let from = 0; ; ) {
  const at = home.indexOf('{"section":', from);
  if (at < 0) break;
  const { value, end } = propAfter(home, "section", at);
  sections[value.key] = value;
  from = end;
}
// Media of sections can be deduped references; resolve them by id from the
// puppies and photos we already have.
const mediaById = new Map(
  [...available, ...gone].flatMap((p) => [p.cover, ...p.media]).concat(photos).filter(Boolean).map((m) => [m.id, m]),
);
for (const s of Object.values(sections)) {
  s.media = (s.media ?? []).map((m) => (typeof m === "string" ? null : (mediaById.get(m.id) ?? m))).filter(Boolean);
}
write("sections.json", sections);
