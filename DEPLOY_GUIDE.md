# 🚀 Deploy TREKKIE मावळा to YOUR OWN GitHub + Vercel

A beginner-friendly, do-this-in-order guide.

---

## The one concept you must understand

Vercel's **free (Hobby) plan allows only 12 serverless functions**. This project has ~27 API
files, so we use 3 tricks to stay under the limit:

1. **3 consolidated files** hold all the logic: `api/data.js`, `api/auth.js`, `api/payment.js`
2. **`vercel.json` rewrites** redirect old URLs (e.g. `/api/treks`) to them (`/api/data?resource=treks`)
3. **`.vercelignore`** stops the 20 redundant files from deploying

➡️ Result: only ~6 functions deploy. If you forget `.vercelignore`, the deploy breaks with
"too many functions" and login/API calls fail. **Do not delete `.vercelignore`.**

---

## STEP 1 — Prepare the files for GitHub

1. In your project, **rename `vercel.github-safe.json` → `vercel.json`** (overwrite the old one).
   This version has the rewrites but **no secrets**, so it's safe to be public on GitHub.
2. Make sure these are committed (dot-files are easy to miss):
   - `.vercelignore`  ✅ (critical)
   - `vercel.json`     ✅ (the safe one)
   - the whole `api/` folder ✅
   - `src/`, `public/`, `index.html`, `package.json`, `vite.config.ts` ✅
3. Do **NOT** commit: `.env`, `node_modules/`, `dist/`, `.vercel/` (already blocked by `.gitignore`).

```bash
git add .vercelignore vercel.json      # force-add the dotfile just in case
git add -A
git commit -m "Production-ready: consolidated APIs, webhook, RLS"
git push origin main
```

---

## STEP 2 — Create YOUR OWN Supabase project

1. Go to https://supabase.com → New Project.
2. Open **SQL Editor** and run the SQL in `SUPABASE_SETUP.sql` (in this repo).
3. Open **Settings → API** and copy: Project URL, `anon` public key, `service_role` secret key.
4. **Storage:** create a public bucket named `site-assets` (Storage → New bucket → public).

---

## STEP 3 — Import the repo into Vercel

1. https://vercel.com → **Add New → Project → Import** your GitHub repo.
2. Framework: **Vite** (auto-detected). Build: `npm run build`. Output: `dist`.
3. **Before deploying**, add Environment Variables (next step).

---

## STEP 4 — Add Environment Variables in Vercel (CRITICAL)

Vercel → your project → **Settings → Environment Variables**. Add each of these
(use YOUR OWN Supabase values from Step 2):

| Name | Example / Notes |
|------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |
| `SUPABASE_SERVICE_ROLE_KEY`     | your service_role SECRET |
| `VITE_SUPABASE_URL`             | same as Supabase URL |
| `VITE_SUPABASE_ANON_KEY`        | same anon public key |
| `VITE_GOOGLE_CLIENT_ID`         | (optional) Google OAuth client id |
| `VITE_GOOGLE_AUTH_PROXY`        | https://designarena.ai/auth/google/callback |
| `VITE_RAZORPAY_KEY_ID`          | rzp_test_xxx (public-safe) |
| `RAZORPAY_KEY_ID`               | rzp_test_xxx |
| `RAZORPAY_KEY_SECRET`           | your Razorpay secret (regenerate the leaked one!) |
| `RAZORPAY_WEBHOOK_SECRET`       | any strong string; must match the webhook you create |

Then click **Deploy**.

---

## STEP 5 — Set up the Razorpay Webhook (payment safety net)

After deploy you'll have a live URL like `https://your-app.vercel.app`.

1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**
2. URL: `https://your-app.vercel.app/api/razorpay-webhook`
3. Secret: the **same** value you set for `RAZORPAY_WEBHOOK_SECRET`
4. Active events: `payment.captured` and `payment.failed`
5. Save.

Now even if a customer's browser closes right after paying, the booking is still saved.

---

## STEP 6 — Verify it works

- Open your live site → book a trek → pay with Razorpay **test card** `4111 1111 1111 1111`
  (any future expiry, any CVV/OTP).
- Check **Supabase → Table Editor → trek_bookings** → you should see the row with `payment_status = Paid`.
- Admin login: go to **Commander Login** → ID `command` / passcode `mavala2025`
  → open **Booking Logs** to see paid bookings inside the site.

---

## Going LIVE with real money (later)

1. Complete Razorpay **KYC** → get **Live Mode** activated.
2. Generate **Live keys** (`rzp_live_...`), update `RAZORPAY_KEY_ID`, `VITE_RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET` in Vercel, and switch the webhook to your Live mode.
3. Add a **custom domain** in Vercel → Settings → Domains.
4. Add legal pages (Terms, Privacy, Refund) — already editable in your admin Site Customizer.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Too many functions" / API 404 on deploy | `.vercelignore` missing from the repo — add & re-push. |
| "Credentials incorrect" on admin login | Env vars not set in Vercel, or wrong Supabase project. ID=`command`, pass=`mavala2025`. |
| Payment popup won't open | `VITE_RAZORPAY_KEY_ID` missing in Vercel env vars. |
| Booking not saved after payment | Set up the webhook (Step 5) and check `RAZORPAY_KEY_SECRET`. |
| Blank site / build failed | Framework must be **Vite**, output dir `dist`. |
