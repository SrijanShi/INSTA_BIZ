import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/", heading: /Premium teacup\s*puppies in Dubai/ },
  { path: "/puppies", heading: "Available puppies" },
  { path: "/puppies/maltipoo-max-male", heading: "Max" },
  { path: "/puppies/pomeranian-ace-boy", heading: "Ace" },
  { path: "/happy-families", heading: /Happy families/ },
  { path: "/gone-home", heading: /Gone home/ },
  { path: "/how-it-works", heading: "How it works" },
  { path: "/faq", heading: "Questions & answers" },
  { path: "/contact", heading: "Get in touch with us" },
];

for (const { path, heading } of PAGES) {
  test(`${path} renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    // Every page has the shared header and footer.
    await expect(page.getByRole("link", { name: "TeddyPups U.A.E. — home" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("Home, at last.");
  });
}

test("unknown pages show the lost poster with a 404 status", async ({ page }) => {
  const response = await page.goto("/this-page-wandered-off");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("have you seen this page?")).toBeVisible();
  await page.getByRole("link", { name: "Puppies" }).last().click();
  await expect(page).toHaveURL(/\/puppies$/);
});

test("sitemap lists every puppy", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/puppies/maltipoo-max-male");
  expect(xml.match(/\/puppies\//g)?.length).toBe(42);
});

test("WhatsApp links open a chat with a pre-written message", async ({ page }) => {
  await page.goto("/");
  const href = await page.getByRole("link", { name: "Enquire on WhatsApp" }).first().getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/971541676733\?text=Hi%20TeddyPups!/);
});
