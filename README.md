# CVCraft Pro — Backend

Node.js/Express API backed by Supabase Postgres. Replaces the old front-end-only
`localStorage` "database" and fake auth with real hashed-password auth (JWT +
bcrypt), a `cvs` table, and a `payments` table.

## ⚠️ Before anything else

If you shared your Supabase database password anywhere outside your own local
`.env` file (chat, a doc, a public repo, etc.), **rotate it now**:
Supabase Dashboard → Project Settings → Database → Reset database password.
Then update `DATABASE_URL` below with the new one.

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

## Notes / things intentionally left as stubs

- **Password reset emails**: no email provider is wired up. Add one (Resend, SendGrid, Postmark, or migrate auth to Supabase Auth itself) plus a `password_reset_tokens` table.
- **Payment confirmation**: currently trusts the client to say "I paid," same limitation as the original app just moved server-side. For real money, use PayPal's Orders API + webhook signature verification server-to-server.
- **PDF generation** stays client-side (html2canvas + jsPDF) in the frontend — no reason to move that to the server.
