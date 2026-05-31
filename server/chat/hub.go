package chat

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

// Hub keeps track of which users are connected and their sockets.
type Hub struct {
	mu          sync.RWMutex
	connections map[string][]*websocket.Conn // userID -> their open sockets
}

func NewHub() *Hub {
	return &Hub{
		connections: make(map[string][]*websocket.Conn),
	}
}

// Add registers a new socket for a user.
func (h *Hub) Add(userID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.connections[userID] = append(h.connections[userID], conn)
}

// Remove unregisters a socket for a user.
func (h *Hub) Remove(userID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	conns := h.connections[userID]
	for i, c := range conns {
		if c == conn {
			h.connections[userID] = append(conns[:i], conns[i+1:]...)
			break
		}
	}
	if len(h.connections[userID]) == 0 {
		delete(h.connections, userID)
	}
}

// SendToUser pushes a JSON payload to all of a user's open sockets.
func (h *Hub) SendToUser(userID string, payload interface{}) {
	h.mu.RLock()
	conns := h.connections[userID]
	h.mu.RUnlock()

	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	for _, conn := range conns {
		_ = conn.WriteMessage(websocket.TextMessage, data)
	}
}
