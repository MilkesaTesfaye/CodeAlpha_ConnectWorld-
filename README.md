# CodeAlpha_ConnectWorld 🌐

Enterprise Real-Time Video Conferencing & Collaboration Platform

> **CodeAlpha Internship Project**

## Architecture

```
CodeAlpha_ConnectWorld/
├── client/          # React + TypeScript + Tailwind frontend (Vite)
├── server/          # Express + Prisma + Socket.IO backend
├── database/        # DB init scripts & docker configs
├── docker/          # Nginx reverse proxy, Grafana, Prometheus configs
├── scripts/         # Deploy & setup scripts
├── docker-compose.yml       # Production deployment
├── docker-compose.dev.yml   # Development overrides
├── Makefile                 # Build automation
└── .env                     # Environment configuration
```

## Features

- 🎥 **Real-time Video Conferencing** with WebRTC
- 💬 **Live Chat** with Socket.IO
- 📋 **Collaborative Whiteboard**
- 🔐 **JWT Authentication** with email verification & OTP
- 👥 **Role-based Access Control** (Admin, Moderator, User, Guest)
- 📁 **File Sharing** with Cloudinary
- 🔔 **Real-time Notifications**
- 📊 **Admin Dashboard** with analytics
- 🌙 **Dark/Light/System Theme**
- 🐳 **Docker Compose Deployment**

## Quick Start (Local Development)

### Prerequisites
- Node.js 22+
- MySQL 8.4+ (or Docker)
- Redis 7.4+ (optional, falls back gracefully)

### Setup

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install
cd ..

# 2. Configure environment
# Edit .env file with your database credentials

# 3. Generate Prisma client & push schema
cd server
npx prisma generate
npx prisma db push --accept-data-loss

# 4. Seed database (roles, permissions & sample users)
npm run prisma:seed-all

# 5. Start development servers
# Terminal 1 - Backend:
cd server && npm run dev

# Terminal 2 - Frontend:
cd client && npx vite --host --port 5173
```

## Login Credentials (Seeded Accounts)

| Email | Password | Role |
|---|---|---|
| admin@connectworld.com | Admin123! | SUPER_ADMIN |
| manager@connectworld.com | Manager123! | ADMIN |
| mod@connectworld.com | Moderator123! | MODERATOR |
| alice@connectworld.com | Alice123! | USER |
| bob@connectworld.com | Bob123! | USER |
| charlie@connectworld.com | Charlie123! | USER |
| guest@connectworld.com | Guest123! | GUEST |

> 👆 On the login page, click **"Show test accounts"** to auto-fill any account!

## Docker Deployment

```bash
# Production
cp .env.example .env   # Configure your secrets
docker compose up -d --build

# With SSL (after DNS is configured)
docker compose run --rm certbot-init
docker compose restart nginx-proxy
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Redux Toolkit |
| **Backend** | Express 5, Prisma 7, Socket.IO, Zod, JWT |
| **Database** | MySQL 8.4 + Redis 7.4 |
| **Real-time** | WebRTC, Socket.IO |
| **Infrastructure** | Docker, Nginx, Let's Encrypt |

## Available Commands

| Command | Description |
|---------|-------------|
| `cd server && npm run dev` | Start server (hot-reload) |
| `cd client && npx vite` | Start client dev server |
| `cd server && npm run build` | Build server for production |
| `cd server && npx tsc --noEmit` | TypeScript type-check server |
| `cd client && npx tsc --noEmit` | TypeScript type-check client |
| `cd server && npm run prisma:seed` | Seed roles & permissions |
| `cd server && npm run prisma:seed-users` | Seed sample users |
| `cd server && npm run prisma:seed-all` | Seed everything |

## Environment Variables

Key variables in `.env`:

```env
DATABASE_URL=mysql://user:password@host:3306/database
JWT_ACCESS_SECRET=<32-char-min-random>
JWT_REFRESH_SECRET=<32-char-min-random>
PORT=5001
CLIENT_URL=http://localhost:5173
```

## License

ISC
