# Wisp 🛍️

A full-stack secondhand marketplace for the Norwegian market, inspired by [Finn.no](https://finn.no). Users can list items for sale or giveaway, search and filter listings, favorite items, manage their own ads, and chat with sellers.

🔗 **Live site:** [wispapp.net](https://wispapp.net)

---

## 📸 Screenshots

### Homepage — browse and search listings
![Homepage](docs/screenshots/home.png)

### Listing detail — gallery, seller info, and favorites
![Listing detail](docs/screenshots/listing.png)

### Chat — messaging with file sharing
![Chat](docs/screenshots/chat.png)

### Dark mode
![Dark mode](docs/screenshots/dark.png)

---

## Overview

Wisp is a complete marketplace platform built from the ground up — frontend, backend, database, file storage, messaging, authentication, and cloud deployment. It runs entirely on managed cloud infrastructure and is served over HTTPS at a custom domain.

The project demonstrates an end-to-end product: a typed React frontend, a compiled Go backend with a real relational database, cloud image storage, live chat, and a multi-service cloud deployment with secure, environment-based configuration.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, React Suspense — deployed on **Vercel** |
| **Backend** | Go, Gin, Gorilla WebSocket, JWT (HS256), bcrypt — deployed on **Render** |
| **Database** | **Neon** managed PostgreSQL, SQLC, pgx/v5, `pg_trgm` for fuzzy search |
| **Storage** | AWS S3 (presigned uploads for images and files) |
| **Infra** | Vercel + Render + Neon + S3, custom domain via Cloudflare DNS, HTTPS everywhere |

---

## Features

### 🔐 Authentication & Users
- Signup and login with JWT tokens and bcrypt-hashed passwords
- Protected and optional-auth routes
- User profiles with display name, bio, phone, location, and avatar
- Editable profile pages; public vs. private profile views

### 📦 Listings
- Full CRUD with multi-image uploads to AWS S3
- "For sale" (Til salgs) and "giveaway" (Gis bort) listing types
- 60-day expiry with status tracking: active, sold, expired
- "My listings" dashboard with status tabs and per-listing actions
- Detail pages with image gallery, seller card, and similar-listing recommendations
- Norwegian condition labels (Ny, Som ny, God, Brukbar)

### 🔍 Search & Filtering
- Fuzzy full-text search using PostgreSQL `pg_trgm` similarity matching
- Filters: category, postal code, price range, condition, and listing type
- Sort by newest, price ascending, or price descending
- Recent searches saved locally, surfaced in a navbar dropdown

### 💬 Chat
- Messaging between buyers and sellers with file and image attachments
- Conversation list enriched with the other user's name, listing title, image, and last-message preview
- Unread-message indicators: a navbar count badge and per-conversation badges that clear when opened
- Live updates via polling (with WebSocket support where available)

### ❤️ Favorites
- Like / unlike listings, with a unique constraint preventing duplicate likes
- Public like counts visible to everyone
- Private "liked listings" view on your own profile
- Heart indicators on cards and detail pages that persist across reloads

### 🎨 Design & UX
- Responsive layout (desktop and mobile)
- Light and dark mode with a no-flash theme loader
- Custom green brand theme using Tailwind v4 design tokens
- Loading skeletons for perceived performance

---

## Architecture

```
┌─────────────┐   HTTPS    ┌──────────────┐        ┌──────────────┐
│   Browser   │ ─────────► │    Vercel    │        │    Render    │
│ wispapp.net │            │  (Next.js)   │ ─────► │   (Go API)   │
└─────────────┘            └──────────────┘  REST  └──────┬───────┘
                                                          │
                                          ┌───────────────┴───────────────┐
                                          │                               │
                                   ┌──────▼──────┐                 ┌──────▼──────┐
                                   │    Neon     │                 │   AWS S3    │
                                   │ PostgreSQL  │                 │  (images)   │
                                   └─────────────┘                 └─────────────┘
```

---

## Database Schema

The database is PostgreSQL, with UUID primary keys and foreign-key constraints enforcing referential integrity. Core tables:

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| email | text | unique |
| password_hash | text | bcrypt |
| display_name, bio, phone, city, ... | text | profile fields |
| created_at | timestamptz | |

### `listings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| title, description | text | |
| price_ore | integer | price in øre (cents) |
| category, subcategory, condition | text | |
| county, municipality | text | location |
| ad_type | text | `sale` / `giveaway` |
| status | text | `active` / `sold` / `expired` |
| created_at, updated_at | timestamptz | |

### `listing_images`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| listing_id | uuid | FK → listings |
| url | text | S3 URL |
| sort_order | integer | display order |

### `favorites`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| listing_id | uuid | FK → listings |
| created_at | timestamptz | |
| | | **unique (user_id, listing_id)** — one like per user per listing |

### `conversations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| listing_id | uuid | FK → listings |
| buyer_id | uuid | FK → users |
| seller_id | uuid | FK → users |
| updated_at | timestamptz | |
| | | **unique (listing_id, buyer_id)** — one conversation per listing per buyer |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations |
| sender_id | uuid | FK → users |
| content | text | |
| attachment_url, attachment_name | text | optional file/image |
| read_at | timestamptz | null = unread |
| created_at | timestamptz | |

**Relationships:** a user has many listings, favorites, and messages; a listing has many images, favorites, and conversations; a conversation has many messages. Deletes cascade (e.g. deleting a listing removes its images and favorites).

---

## Running locally

### Prerequisites
- Node.js and npm
- Go
- PostgreSQL (or a Neon connection string)
- An AWS S3 bucket

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

The frontend runs on `localhost:3000` and the API on `localhost:8080`.

### Environment variables
See [`server/.env.example`](server/.env.example) for required configuration (database URL, JWT secret, AWS credentials, allowed origins).

---

## Notes

This is a personal project built to learn full-stack development end to end — from database schema design and a typed API to a secure, multi-service cloud deployment. It reflects real-world concerns like environment-based config, CORS, authentication, and keeping secrets out of version control.

Built by **Sami Cenkci** — [GitHub](https://github.com/SamiCenkci)

