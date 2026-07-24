# Wisp 🛍️
 
A full-stack secondhand marketplace for the Norwegian market, inspired by [Finn.no](https://finn.no). Users list items for sale or giveaway, browse a three-level category tree, search with typo-tolerant matching, favorite listings, message sellers, and review each other after a completed sale.
 
🔗 **Live:** [wispapp.net](https://wispapp.net)
 
---
 
## 📸 Screenshots
 
### Homepage — category navigation and listings
![Homepage](docs/screenshots/home.png)
 
### Listing detail — gallery, attributes, seller, and location
![Listing detail](docs/screenshots/listing.png)
 
### Chat — messaging with file sharing
![Chat](docs/screenshots/chat.png)
 
### Dark mode
![Dark mode](docs/screenshots/dark.png)
 
---
 
## Overview
 
Wisp was built end to end: schema design, a typed API, a component-driven frontend, transactional email, and a multi-service cloud deployment behind a custom domain.
 
A few things it does that go beyond CRUD:
 
- **A real category tree.** Three levels deep, with per-branch attributes stored as JSONB — a game listing asks for platform, a jacket asks for size, a bike asks for frame type. Adding a branch means editing one file; the forms, filters and detail pages all read from it.
- **Norwegian address autocomplete.** Integrates [Kartverket](https://ws.geonorge.no/adresser/v1/) (the national mapping authority) for address lookup, which fills postal code and place automatically and captures coordinates. The listing map shows an approximate area rather than an exact pin, since a seller's address is usually their home.
- **Mutual reviews with real constraints.** Only the two parties in a completed sale can review each other, once each, and only after the seller records who they sold to. The authorisation rules live in a pure function with test coverage.
- **Saved searches with alerts.** Users save a filter set and get emailed when matching listings appear. Render's free tier has no cron, so an external scheduler calls a secret-guarded endpoint — which also wakes the sleeping instance.
---
 
## Tech Stack
 
| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 — deployed on **Vercel** |
| **Backend** | Go, Gin, JWT (HS256), bcrypt, Gorilla WebSocket — deployed on **Render** |
| **Database** | **Neon** managed PostgreSQL, SQLC for type-safe queries, pgx/v5, `pg_trgm` for fuzzy search, JSONB + GIN for attributes |
| **Storage** | AWS S3 via presigned uploads, with browser-side image compression |
| **Email** | Resend — verification, review requests, price-drop and saved-search alerts |
| **External APIs** | Kartverket (addresses), Leaflet + OpenStreetMap (maps) |
| **Testing** | Go's `testing` package, Vitest |
 
---
 
## Features
 
### Authentication
- Signup and login with JWT and bcrypt-hashed passwords
- Email verification — unverified accounts can browse but not post or message
- In-memory rate limiting on login, signup and listing creation
- Optional-auth middleware so public endpoints can still personalise
### Listings
- Full CRUD with multi-image upload to S3
- Three-level categories with branch-specific attributes
- "For sale" and "giveaway" types, 60-day expiry, active/sold/expired status
- Soft delete — removing a listing preserves the conversations and reviews attached to it
- View counter, and a dashboard with status tabs and per-listing actions
### Search & Filtering
- Typo-tolerant search using PostgreSQL trigram similarity
- Filter by category path, attributes, place or postal code, price range, condition and type
- Category drill-down lives in the URL, so browser back steps out one level and searches are shareable
### Chat
- Buyer–seller messaging with image and file attachments
- Unread badges in the navbar and per conversation
- Polling-based delivery (Render's free tier doesn't hold WebSockets reliably)
### Favorites & Reviews
- Like listings, with public counts and a private saved list
- Favoriters are emailed when a price drops
- Mutual reviews across three dimensions, averaged into one score
- Reviewed users can reply once; reviewers can delete what they wrote
### Trust & Safety
- Report listings with a reason and optional detail
- Admin moderation view to dismiss, action, or remove reported listings
- Upload content-type allowlist and filename sanitisation
- Server-side length validation and fully parameterised search queries
### Design
- Responsive layout with light and dark mode
- FAQ chatbot with persistent history
- About, Help and Privacy pages
---
 
## Architecture
 
```
┌─────────────┐   HTTPS    ┌──────────────┐        ┌──────────────┐
│   Browser   │ ─────────► │    Vercel    │        │    Render    │
│ wispapp.net │            │  (Next.js)   │ ─────► │   (Go API)   │
└─────────────┘            └──────────────┘  REST  └──────┬───────┘
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    │                     │                     │
                             ┌──────▼──────┐       ┌──────▼──────┐      ┌───────▼──────┐
                             │    Neon     │       │   AWS S3    │      │    Resend    │
                             │ PostgreSQL  │       │  (images)   │      │   (email)    │
                             └─────────────┘       └─────────────┘      └──────────────┘
```
 
---
 
## Database Schema
 
UUID primary keys throughout, with foreign keys enforcing referential integrity.
 
### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | text | unique |
| password_hash | text | bcrypt |
| name, display_name, bio, phone, city, … | text | profile fields |
| verified_at | timestamptz | null until email is confirmed |
| is_admin | boolean | grants the moderation view |
 
### `listings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| title, description | text | |
| price_ore | integer | price in øre, avoiding float rounding |
| category, sub_category, product_category | text | the three-level path |
| attributes | jsonb | branch-specific fields, GIN indexed |
| condition, ad_type, status | text | |
| county, municipality, postal_code, street_address | text | |
| latitude, longitude | double precision | from Kartverket |
| view_count | integer | |
| sold_to | uuid | FK → users, set when marked sold |
| deleted_at | timestamptz | soft delete |
 
### `favorites`
`user_id` + `listing_id`, **unique together** — one like per user per listing, so counts are accurate.
 
### `conversations` / `messages`
One conversation per listing per buyer (**unique**). Messages carry optional `attachment_url` and `attachment_name`, plus `read_at` for unread counts.
 
### `reviews`
| Column | Type | Notes |
|--------|------|-------|
| listing_id, reviewer_id, reviewed_user_id | uuid | FKs |
| communication, reliability, as_described | integer | 1–5, CHECK constrained |
| comment, reply | text | |
| | | **unique (listing_id, reviewer_id)** — one review per person per sale |
 
### `saved_searches`
Stores a filter set plus `last_checked_at`, so the alert job only reports listings created since the previous run.
 
### `reports`
`listing_id` + `reporter_id` **unique**, with a reason, optional detail, and an open/reviewed/dismissed status.
 
---
 
## Testing
 
```bash
cd server && go test ./...     # rate limiter, review rules, search query builder
cd client && npm test          # category taxonomy helpers
```
 
The search query builder is the most valuable target — it assembles SQL from a dozen optional filters, and the tests assert that placeholder numbering stays in lockstep with the argument list across every combination. A mismatch there would bind the wrong value to the wrong column.
 
---
 
## Running locally
 
### Prerequisites
Node.js, Go, PostgreSQL (or a Neon connection string), an AWS S3 bucket, and a Resend API key for email.
 
### Backend
```bash
cd server
cp .env.example .env   # fill in your own values
go run main.go
```
 
### Frontend
```bash
cd client
npm install
npm run dev
```
 
Frontend on `localhost:3000`, API on `localhost:8080`.
 
See [`server/.env.example`](server/.env.example) for the required configuration.
 
---
 
## Notes
 
Built to learn full-stack development properly — not just making features work, but handling the parts that only show up in a real deployment: environment-based config, CORS across separate origins, keeping secrets out of version control, soft deletes so one user's action can't destroy another's history, and rate limiting on endpoints that would otherwise be brute-forceable.
 
Built by **Sami Cenkci** — [GitHub](https://github.com/SamiCenkci)
