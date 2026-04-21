import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("normal order appears in pending area", async ({ page }) => {
  await page.getByTestId("new-normal-order").click();
  await expect(page.getByTestId("pending-order-1")).toBeVisible();
  await expect(page.getByTestId("pending-order-1")).toContainText("NORMAL");
});

test("VIP order placed before normal orders", async ({ page }) => {
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-vip-order").click();

  const pending = page.getByTestId("pending-area");
  const orders = pending.locator("[data-testid^='pending-order-']");
  await expect(orders).toHaveCount(3);

  // VIP order (id=3) should be first
  await expect(orders.nth(0)).toContainText("Order #3");
  await expect(orders.nth(0)).toContainText("VIP");
  await expect(orders.nth(1)).toContainText("Order #1");
  await expect(orders.nth(2)).toContainText("Order #2");
});

test("VIP orders queue behind existing VIP orders", async ({ page }) => {
  await page.getByTestId("new-vip-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-vip-order").click();

  const orders = page
    .getByTestId("pending-area")
    .locator("[data-testid^='pending-order-']");
  await expect(orders).toHaveCount(3);

  await expect(orders.nth(0)).toContainText("Order #1");
  await expect(orders.nth(0)).toContainText("VIP");
  await expect(orders.nth(1)).toContainText("Order #3");
  await expect(orders.nth(1)).toContainText("VIP");
  await expect(orders.nth(2)).toContainText("Order #2");
  await expect(orders.nth(2)).toContainText("NORMAL");
});

test("order numbers are unique and increasing", async ({ page }) => {
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-vip-order").click();
  await page.getByTestId("new-normal-order").click();

  await expect(page.getByTestId("pending-area")).toContainText("Order #1");
  await expect(page.getByTestId("pending-area")).toContainText("Order #2");
  await expect(page.getByTestId("pending-area")).toContainText("Order #3");
});

test("bot processes order and moves it to complete after 10s", async ({
  page,
}) => {
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("add-bot").click();

  // Order should leave pending (bot picks it up)
  await expect(page.getByTestId("pending-area")).not.toContainText("Order #1");

  // Bot should show it has the order
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");

  // Wait for 10s processing
  await page.waitForTimeout(10_500);

  // Order should be in complete area
  await expect(page.getByTestId("complete-order-1")).toBeVisible();
});

test("bot becomes idle when no pending orders", async ({ page }) => {
  await page.getByTestId("add-bot").click();
  await expect(page.getByTestId("bot-1")).toContainText("Idle");
});

test("idle bot picks up new order immediately", async ({ page }) => {
  await page.getByTestId("add-bot").click();
  await expect(page.getByTestId("bot-1")).toContainText("Idle");

  await page.getByTestId("new-normal-order").click();
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
});

test("removing bot returns its order to pending", async ({ page }) => {
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("add-bot").click();

  // Bot picks up order
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");

  // Remove bot
  await page.getByTestId("remove-bot").click();

  // Order should be back in pending
  await expect(page.getByTestId("pending-order-1")).toBeVisible();
  // No bots should exist
  await expect(page.getByTestId("bot-list")).not.toBeVisible();
});

test("removing bot returns order in correct priority position", async ({
  page,
}) => {
  // Create: Normal#1, Normal#2, add bot (picks up #1), then add VIP#3
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("add-bot").click();

  // Bot picks up order #1
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");

  // Add VIP order
  await page.getByTestId("new-vip-order").click();

  // Pending should be: VIP#3, Normal#2
  const pendingOrders = page
    .getByTestId("pending-area")
    .locator("[data-testid^='pending-order-']");
  await expect(pendingOrders).toHaveCount(2);

  // Remove bot — Normal#1 should go back after VIP#3 but with other normals
  await page.getByTestId("remove-bot").click();

  await expect(pendingOrders).toHaveCount(3);
  await expect(pendingOrders.nth(0)).toContainText("Order #3"); // VIP
  // Normal orders after VIP
  await expect(pendingOrders.nth(1)).toContainText("NORMAL");
  await expect(pendingOrders.nth(2)).toContainText("NORMAL");
});

test("remove bot button disabled when no bots", async ({ page }) => {
  await expect(page.getByTestId("remove-bot")).toBeDisabled();
});

test("adding multiple orders without bots keeps all in pending", async ({
  page,
}) => {
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();

  const orders = page
    .getByTestId("pending-area")
    .locator("[data-testid^='pending-order-']");
  await expect(orders).toHaveCount(3);
  await expect(page.getByTestId("pending-order-1")).toBeVisible();
  await expect(page.getByTestId("pending-order-2")).toBeVisible();
  await expect(page.getByTestId("pending-order-3")).toBeVisible();
});

