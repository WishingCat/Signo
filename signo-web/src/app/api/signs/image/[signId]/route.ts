import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import { getImageAbsolutePath } from '@/lib/signDb/service'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ signId: string }> },
) {
  const { signId } = await ctx.params
  const id = Number(signId)
  if (!Number.isInteger(id) || id <= 0) {
    return new Response('bad signId', { status: 400 })
  }
  const abs = getImageAbsolutePath(id)
  if (!abs) return new Response('not found', { status: 404 })

  const nodeStream = createReadStream(abs)
  // Cast: Node's Readable.toWeb → WHATWG ReadableStream which Response accepts.
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>
  return new Response(webStream, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
