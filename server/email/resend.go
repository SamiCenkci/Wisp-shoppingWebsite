package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
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
	log.Printf("email: sent to %s", to)
}

// htmlEscape prevents user-supplied text from breaking out into markup.
// Listing titles and names end up in other people's inboxes, so this matters.
func htmlEscape(s string) string {
	r := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		`"`, "&quot;",
		"'", "&#39;",
	)
	return r.Replace(s)
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
</div>`, htmlEscape(buyerName), htmlEscape(listingTitle), htmlEscape(sellerName), reviewURL)

	go s.send(toEmail, "Hvordan gikk handelen på Wisp?", html)
}

// SendPriceDropAlert tells someone a listing they favorited got cheaper.
func (s *Sender) SendPriceDropAlert(toEmail, name, listingTitle, listingID string, oldPriceOre, newPriceOre int32) {
	listingURL := fmt.Sprintf("%s/listings/%s", s.SiteURL, listingID)
	oldKr := oldPriceOre / 100
	newKr := newPriceOre / 100
	savedKr := oldKr - newKr

	html := fmt.Sprintf(`
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <div style="font-size:26px;font-weight:700;color:#1A9E4B;margin-bottom:24px">Wisp</div>

  <h1 style="font-size:22px;margin:0 0 12px">Prisen har gått ned, %s! 🎉</h1>

  <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px">
    En annonse du har lagret er blitt billigere.
  </p>

  <div style="background:#f6f8f6;border-radius:12px;padding:20px;margin-bottom:24px">
    <p style="font-size:17px;font-weight:600;margin:0 0 12px">%s</p>
    <p style="margin:0;font-size:15px;color:#555">
      <span style="text-decoration:line-through;color:#999">%d kr</span>
      &nbsp;&rarr;&nbsp;
      <span style="font-size:22px;font-weight:700;color:#1A9E4B">%d kr</span>
    </p>
    <p style="margin:8px 0 0;font-size:14px;color:#1A9E4B;font-weight:600">Du sparer %d kr</p>
  </div>

  <a href="%s" style="display:inline-block;background:#1A9E4B;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">
    Se annonsen
  </a>

  <p style="font-size:13px;color:#999;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
    Du får denne e-posten fordi du har lagret annonsen som favoritt på Wisp.
  </p>
</div>`, htmlEscape(name), htmlEscape(listingTitle), oldKr, newKr, savedKr, listingURL)

	go s.send(toEmail, "Prisen har gått ned på en annonse du følger", html)
}

// SendVerificationEmail asks a new user to confirm their address.
func (s *Sender) SendVerificationEmail(toEmail, name, token string) {
	verifyURL := fmt.Sprintf("%s/verify?token=%s", s.SiteURL, token)

	html := fmt.Sprintf(`
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <div style="font-size:26px;font-weight:700;color:#1A9E4B;margin-bottom:24px">Wisp</div>

  <h1 style="font-size:22px;margin:0 0 12px">Velkommen, %s!</h1>

  <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px">
    Bekreft e-postadressen din for å komme i gang med å legge ut annonser og sende meldinger.
  </p>

  <a href="%s" style="display:inline-block;background:#1A9E4B;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">
    Bekreft e-postadressen
  </a>

  <p style="font-size:13px;color:#999;margin-top:24px">
    Lenken er gyldig i 24 timer. Har du ikke opprettet en konto på Wisp, kan du se bort fra denne e-posten.
  </p>
</div>`, htmlEscape(name), verifyURL)

	go s.send(toEmail, "Bekreft e-postadressen din på Wisp", html)
}

// AlertItem is one listing in a saved-search alert email.
type AlertItem struct {
	ID       string
	Title    string
	PriceOre int32
	Place    string
}

// SendSavedSearchAlert reports new listings matching someone's saved search.
func (s *Sender) SendSavedSearchAlert(toEmail, name, searchName string, items []AlertItem) {
	if len(items) == 0 {
		return
	}

	var rows strings.Builder
	for _, it := range items {
		price := fmt.Sprintf("%d kr", it.PriceOre/100)
		if it.PriceOre == 0 {
			price = "Gratis"
		}
		rows.WriteString(fmt.Sprintf(`
    <a href="%s/listings/%s" style="display:block;text-decoration:none;color:inherit;background:#f6f8f6;border-radius:12px;padding:16px;margin-bottom:10px">
      <div style="font-size:16px;font-weight:600;color:#1a1a1a;margin-bottom:4px">%s</div>
      <div style="font-size:15px;font-weight:700;color:#1A9E4B">%s</div>
      <div style="font-size:13px;color:#777;margin-top:2px">%s</div>
    </a>`, s.SiteURL, it.ID, htmlEscape(it.Title), price, htmlEscape(it.Place)))
	}

	heading := "1 ny annonse"
	if len(items) > 1 {
		heading = fmt.Sprintf("%d nye annonser", len(items))
	}

	html := fmt.Sprintf(`
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <div style="font-size:26px;font-weight:700;color:#1A9E4B;margin-bottom:24px">Wisp</div>

  <h1 style="font-size:22px;margin:0 0 8px">%s for deg, %s</h1>
  <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px">
    Fra det lagrede søket ditt &laquo;%s&raquo;.
  </p>

  %s

  <p style="font-size:13px;color:#999;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
    Du får denne e-posten fordi du har lagret et søk på Wisp.
    Du kan slette søket under Lagrede søk på profilen din.
  </p>
</div>`, heading, htmlEscape(name), htmlEscape(searchName), rows.String())

	go s.send(toEmail, fmt.Sprintf("%s i søket «%s»", heading, searchName), html)
}