test("newest bot is removed first", async ({ page }) => {
  await page.getByTestId("add-bot").click();
  await page.getByTestId("add-bot").click();

  await expect(page.getByTestId("bot-1")).toBeVisible();
  await expect(page.getByTestId("bot-2")).toBeVisible();

  await page.getByTestId("remove-bot").click();

  await expect(page.getByTestId("bot-1")).toBeVisible();
  await expect(page.getByTestId("bot-2")).not.toBeVisible();
});

test("multiple bots process orders simultaneously", async ({ page }) => {
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();

  await page.getByTestId("add-bot").click();
  await page.getByTestId("add-bot").click();

  // Bot 1 and 2 should each pick up an order
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
  await expect(page.getByTestId("bot-2")).toContainText("Processing Order #2");

  // Order #3 should remain in pending
  await expect(page.getByTestId("pending-order-3")).toBeVisible();
});

test("bot auto-picks next order after completing one", async ({ page }) => {
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("add-bot").click();

  // Bot picks up order #1
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
  await expect(page.getByTestId("pending-order-2")).toBeVisible();

  // Wait for first order to complete
  await page.waitForTimeout(10_500);

  // Order #1 should be complete, bot should now be processing #2
  await expect(page.getByTestId("complete-order-1")).toBeVisible();
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #2");
});

test("rapid bot removal with multiple processing bots", async ({ page }) => {
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("add-bot").click();
  await page.getByTestId("add-bot").click();

  // Both bots processing
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
  await expect(page.getByTestId("bot-2")).toContainText("Processing Order #2");

  // Rapidly remove both bots
  await page.getByTestId("remove-bot").click();
  await page.getByTestId("remove-bot").click();

  // No bots should remain
  await expect(page.getByTestId("bot-list")).not.toBeVisible();

  // Both orders should be back in pending
  await expect(page.getByTestId("pending-order-1")).toBeVisible();
  await expect(page.getByTestId("pending-order-2")).toBeVisible();
});

test("removed bot's order is redistributed to idle bot", async ({ page }) => {
  // Add 2 orders, 2 bots
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("add-bot").click();
  await page.getByTestId("add-bot").click();

  // Both bots processing
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
  await expect(page.getByTestId("bot-2")).toContainText("Processing Order #2");

  // Remove bot #2 — order #2 goes back to pending
  await page.getByTestId("remove-bot").click();

  // Bot #1 is still processing order #1, so order #2 should stay in pending
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
  await expect(page.getByTestId("pending-order-2")).toBeVisible();

  // Wait for bot #1 to finish
  await page.waitForTimeout(10_500);

  // Bot #1 should now auto-pick order #2
  await expect(page.getByTestId("complete-order-1")).toBeVisible();
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #2");
});

test("removed bot's order immediately picked up by idle bot", async ({ page }) => {
  // 2 orders, 3 bots — bot#1 processes #1, bot#2 processes #2, bot#3 idle
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("add-bot").click();
  await page.getByTestId("add-bot").click();
  await page.getByTestId("add-bot").click();

  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
  await expect(page.getByTestId("bot-2")).toContainText("Processing Order #2");
  await expect(page.getByTestId("bot-3")).toContainText("Idle");

  // Remove bot#3 (newest, idle) — no order to return
  await page.getByTestId("remove-bot").click();

  // Remove bot#2 (newest now, processing order#2) — order#2 returns, bot#1 is busy
  // assignIdleBots should find no idle bot (bot#1 is processing)
  await page.getByTestId("remove-bot").click();
  await expect(page.getByTestId("pending-order-2")).toBeVisible();
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
});

test("idle bot picks up order returned from removed bot", async ({ page }) => {
  // Setup: 1 order, 2 bots
  await page.getByTestId("new-normal-order").click();
  await page.getByTestId("add-bot").click(); // bot #1 picks up order #1
  await page.getByTestId("add-bot").click(); // bot #2 idle

  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
  await expect(page.getByTestId("bot-2")).toContainText("Idle");

  // Add another order so bot #2 picks it up
  await page.getByTestId("new-normal-order").click();
  await expect(page.getByTestId("bot-2")).toContainText("Processing Order #2");

  // Now add bot #3 (idle)
  await page.getByTestId("add-bot").click();
  await expect(page.getByTestId("bot-3")).toContainText("Idle");

  // Remove bot #3 (newest, idle) — no order to return
  await page.getByTestId("remove-bot").click();

  // Remove bot #2 (newest now, processing order #2) — order #2 returns to pending
  // But bot #1 is still processing, so order #2 stays in pending
  await page.getByTestId("remove-bot").click();
  await expect(page.getByTestId("pending-order-2")).toBeVisible();
  await expect(page.getByTestId("bot-1")).toContainText("Processing Order #1");
});
