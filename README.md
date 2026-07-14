# CVCraft Pro — Backend

Node.js/Express API backed by Supabase Postgres. Replaces the old front-end-only
`localStorage` "database" and fake auth with real hashed-password auth (JWT +
bcrypt), a `cvs` table, and a `payments` table.



## Setup

```bash
npm install
cp .env.example .env
# edit .env: DATABASE_URL, JWT_SECRET, CORS_ORIGIN
npm run migrate   # creates users / cvs / payments tables in Supabase
npm run dev        # http://localhost:4000
```

## Environment variables

| Var | Description |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (`postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres`) |
| `JWT_SECRET` | Long random string used to sign session tokens (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Session lifetime, default `7d` |
| `CORS_ORIGIN` | Where your frontend is hosted, e.g. `http://localhost:5500` |

## API

All authenticated routes expect `Authorization: Bearer <token>`.

### Auth — `/api/auth`
- `POST /signup` `{ fullName, email, password }` → `{ token, user }`
- `POST /login` `{ email, password }` → `{ token, user }`
- `GET /me` (auth) → `{ user }`
- `POST /forgot-password` `{ email }` → generic success message (**stub** — see note in `auth.controller.js`; wire up a real email provider before production)

### CVs — `/api/cvs` (all auth)
- `GET /` → list of the user's CVs (metadata only)
- `GET /:id` → full CV including `data` (all form fields + selected template)
- `POST /` `{ name, template, data }` → create
- `PUT /:id` `{ name?, template?, data? }` → update
- `DELETE /:id` → delete

### Payments — `/api/payments` (all auth)
- `GET /` → payment history
- `POST /` `{ cvId, amount, providerOrderId }` → create a `pending` record before redirecting to PayPal
- `POST /:id/confirm` → mark `completed` (**placeholder** — replace with a real PayPal webhook handler that verifies the event before flipping status; see note in `payment.controller.js`)

## Deploying to Vercel (separate repo from the frontend — that's correct)

Two independent repos/projects, one for `cvcraft-backend` and one for
`cvcraft-frontend`, is the right setup. Vercel deploys each on its own domain
(e.g. `cvcraft-backend.vercel.app` and `cvcraft-frontend.vercel.app`), and the
frontend just calls the backend's URL over the internet — they don't need to
share a repo or a filesystem.

Files already in this repo for that:
- `index.js` — the actual entry point Vercel runs. It only *exports* the
  Express app (`module.exports = app`) instead of calling `app.listen()`,
  because Vercel wraps it as a serverless function itself. `src/server.js`
  (with `app.listen()`) is still there for local dev via `npm run dev`.
- `vercel.json` — points Vercel at `index.js` and routes all paths to it.

### Where does `DATABASE_URL` (and the rest of `.env`) actually go?

**Not in a file in the repo at all** — that's the whole point of `.gitignore`
excluding `.env`. On Vercel:

1. Vercel Dashboard → your backend project → **Settings → Environment Variables**
2. Add each one from `.env.example` with its real value: `DATABASE_URL`,
   `JWT_SECRET`, `CORS_ORIGIN` (set this to your deployed **frontend**'s URL,
   e.g. `https://cvcraft-frontend.vercel.app`, not `localhost`).
3. Redeploy so the function picks them up.

Locally, they still go in a `.env` file next to `package.json` (gitignored,
never uploaded anywhere) — used by `npm run dev`.

### After deploying

- Run the migration once against the live database: either `npm run migrate`
  locally (with `.env` pointed at the Neon `DATABASE_URL`), or paste
  `sql/schema.sql` into Neon's SQL editor.
- Update the frontend's `window.CVCRAFT_API_BASE_URL` in `index.html` to your
  deployed backend URL + `/api`, e.g. `https://cvcraft-backend.vercel.app/api`.
- Neon connections here use the **pooled** endpoint (the `-pooler` host) —
  keep using that one, not the direct host, since serverless functions open
  a lot of short-lived connections.

## Notes / things intentionally left as stubs

- **Password reset emails**: no email provider is wired up. Add one (Resend, SendGrid, Postmark, or migrate auth to Supabase Auth itself) plus a `password_reset_tokens` table.
- **Payment confirmation**: currently trusts the client to say "I paid," same limitation as the original app just moved server-side. For real money, use PayPal's Orders API + webhook signature verification server-to-server.
- **PDF generation** stays client-side (html2canvas + jsPDF) in the frontend — no reason to move that to the server.
