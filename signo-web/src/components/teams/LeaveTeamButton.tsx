'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Props = {
  teamId: string
  /** owner 退出时 UI 语义略有不同 */
  isOwner: boolean
}

export function LeaveTeamButton({ teamId, isOwner }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function leave() {
    setBusy(true)
    try {
      await fetch(`/api/teams/${teamId}/leave`, { method: 'POST' })
      router.push('/teams')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="ink"
        size="md"
        className="text-ochre border-ochre/40 w-full"
        onClick={() => setConfirming(true)}
      >
        {isOwner ? '移交并退出' : '退出队伍'}
      </Button>
    )
  }
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-bark/70 text-center">
        {isOwner
          ? '你是队长，退出后将把队伍转给最早加入的成员。确定继续？'
          : '退出后需要队伍重新邀请才能回来。确定继续？'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ink" size="md" onClick={() => setConfirming(false)} disabled={busy}>
          取消
        </Button>
        <Button
          size="md"
          className="bg-ochre text-cream"
          onClick={leave}
          disabled={busy}
        >
          {busy ? '退出中…' : '确定退出'}
        </Button>
      </div>
    </div>
  )
}
