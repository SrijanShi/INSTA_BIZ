import { expect, test } from "@playwright/test";

test.describe("mobile menu", () => {
  test.skip(({ isMobile }) => !isMobile, "The menu button only shows on small screens");

  test("opens, navigates and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Site menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByText("where to, friend?")).toBeVisible();
    await menu.getByRole("link", { name: "Happy families" }).click();
    await expect(page).toHaveURL(/\/happy-families$/);
    await expect(menu).toBeHidden();
  });

  test("shows the sticky WhatsApp and call bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+971541676733");
  });
});

test("header marks the current section with a paw", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop navigation");
  await page.goto("/puppies/maltipoo-max-male");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Puppies" })).toHaveAttribute("aria-current", "page");
});

test.describe("FAQ notes board", () => {
  test("unfolds a note to show its answer", async ({ page }) => {
    await page.goto("/faq");
    const question = page.getByRole("button", { name: "Do you deliver?" });
    await expect(question).toHaveAttribute("aria-expanded", "false");
    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/We deliver within Dubai/)).toBeVisible();
  });

  test("search filters and highlights notes", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.getByText("9 notes on the board")).toBeVisible();
    await page.getByLabel("sniff out a question").fill("Korea");
    await expect(page.getByText(/notes? found/)).toHaveText("2 notes found");
    await expect(page.locator(".tp-note mark").first()).toHaveText(/korea/i);
    await page.getByLabel("sniff out a question").fill("unicorn");
    await expect(page.getByText("No note about “unicorn” yet.")).toBeVisible();
  });
});

test("how it works switches between the two ways home", async ({ page }) => {
  await page.goto("/how-it-works");
  const imported = page.getByRole("tab", { name: /Imported/ });
  await expect(page.getByRole("tab", { name: /In Dubai/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Meet your puppy in person" })).toBeVisible();
  await imported.click();
  await expect(imported).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Order upon request" })).toBeVisible();
  // Arrow keys move between tabs.
  await imported.press("ArrowLeft");
  await expect(page.getByRole("heading", { name: "Meet your puppy in person" })).toBeVisible();
});

test("photo wall opens the viewer and steps through photos", async ({ page }) => {
  await page.goto("/happy-families");
  await page.getByRole("button", { name: /^Open photo 1 of 64/ }).click();
  const viewer = page.getByRole("dialog", { name: "Photo viewer" });
  await expect(viewer.getByText(/^1 \/ 64/)).toBeVisible();
  await viewer.getByRole("button", { name: "Next" }).click();
  await expect(viewer.getByText(/^2 \/ 64/)).toBeVisible();
  await viewer.getByRole("button", { name: "Close" }).click();
  await expect(viewer).toBeHidden();
});
