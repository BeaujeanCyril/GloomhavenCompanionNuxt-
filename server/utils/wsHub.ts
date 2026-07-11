// Hub WebSocket : maintient les rooms par campaignId-scenarioId
// et permet de broadcaster les changements depuis n'importe quel handler HTTP.
// Ce hub fonctionne EN PLUS du polling existant (pas en remplacement).

type Peer = { send: (data: string) => void; close?: () => void }

function roomKey(campaignId: number, scenarioId: number): string {
  return `${campaignId}-${scenarioId}`
}

const rooms = new Map<string, Set<Peer>>()

export function joinRoom(campaignId: number, scenarioId: number, peer: Peer) {
  const key = roomKey(campaignId, scenarioId)
  let room = rooms.get(key)
  if (!room) {
    room = new Set()
    rooms.set(key, room)
  }
  room.add(peer)
}

export function leaveRoom(campaignId: number, scenarioId: number, peer: Peer) {
  const key = roomKey(campaignId, scenarioId)
  const room = rooms.get(key)
  if (!room) return
  room.delete(peer)
  if (room.size === 0) rooms.delete(key)
}

export interface WsEvent {
  type: string
  data?: unknown
}

export function broadcast(campaignId: number, scenarioId: number, event: WsEvent) {
  const key = roomKey(campaignId, scenarioId)
  const room = rooms.get(key)
  if (!room) return
  const payload = JSON.stringify(event)
  for (const peer of room) {
    try { peer.send(payload) } catch {
      // ignore: peer probably disconnected
    }
  }
}
