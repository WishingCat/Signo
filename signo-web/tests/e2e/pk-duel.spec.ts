import { test, expect, type BrowserContext, type Page } from '@playwright/test'

async function register(page: Page, username: string, nickname: string) {
  await page.goto('/register')
  await page.getByPlaceholder('用户名（字母 / 数字 / 下划线）').fill(username)
  await page.getByPlaceholder('昵称').fill(nickname)
  await page.getByPlaceholder('密码，至少 6 位').fill('hunter22')
  await page.getByTestId('register-submit').click()
  await page.waitForURL('/')
}

async function getFriendCode(page: Page): Promise<string> {
  await page.goto('/me')
  // /me page shows friend code; profile page has it too. Pull via DB-less route:
  // simpler: hit /api/auth/whoami if exists; otherwise use DOM scrape.
  const text = await page.locator('body').innerText()
  const match = text.match(/[A-Z0-9]{6,8}/)
  if (!match) throw new Error('friend code not found in /me page text')
  return match[0]
}

test('topic PK happy path: A invites B, both play 15 casual questions', async ({ browser }) => {
  test.setTimeout(120_000)

  const ctxA: BrowserContext = await browser.newContext()
  const ctxB: BrowserContext = await browser.newContext()
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()

  const stamp = Date.now().toString(36)
  await register(a, `a${stamp}`, '甲')
  await register(b, `b${stamp}`, '乙')

  const codeB = await getFriendCode(b)

  // A adds B as friend.
  await a.goto('/friends')
  await a.getByPlaceholder(/好友码/).fill(codeB)
  await a.getByRole('button', { name: /加好友|确认/ }).first().click()
  await expect(a.getByText('乙').first()).toBeVisible({ timeout: 5000 })

  // A goes to /pk and sends a 常用语 + casual invite.
  await a.goto('/pk')
  await a.getByTestId('pk-theme-常用语').click()
  await a.getByTestId('pk-mode-casual').click()
  await a.getByTestId('pk-friend-select').selectOption({ index: 0 })
  await a.getByTestId('pk-send-invite').click()

  // B sees inbox, accepts.
  await b.goto('/pk')
  const accept = b.getByTestId('invite-accept').first()
  await expect(accept).toBeVisible({ timeout: 8000 })
  await accept.click()

  // Both lands on /pk/match/{id}; await countdown disappears.
  await b.waitForURL(/\/pk\/match\//, { timeout: 5000 })
  await a.waitForURL(/\/pk\/match\//, { timeout: 8000 })

  await expect(a.getByTestId('duel-question').first()).toBeVisible({ timeout: 8000 })
  await expect(b.getByTestId('duel-question').first()).toBeVisible({ timeout: 8000 })

  // Pull answer key for both (test-only route).
  const matchId = a.url().split('/pk/match/')[1]
  const keyRes = await a.request.get(`/api/pk/match/${matchId}/answer-key`)
  expect(keyRes.ok()).toBeTruthy()
  const { answerKey } = (await keyRes.json()) as { answerKey: number[] }
  expect(answerKey.length).toBe(15)

  // Both answer all 15 correctly. Round only advances when both have answered.
  for (let i = 0; i < 15; i++) {
    await Promise.all([
      a.getByTestId(`duel-choice-${answerKey[i]}`).click(),
      b.getByTestId(`duel-choice-${answerKey[i]}`).click(),
    ])
    if (i < 14) {
      // Wait for the next question to render — testid stays the same but image src changes.
      // Cheap synchro: poll deadline / the choice buttons re-enable.
      await a.waitForTimeout(400)
      await b.waitForTimeout(400)
    }
  }

  await expect(a.getByTestId('duel-finished')).toBeVisible({ timeout: 10_000 })
  await expect(b.getByTestId('duel-finished')).toBeVisible({ timeout: 10_000 })

  await ctxA.close()
  await ctxB.close()
})
