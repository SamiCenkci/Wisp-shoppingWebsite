# Wisp 🛍️

A full-stack secondhand marketplace for the Norwegian market, inspired by [Finn.no](https://finn.no). Users can list items for sale or giveaway, search and filter listings, favorite items, manage their own ads, and chat with sellers.

🔗 **Live site:** [wispapp.net](https://wispapp.net)

---

## Overview

Wisp is a complete marketplace platform built from the ground up — frontend, backend, database, file storage, messaging, authentication, and cloud deployment. It runs entirely on managed cloud infrastructure and is served over HTTPS at a custom domain.

The project demonstrates an end-to-end product: a typed React frontend, a compiled Go backend with a real relational database, cloud image storage, live chat, and a multi-service cloud deployment with secure, environment-based configuration.

---

## Tech Stack

**Frontend**
- Next.js 16 (App Router) with TypeScript
- Tailwind CSS v4 (custom theme tokens, light/dark mode)
- React Suspense for production-ready client rendering
- Deployed on **Vercel**

**Backend**
- Go with the Gin web framework
- Gorilla WebSocket for chat (with a polling fallback)
- JWT authentication (HS256) with bcrypt password hashing
- Optional-auth middleware for personalized public endpoints
- Deployed on **Render**

**Database & Storage**
- **Neon** managed PostgreSQL
- SQLC for type-safe, generated query code
- pgx/v5 driver
- `pg_trgm` extension for fuzzy, typo-tolerant search
- **AWS S3** for image and file storage via presigned uploads

**Infrastructure**
- Frontend on Vercel, backend on Render, database on Neon, files on S3
- Custom domain via Cloudflare DNS with automatic HTTPS
- Environment-based configuration (12-factor style), per-environment CORS

---

## Features

### Authentication & Users
- Signup and login with JWT tokens and bcrypt-hashed passwords
- Protected and optional-auth routes
- User profiles with display name, bio, phone, location, and avatar
- Editable profile pages; public vs. private profile views

### Listings
- Full CRUD with multi-image uploads to AWS S3
- "For sale" (Til salgs) and "giveaway" (Gis bort) listing types
- 60-day expiry with status tracking: active, sold, expired
- "My listings" (Mine annonser) dashboard with status tabs and per-listing actions
- Listing detail pages with image gallery, seller card, and similar-listing recommendations
- Norwegian condition labels (Ny, Som ny, God, Brukbar)

### Search & Filtering
- Fuzzy full-text search using PostgreSQL `pg_trgm` similarity matching
- Filters: category, postal code, price range, condition, and listing type
- Sort by newest, price ascending, or price descending
- Recent searches saved locally, surfaced in a navbar dropdown

### Chat
- Messaging between buyers and sellers with file and image attachments
- Conversation list enriched with the other user's name, listing title, image, and last-message preview
- Unread-message indicators: a count badge in the navbar and per-conversation badges that clear when opened
- Live updates via polling (with WebSocket support where available)

### Favorites
- Like / unlike listings, with a unique constraint preventing duplicate likes
- Public like counts visible to everyone
- Private "liked listings" (Likte annonser) view on your own profile
- Heart indicators on cards and detail pages that persist across reloads

### Design & UX
- Polished, responsive layout (desktop and mobile)
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

See [`server/.env.example`](server/.env.example) for the required configuration (database URL, JWT secret, AWS credentials, allowed origins).

---

## Notes

This is a personal project built to learn full-stack development end to end — from database schema design and a typed API to a secure, multi-service cloud deployment. It reflects real-world concerns like environment-based config, CORS, authentication, and keeping secrets out of version control.

Built by **Sami Cenkci** — [GitHub](https://github.com/SamiCenkci)

