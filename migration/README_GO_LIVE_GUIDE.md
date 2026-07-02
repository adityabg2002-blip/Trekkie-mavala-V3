# 🚀 TREKKIE मावळा — Go-Live Guide (for beginners)

This folder contains everything you need to move the website onto **your own accounts**
(your Supabase + your GitHub + your Vercel). Follow the parts in order.

Files in this folder:
- `1_SCHEMA.sql`  → creates all database tables
- `2_SEED.sql`    → optional starter data + your admin login
- `3_RLS.sql`     → security rules (very important)

Environment values you'll need are listed at the very bottom in **Part D**.

---

## PART A — Set up YOUR Supabase (about 10 minutes)

### A1. Create the project
1. Go to **https://supabase.com** and sign in (you already made an account).
2. Click **New Project**.
3. Give it a name (e.g. `trekkie-mavala`), set a strong **database password** (save it somewhere safe), pick the region closest to India (e.g. *Mumbai / ap-south-1*), click **Create new project**.
4. Wait ~2 minutes for it to finish provisioning.

### A2. Run the SQL — where to copy from and where to paste
You will copy the SQL from THIS project's files into your Supabase.

**How to open the files to copy:**
- In this project, open the `migration/` folder.
- Open `1_SCHEMA.sql` → select ALL the text (Ctrl+A / Cmd+A) → copy (Ctrl+C / Cmd+C).

**Where to paste in Supabase:**
1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **+ New query**.
3. Paste the copied SQL into the big text box.
4. Click the green **Run** button (bottom-right).
5. You should see **"Success. No rows returned"** — that means the tables were created. ✅

**Now repeat the same copy-paste-Run for the other two files, IN THIS ORDER:**
1. `2_SEED.sql`  → click New query, paste, Run. (Gives you starter data + admin login.)
2. `3_RLS.sql`   → click New query, paste, Run. (Turns on security.)

> ⚠️ Order matters: always `1_SCHEMA` → `2_SEED` → `3_RLS`.

### A3. Get your Supabase keys (you'll need these in Part C)
1. In Supabase, click **Project Settings** (gear icon) → **API**.
2. Copy and save these three values:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (safe for the browser)
   - **service_role** key (SECRET — server only, never share)

### A4. Create the storage bucket (for uploaded photos/videos & logo)
1. In Supabase, click **Storage** → **New bucket**.
2. Name it exactly: `site-assets`
3. Toggle **Public bucket** ON → **Create bucket**.

Done with Supabase. ✅

---

## PART B — Put the code on YOUR GitHub (about 10 minutes)

You need the project's code in your own GitHub so Vercel can deploy it.

### B1. Download / export this project's code
- Use the **Download / Export** option in this builder to get a ZIP of the whole project, and unzip it on your computer. It should contain folders like `src/`, `api/`, `public/`, and files like `package.json`, `vercel.json`.

### B2. Create a GitHub account & repo
1. Go to **https://github.com** and sign up / sign in.
2. Click the **+** (top-right) → **New repository**.
3. Repository name: `trekkie-mavala` → keep it **Private** → click **Create repository**.

### B3. Upload the code (easiest, no commands)
1. On your new empty repo page, click **"uploading an existing file"** (the link in the middle).
2. Drag-and-drop ALL the project files & folders (from the unzipped folder) into the upload box.
   - Tip: if drag-drop of folders is tricky, GitHub's "choose your files" lets you select everything inside the project folder.
3. Scroll down, click **Commit changes**.

> Optional (if you know Git): run these in the project folder instead:
> ```
> git init
> git add .
> git commit -m "Initial commit"
> git branch -M main
> git remote add origin https://github.com/YOUR_USERNAME/trekkie-mavala.git
> git push -u origin main
> ```

> ⚠️ Do NOT upload a `.env` file with secrets to a public repo. Your repo is Private,
> and we set secrets in Vercel instead (Part C). If a `.env` exists, that's fine in a
> private repo, but the values that matter for production are the Vercel ones.

Done with GitHub. ✅

---

## PART C — Deploy on YOUR Vercel (about 10 minutes)

### C1. Connect Vercel to GitHub
1. Go to **https://vercel.com** and **Sign up with GitHub** (this links the two).
2. On the Vercel dashboard, click **Add New… → Project**.
3. Find your `trekkie-mavala` repo in the list → click **Import**.

### C2. Add your Environment Variables (this is the key step)
Before clicking Deploy, expand **Environment Variables** and add each of the
following (Name on the left, Value on the right). Use YOUR values from Part A3,
and your Razorpay keys.

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
| `VITE_SUPABASE_URL` | your Supabase Project URL (same as above) |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key (same as above) |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_xxxxx` (Key ID only) |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxx` (same Key ID) |
| `RAZORPAY_KEY_SECRET` | your Razorpay **secret** (server only) |
| `RAZORPAY_WEBHOOK_SECRET` | any strong text you choose (see Part E) |

> The `VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_AUTH_PROXY` are only needed if you use
> Google login — you can leave them out for now.

### C3. Deploy
1. Click **Deploy**.
2. Wait ~1–2 minutes. Vercel gives you a live URL like `https://trekkie-mavala.vercel.app`.
3. Open it — your site is live on YOUR accounts! 🎉

### C4. Updating the site later
Any time you change code and push to GitHub (or re-upload files), Vercel
**auto-deploys** the new version. To change a text/price/photo, just use the
**Admin (Commander) panel** on the site — no redeploy needed.

---

## PART D — Environment values cheat-sheet

Copy this template, fill in YOUR values, keep it somewhere private:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

---

## PART E — Razorpay (test now, real later)

**Right now (test mode):** keep using your `rzp_test_...` keys. Payments are fake
(use test card `4111 1111 1111 1111`, any future expiry, any CVV/OTP).

**Set up the webhook (works in test mode too):**
1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. URL: `https://YOUR-VERCEL-URL/api/razorpay-webhook`
3. Secret: type the SAME text you used for `RAZORPAY_WEBHOOK_SECRET` in Vercel.
4. Select events: **payment.captured** and **payment.failed** → Save.
   This makes bookings reliable even if the customer's browser closes after paying.

**When you're ready for REAL money:**
1. Complete Razorpay **KYC** (business/PAN/bank details) and get **Live Mode activated**.
2. Generate **Live keys** (`rzp_live_...`).
3. In Vercel → Project → **Settings → Environment Variables**, replace the three
   Razorpay values with the live ones, and update the webhook secret if you change it.
4. Redeploy (Vercel → Deployments → Redeploy). That's the only change needed. ✅

> 🔒 Security: regenerate any secret key you've ever shared in chat. Never commit
> secrets to a public repo. Never prefix a secret with `VITE_`.

---

## Quick checklist

- [ ] A: Supabase project created
- [ ] A: Ran `1_SCHEMA.sql`, then `2_SEED.sql`, then `3_RLS.sql`
- [ ] A: Created public `site-assets` storage bucket
- [ ] A: Saved Project URL + anon key + service_role key
- [ ] B: Code uploaded to your private GitHub repo
- [ ] C: Imported repo into Vercel + added all env variables
- [ ] C: Deployed and opened the live URL
- [ ] E: Added Razorpay webhook
- [ ] Logged into Admin (command / mavala2025) and changed the passcode

You're live. 🏔️
