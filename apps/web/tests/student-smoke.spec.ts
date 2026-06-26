import { expect, test } from "@playwright/test";

const apiBaseURL = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8000";

test("Home to Task1 submit to Task2", async ({ page }) => {
  await page.request.post(`${apiBaseURL}/v1/dev/reset`);
  await page.goto("/student");
  await expect(page.getByText("Today's Task")).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page).toHaveURL(/\/student\/tasks\/UI01$/);
  await expect(page.getByRole("heading", { name: "Label the parts of a plant" })).toBeVisible();

  await page.getByRole("combobox", { name: "Choose label for A" }).selectOption("leaf");
  await page.getByRole("combobox", { name: "Choose label for B" }).selectOption("stem");
  await page.getByRole("combobox", { name: "Choose label for C" }).selectOption("seed");
  await page.getByRole("combobox", { name: "Choose label for D" }).selectOption("root");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.locator(".task-result-card h2")).toHaveText("4 of 4 correct");
  await page.getByRole("button", { name: "Next task" }).click();

  await expect(page).toHaveURL(/\/student\/tasks\/UI02$/);
  await expect(page.getByRole("heading", { name: "Classify photosynthesis inputs and outputs" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Classify sunlight" })).toBeVisible();
});
