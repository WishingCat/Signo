import { test, expect } from '@playwright/test'

test('register -> home -> play first lesson -> see XP', async ({ page }) => {
  const username = 'tester' + Date.now().toString(36)

  await page.goto('/register')
  await page.getByPlaceholder('用户名').fill(username)
  await page.getByPlaceholder('昵称').fill('试林友')
  await page.getByPlaceholder('密码（至少 6 位）').fill('hunter22')
  await page.getByRole('button', { name: '注册' }).click()

  await page.waitForURL('/')
  await expect(page.getByText('上衣')).toBeVisible()

  // Enter first lesson
  await page.getByRole('button', { name: '开始' }).first().click()
  await expect(page.getByText(/第 1 \/ \d+ 题/)).toBeVisible()

  // Answer 4 questions. Correct index equals question order (seed design).
  for (let i = 0; i < 4; i += 1) {
    await expect(page.getByText(new RegExp(`第 ${i + 1} \\/ \\d+ 题`))).toBeVisible()
    await page.getByTestId(`choice-${i}`).click()
  }

  await expect(page.getByText('关卡完成')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/获得 \+\d+ XP/)).toBeVisible()
})
