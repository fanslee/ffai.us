import { test, expect } from '@playwright/test'

test('navigate to 我的委托 from home', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('大熊猫派对 - 首页')).toBeVisible()
  await page.getByRole('button', { name: '我的委托' }).click()
  // Taro H5 typically uses hash router
  await expect(page).toHaveURL(/orders\/index/)
})
