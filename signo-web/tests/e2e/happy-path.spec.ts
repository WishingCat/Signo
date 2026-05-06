import { test, expect } from '@playwright/test'

test('register -> home -> play first lesson -> see XP', async ({ page }) => {
  const username = 'tester' + Date.now().toString(36)

  await page.goto('/register')
  await page.getByPlaceholder('用户名（字母 / 数字 / 下划线）').fill(username)
  await page.getByPlaceholder('昵称').fill('试林友')
  await page.getByPlaceholder('密码，至少 6 位').fill('hunter22')
  await page.getByTestId('register-submit').click()

  await page.waitForURL('/')
  await expect(page.getByText('上衣', { exact: true })).toBeVisible()

  await page.getByTestId('lesson-link').first().click()
  await expect(page.getByTestId('choice-0')).toBeVisible()

  for (let i = 0; i < 4; i += 1) {
    await expect(page.getByTestId(`choice-${i}`)).toBeVisible({ timeout: 5000 })
    await page.getByTestId(`choice-${i}`).click()
  }

  await expect(page.getByTestId('lesson-complete')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('xp-gain')).toContainText(/\+\d+ XP/)
})
