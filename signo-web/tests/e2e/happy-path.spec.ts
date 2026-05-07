import { test, expect } from '@playwright/test'

test('register -> home -> play first lesson -> see XP', async ({ page, request }) => {
  const username = 'tester' + Date.now().toString(36)

  await page.goto('/register')
  await page.getByPlaceholder('用户名（字母 / 数字 / 下划线）').fill(username)
  await page.getByPlaceholder('昵称').fill('试林友')
  await page.getByPlaceholder('密码，至少 6 位').fill('hunter22')
  await page.getByTestId('register-submit').click()

  await page.waitForURL('/')
  await expect(page.getByText('常用语', { exact: true }).first()).toBeVisible()

  await page.getByTestId('lesson-link').first().click()
  await page.waitForURL(/\/learn\//)
  const lessonId = page.url().split('/learn/')[1]
  expect(lessonId).toBeTruthy()

  // Fetch questions + answer key via the non-production test route so the run is
  // deterministic regardless of shuffled answerIndex in seed data.
  const questionsRes = await request.get(`/api/learn/lesson/${lessonId}`)
  expect(questionsRes.ok()).toBeTruthy()
  const questions: { id: string }[] = await questionsRes.json()

  const answersRes = await request.get(`/api/test/lesson-answers?lessonId=${lessonId}`)
  expect(answersRes.ok()).toBeTruthy()
  const answers: Record<string, number> = await answersRes.json()

  for (const q of questions) {
    const correct = answers[q.id]
    await expect(page.getByTestId(`choice-${correct}`)).toBeVisible({ timeout: 5000 })
    await page.getByTestId(`choice-${correct}`).click()
    await expect(page.getByTestId('answer-feedback')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('next-question').click()
  }

  await expect(page.getByTestId('lesson-complete')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('xp-gain')).toContainText(/\+\d+ XP/)
})
