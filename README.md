# AB Tournament

Production-oriented gaming tournament platform for Free Fire and BGMI.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)

## Startup Upgrade Highlights

- Auth with JWT + role support (`admin` / `user`)
- Admin panel support: create/edit/delete tournaments, publish results, users + registrations, wallet overview
- Realtime tournament UX: live countdown and auto-refresh
- Notification system: toast UX + in-app notification bell
- Wallet system with Razorpay-like simulated add money flow
- Transaction history and wallet analytics
- Global leaderboard with rank, wins, winnings, score
- Dashboard insights with charts and summary stats
- API pagination for scalable list endpoints
- Security hardening: `helmet`, rate limiting, request schema validation (`zod`)

## Project Structure

- `client` - React frontend
- `server` - Express API and Mongo models

## Run Locally

1. Copy `server/.env.example` to `server/.env`
2. Update `MONGO_URI`, `JWT_SECRET`, `ADMIN_SECRET`, `ADMIN_EMAIL`
3. Install dependencies:
   - `npm install`
   - `npm install --prefix client`
   - `npm install --prefix server`
4. Start both apps:
   - `npm run dev`

Frontend runs on Vite default port, backend on `5000`.

## API Endpoints (Core)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/tournaments`
- `POST /api/tournaments` (admin)
- `PATCH /api/tournaments/:matchId` (admin)
- `DELETE /api/tournaments/:matchId` (admin)
- `POST /api/tournaments/:matchId/join`
- `GET /api/tournaments/dashboard/me`
- `GET /api/results`
- `POST /api/results` (admin)
- `GET /api/leaderboard`
- `POST /api/wallet/add-money`
- `GET /api/wallet/transactions`
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/registrations`
- `GET /api/admin/wallet-overview`
