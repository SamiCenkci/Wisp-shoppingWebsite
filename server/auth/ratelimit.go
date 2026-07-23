package auth

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// visitor tracks request timestamps for one client key.
type visitor struct {
	timestamps []time.Time
}

// Limiter allows at most `limit` requests per `window` per client.
// State is in-memory, so it resets on deploy and is per-instance — fine for a
// single Render instance, but a shared store (Redis) would be needed to scale out.
type Limiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	limit    int
	window   time.Duration
}

func NewLimiter(limit int, window time.Duration) *Limiter {
	l := &Limiter{
		visitors: make(map[string]*visitor),
		limit:    limit,
		window:   window,
	}
	go l.cleanup()
	return l
}

// cleanup drops stale entries so the map doesn't grow without bound.
func (l *Limiter) cleanup() {
	for range time.Tick(5 * time.Minute) {
		l.mu.Lock()
		cutoff := time.Now().Add(-l.window)
		for key, v := range l.visitors {
			if len(v.timestamps) == 0 || v.timestamps[len(v.timestamps)-1].Before(cutoff) {
				delete(l.visitors, key)
			}
		}
		l.mu.Unlock()
	}
}

// allow reports whether the key may make another request now.
func (l *Limiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-l.window)

	v, ok := l.visitors[key]
	if !ok {
		v = &visitor{}
		l.visitors[key] = v
	}

	// Drop timestamps outside the window
	kept := v.timestamps[:0]
	for _, t := range v.timestamps {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	v.timestamps = kept

	if len(v.timestamps) >= l.limit {
		return false
	}
	v.timestamps = append(v.timestamps, now)
	return true
}

// Middleware limits by client IP.
func (l *Limiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !l.allow(c.ClientIP()) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "For mange forsøk. Vent litt og prøv igjen.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
