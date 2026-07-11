// WebSocket par scénario actif. Path : /_ws/game/<campaignId>/<scenarioId>
import { joinRoom, leaveRoom } from '~/server/utils/wsHub'

function parseIds(url: string | undefined): { campaignId: number; scenarioId: number } | null {
  if (!url) return null
  const m = url.match(/_ws\/game\/(\d+)\/(\d+)/)
  if (!m) return null
  const c = parseInt(m[1])
  const s = parseInt(m[2])
  if (isNaN(c) || isNaN(s)) return null
  return { campaignId: c, scenarioId: s }
}

export default defineWebSocketHandler({
  open(peer) {
    const url = (peer as any).request?.url || (peer as any).url || ''
    const ids = parseIds(String(url))
    if (!ids) {
      try { peer.send(JSON.stringify({ type: 'error', message: 'Invalid path' })) } catch {}
      peer.close?.(1008, 'Invalid path')
      return
    }
    ;(peer as any)._campaignId = ids.campaignId
    ;(peer as any)._scenarioId = ids.scenarioId
    joinRoom(ids.campaignId, ids.scenarioId, peer as any)
    try { peer.send(JSON.stringify({ type: 'hello', ...ids })) } catch {}
  },
  message(peer, message) {
    const text = typeof message === 'string' ? message : message.text?.() ?? ''
    if (text === 'ping') {
      try { peer.send(JSON.stringify({ type: 'pong' })) } catch {}
    }
  },
  close(peer) {
    const c = (peer as any)._campaignId
    const s = (peer as any)._scenarioId
    if (typeof c === 'number' && typeof s === 'number') leaveRoom(c, s, peer as any)
  },
  error(peer) {
    const c = (peer as any)._campaignId
    const s = (peer as any)._scenarioId
    if (typeof c === 'number' && typeof s === 'number') leaveRoom(c, s, peer as any)
  }
})
