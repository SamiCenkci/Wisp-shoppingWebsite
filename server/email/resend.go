package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

const fromAddress = "Wisp <noreply@wispapp.net>"

type Sender struct {
	APIKey  string
	SiteURL string // e.g. https://wispapp.net
}

type payload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	Html    string   `json:"html"`
}

// send posts a single email to Resend. Errors are logged, never fatal.
func (s *Sender) send(to, subject, html string) {
	if s.APIKey == "" {
		log.Println("email: RESEND_API_KEY not set, skipping send")
		return
	}

	body, err := json.Marshal(payload{
		From:    fromAddress,
		To:      []string{to},
		Subject: subject,
		Html:    html,
	})
	if err != nil {
		log.Printf("email: marshal failed: %v", err)
		return
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		log.Printf("email: request build failed: %v", err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("email: send failed: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		log.Printf("email: resend returned status %d", resp.StatusCode)
		return
	}
	log.Printf("email: review request sent to %s", to)
}

// SendReviewRequest asks the buyer to review the seller after a completed sale.
func (s *Sender) SendReviewRequest(toEmail, buyerName, listingTitle, sellerName, listingID string) {
	reviewURL := fmt.Sprintf("%s/review/%s", s.SiteURL, listingID)

	html := fmt.Sprintf(`
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <div style="font-size:26px;font-weight:700;color:#1A9E4B;margin-bottom:24px">Wisp</div>

  <h1 style="font-size:22px;margin:0 0 12px">Hvordan gikk handelen, %s?</h1>

  <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 8px">
    Du kjøpte nylig <strong>%s</strong> av %s.
  </p>
  <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px">
    Vurderingen din hjelper andre brukere med å handle trygt. Det tar under ett minutt.
  </p>

  <div style="background:#f6f8f6;border-radius:12px;padding:20px;margin-bottom:24px">
    <p style="font-size:14px;color:#555;margin:0 0 12px"><strong>Du vurderer:</strong></p>
    <p style="font-size:14px;color:#555;margin:0 0 6px">⭐ Kommunikasjon</p>
    <p style="font-size:14px;color:#555;margin:0 0 6px">⭐ Pålitelighet</p>
    <p style="font-size:14px;color:#555;margin:0">⭐ Som beskrevet</p>
  </div>

  <a href="%s" style="display:inline-block;background:#1A9E4B;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">
    Gi vurdering
  </a>

  <p style="font-size:13px;color:#999;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
    Du får denne e-posten fordi du fullførte en handel på Wisp.
  </p>
</div>`, buyerName, listingTitle, sellerName, reviewURL)

	go s.send(toEmail, "Hvordan gikk handelen på Wisp?", html)
}