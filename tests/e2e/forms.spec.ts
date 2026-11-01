import { expect, test } from "@playwright/test";

test.describe("puppy enquiry form", () => {
  test("validates on the server, then confirms", async ({ page }) => {
    await page.goto("/puppies/maltipoo-max-male");
    const form = page.locator("#enquire-maltipoo-max-male form");
    await expect(form.getByLabel("Message")).toHaveValue("Hi! I'd love to know more about Max (Maltipoo).");

    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(form.getByRole("alert")).toHaveText("Please check the highlighted details.");
    await expect(form.getByText("Please tell us your name.")).toBeVisible();
    await expect(form.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");

    await form.getByLabel("Your name").fill("Test Visitor");
    await form.getByLabel("Phone or WhatsApp").fill("12");
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(form.getByText(/valid number with country code/)).toBeVisible();

    await form.getByLabel("Phone or WhatsApp").fill("+971 50 123 4567");
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("Message received!")).toBeVisible();
  });
});

test.describe("contact letter", () => {
  test("posts the letter and shows the thank-you note", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Post my letter" }).click();
    await expect(page.locator(".tp-letterform__alert")).toContainText("Please check the highlighted details.");
    // The first blank that needs attention gets focus.
    await expect(page.getByLabel("Your name (required)")).toBeFocused();

    await page.getByLabel("Your name (required)").fill("Test Visitor");
    await page.getByLabel(/Phone or WhatsApp number/).fill("+971 50 123 4567");
    await page.getByLabel("Puppy you're interested in (optional)").selectOption({ label: "Max (Maltipoo, boy)" });
    await page.getByRole("button", { name: "Post my letter" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Message received!" })).toBeVisible();
  });
});
