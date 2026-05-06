import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { getReviewSet } from '@/lib/curriculum/service'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const questions = await getReviewSet(user.id, 6)
  return NextResponse.json(questions)
}
