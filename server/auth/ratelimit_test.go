package auth

import (
	"testing"
	"time"
)

func TestLimiterAllowsUpToLimit(t *testing.T) {
	l := NewLimiter(3, time.Minute)

	for i := 1; i <= 3; i++ {
		if !l.allow("1.2.3.4") {
			t.Fatalf("request %d should have been allowed", i)
		}
	}

	if l.allow("1.2.3.4") {
		t.Fatal("4th request should have been blocked")
	}
}

func TestLimiterIsPerClient(t *testing.T) {
	l := NewLimiter(2, time.Minute)

	l.allow("1.1.1.1")
	l.allow("1.1.1.1")

	if l.allow("1.1.1.1") {
		t.Fatal("first client should be blocked after 2 requests")
	}
	if !l.allow("2.2.2.2") {
		t.Fatal("second client should not be affected by the first")
	}
}

func TestLimiterWindowExpires(t *testing.T) {
	l := NewLimiter(2, 50*time.Millisecond)

	l.allow("1.2.3.4")
	l.allow("1.2.3.4")
	if l.allow("1.2.3.4") {
		t.Fatal("should be blocked while inside the window")
	}

	time.Sleep(60 * time.Millisecond)

	if !l.allow("1.2.3.4") {
		t.Fatal("should be allowed again once the window has passed")
	}
}

func TestLimiterConcurrentAccess(t *testing.T) {
	l := NewLimiter(100, time.Minute)
	done := make(chan bool)

	// Two goroutines hammering the same key shouldn't corrupt the map.
	// Run with -race to make this meaningful.
	for i := 0; i < 2; i++ {
		go func() {
			for j := 0; j < 50; j++ {
				l.allow("same-key")
			}
			done <- true
		}()
	}

	<-done
	<-done

	if l.allow("same-key") {
		t.Fatal("100 requests were used, the next should be blocked")
	}
}
