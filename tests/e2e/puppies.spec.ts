import { expect, test } from "@playwright/test";

test.describe("puppy browser", () => {
  test("lists every available puppy", async ({ page }) => {
    await page.goto("/puppies");
    await expect(page.getByText("15 puppies looking for a home")).toBeVisible();
    await expect(page.locator(".tp-sketches .tp-sketch")).toHaveCount(15);
  });

  test("filters by breed and keeps the filter in the URL", async ({ page }) => {
    await page.goto("/puppies");
    await page.getByRole("button", { name: "Poodle" }).click();
    await expect(page).toHaveURL(/breed=poodle/);
    await expect(page.getByText("2 puppies match")).toBeVisible();
    await expect(page.getByRole("button", { name: "Poodle" })).toHaveAttribute("aria-pressed", "true");

    // Reloading keeps the filter.
    await page.reload();
    await expect(page.getByText("2 puppies match")).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/puppies$/);
    await expect(page.getByText("15 puppies looking for a home")).toBeVisible();
  });

  test("boy & girl litters match both gender filters", async ({ page }) => {
    await page.goto("/puppies?breed=poodle&gender=male");
    await expect(page.getByRole("link", { name: /^Toy Poodle,/ })).toBeVisible();
  });

  test("shows a friendly empty state", async ({ page }) => {
    await page.goto("/puppies?breed=cavapoo&gender=female");
    await expect(page.getByText("No puppies match just now.")).toBeVisible();
    await page.getByRole("button", { name: "Show all puppies" }).click();
    await expect(page.getByText("15 puppies looking for a home")).toBeVisible();
  });

  test("opens a puppy's storybook page", async ({ page }) => {
    await page.goto("/puppies");
    await page.getByRole("link", { name: /^Max, Maltipoo/ }).first().click();
    await expect(page).toHaveURL(/\/puppies\/maltipoo-max-male$/);
    await expect(page.getByRole("heading", { level: 1, name: "Max" })).toBeVisible();
    await expect(page.getByText("hello, it's me")).toBeVisible();
  });
});

test.describe("puppy page", () => {
  test("gallery steps through photos and videos", async ({ page }) => {
    await page.goto("/puppies/maltipoo-max-male");
    const counter = page.locator(".tp-storypage").getByText("1 / 2");
    await expect(counter).toBeVisible();
    await page.getByRole("button", { name: "Next photo" }).click();
    await expect(page.locator(".tp-storypage").getByText("2 / 2")).toBeVisible();
    await expect(page.locator(".tp-storypage video")).toHaveCount(1);
  });

  test("links to the previous and next puppy", async ({ page }) => {
    await page.goto("/puppies/maltipoo-max-male");
    const more = page.getByRole("navigation", { name: "More puppies" });
    await expect(more.getByText("Previous pup")).toBeVisible();
    await more.getByRole("link").last().click();
    await expect(page).toHaveURL(/\/puppies\/korean-teacup-maltipoo-female$/);
  });
});
