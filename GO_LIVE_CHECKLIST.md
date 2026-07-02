# 🚀 TREKKIE मावळा — Go-Live Checklist (Beginner Friendly)

Your website is a **fully working demo** right now: real database, real code,
Razorpay in **TEST mode**. Follow these steps in order to operate it for real.

---

## STEP 1 — Create your OWN Supabase project
1. Go to https://supabase.com → Sign in → **New Project**.
2. Give it a name + a strong database password → wait ~2 minutes.
3. Open **SQL Editor → New Query**.
4. Copy the ENTIRE contents of **`SETUP_YOUR_OWN_SUPABASE.sql`** and paste it → **Run**.
   (This creates all tables and turns on security.)
5. Go to **Project Settings → API** and copy these three values:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this SECRET)

---

## STEP 2 — Put YOUR keys into the project
Open **`vercel.json`** and replace the Supabase values with yours:
```
"NEXT_PUBLIC_SUPABASE_URL":     "https://YOUR-PROJECT.supabase.co",
"NEXT_PUBLIC_SUPABASE_ANON_KEY":"YOUR-anon-key",
"SUPABASE_SERVICE_ROLE_KEY":    "YOUR-service-role-key",
"VITE_SUPABASE_URL":            "https://YOUR-PROJECT.supabase.co",
"VITE_SUPABASE_ANON_KEY":       "YOUR-anon-key",
```
For local testing, put the same in a **`.env`** file in the project root.

> ⚠️ Rule: anything starting with `VITE_` is visible in the browser — only put
> PUBLIC keys there. The `service_role` and Razorpay `SECRET` must NEVER start
> with `VITE_`.

---

## STEP 3 — Razorpay: get activated for real payments
Razorpay gives Live keys only AFTER you have a working website (you already do!).
1. Log in to https://dashboard.razorpay.com
2. **Complete KYC / Activation** (business details, PAN, bank account).
3. Once activated, switch to **Live Mode** → **Settings → API Keys → Generate Live Key**.
4. You'll get `rzp_live_...` (ID) and a new **Secret**.
5. In **`vercel.json`**, replace the test keys:
```
"VITE_RAZORPAY_KEY_ID": "rzp_live_XXXXXXXX",
"RAZORPAY_KEY_ID":      "rzp_live_XXXXXXXX",
"RAZORPAY_KEY_SECRET":  "your-live-secret",
```
> 🔒 The test secret you shared earlier is exposed — click **Regenerate** on the
> test key too, just to be safe.

---

## STEP 4 — Turn on the Payment Webhook (reliability safety net)
This ensures a booking is saved even if the customer's internet drops after paying.
1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. **URL:** `https://YOUR-LIVE-SITE/api/razorpay-webhook`
3. **Secret:** make up a strong random string.
4. Put that same string in `vercel.json` as `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events:** tick `payment.captured` and `payment.failed`.
6. Save.

---

## STEP 5 — Deploy under your own account
1. Push this project to your own GitHub.
2. Import it in your own **Vercel** account.
3. Add all the environment variables from `vercel.json` in
   **Vercel → Project → Settings → Environment Variables**.
4. Deploy → connect your **custom domain**.

---

## STEP 6 — Final production polish
- [ ] Change the admin login (Command → Security) from `command / mavala2025`.
- [ ] Add real **Privacy Policy, Refund Policy, Terms** (editable in the footer as admin).
- [ ] Test a real ₹1 payment, then refund it from the Razorpay dashboard.
- [ ] Confirm bookings appear in **Command → Payments** and in Supabase.

---

## ✅ What's already built for you
- Booking form + Razorpay Standard Checkout + signature verification.
- Server-side order creation (secret never touches the browser).
- Payment webhook endpoint (`/api/razorpay-webhook`).
- RLS security policies (bookings are private).
- Admin **Payments** dashboard with status filters + CSV export.
- Full bilingual site with live content editing.

You are 100% ready to submit to Razorpay for activation. Good luck, Mavala! 🏔️
