import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { subscribe, type MatchEvent } from '@/lib/pk/matchStore'

export const dynamic = 'force-dynamic'

function sseFormat(event: MatchEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> },
) {
  const user = await getSessionUser()
  if (!user) return new Response('unauthorized', { status: 401 })
  const { matchId } = await ctx.params

  const dbMatch = await prisma.pkMatch.findUnique({ where: { id: matchId } })
  if (!dbMatch) return new Response('not found', { status: 404 })
  if (dbMatch.aId !== user.id && dbMatch.bId !== user.id) {
    return new Response('forbidden', { status: 403 })
  }

  const encoder = new TextEncoder()
  let unsubscribe: () => void = () => {}
  let keepalive: NodeJS.Timeout | null = null
  let closed = false

  const stream = new ReadableStream({
    start(controller) {
      const safeEnqueue = (chunk: string) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(chunk)) } catch { /* client gone */ }
      }
      // Initial comment to flush headers immediately on some proxies.
      safeEnqueue(': connected\n\n')
      // Keepalive every 20s to defeat idle proxies.
      keepalive = setInterval(() => safeEnqueue(': ping\n\n'), 20_000)

      unsubscribe = subscribe(matchId, (event) => safeEnqueue(sseFormat(event)))

      const onAbort = () => {
        if (closed) return
        closed = true
        unsubscribe()
        if (keepalive) clearInterval(keepalive)
        try { controller.close() } catch {}
      }
      req.signal.addEventListener('abort', onAbort)

      // If the match has already been disposed (finished + cleaned up), close immediately.
      if (typeof unsubscribe !== 'function') onAbort()
    },
    cancel() {
      closed = true
      unsubscribe()
      if (keepalive) clearInterval(keepalive)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
