from typing import Dict, List
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    """Tracks active WebSocket connections per shared list."""

    def __init__(self):
        self.active: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, list_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(list_id, []).append(websocket)

    def disconnect(self, list_id: UUID, websocket: WebSocket):
        conns = self.active.get(list_id)
        if conns and websocket in conns:
            conns.remove(websocket)
            if not conns:
                del self.active[list_id]

    async def broadcast(self, list_id: UUID, message: dict):
        conns = self.active.get(list_id, [])
        dead = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(list_id, ws)


manager = ConnectionManager()
