# 🚀 Deploy to YOUR OWN GitHub + Vercel — Step by Step

This guide answers two things:
1. **Which files to upload** to your new GitHub repository.
2. **How the "no more than 12 Serverless Functions on Hobby plan" error is
   already solved** — with ZERO loss of features.

---

## ✅ Part 1 — The 12-Function Limit is ALREADY FIXED

Vercel's free (Hobby) plan allows a maximum of **12 serverless functions**
(each `.js` file inside the `api/` folder that handles requests = 1 function).

Your project used to have ~24 of them. They have all been **merged into just 3
hub functions**, and a `.vercelignore` file tells Vercel to skip the old ones:

| Hub function        | Handles everything for…                                             |
|---------------------|--------------------------------------------------------------------|
| `api/data.js`       | treks, tours, gallery, reviews, faqs, bookings, contact messages, site content, business settings, hikers, admin config, trek bookings |
| `api/payment.js`    | Razorpay create-order, verify-payment, and webhook                 |
| `api/auth.js`       | mobile OTP login/signup + photo/video uploads                      |

Plus 2 shared helper files that Vercel does **not** count as functions:
`api/db-client.js` and `api/db-wake.js`.

➡️ **Total functions deployed: 3.** Comfortably under 12.

**Nothing changed for your users** — a tiny helper (`src/lib/apiShim.ts`)
automatically points the website to these hubs. Every feature works exactly
the same: booking, payment, gallery, reviews, admin panel, everything.

> You do NOT need to do anything for this to work. Just upload the whole
> project (including the `.vercelignore` file) and deploy.

---

## ✅ Part 2 — Which Files to Upload to GitHub

**Easiest & safest answer: upload the ENTIRE project folder EXCEPT the folders
your `.gitignore` already blocks.** When you use `git`, the `.gitignore` file
automatically prevents the wrong files from being uploaded.

### 📁 UPLOAD these (your whole project):

```
api/                     ← backend functions (keep all; .vercelignore handles the extras)
public/                  ← images, favicon, hero video
src/                     ← all your website code
index.html
package.json
package-lock.json
vite.config.ts
tsconfig.json
tsconfig.app.json
tsconfig.node.json
eslint.config.js
vercel.json              ← safe (see note below)
.vercelignore            ← IMPORTANT: this is what keeps you under 12 functions
.gitignore
.env.example             ← safe template (no real secrets)
migration/               ← your SQL files for setting up your own Supabase
DEPLOY_TO_GITHUB_AND_VERCEL.md   (this guide)
GO_LIVE_CHECKLIST.md
README.md
```

### 🚫 DO NOT upload these (already blocked by `.gitignore`):

```
node_modules/     ← huge; Vercel rebuilds it automatically
dist/             ← build output; Vercel rebuilds it automatically
.env              ← YOUR SECRETS. Never upload this.
.vercel/          ← local Vercel cache
rzp-key.csv       ← your Razorpay secret file
```

> ⚠️ **About `vercel.json`:** right now it contains keys so the demo works.
> Before you push to a PUBLIC GitHub repo, either:
> - make your repo **Private**, OR
> - remove the values from `vercel.json` and instead add them in
>   **Vercel → Settings → Environment Variables** (recommended, see Part 4).

---

## ✅ Part 3 — Upload to GitHub (beginner steps)

**Option A — GitHub Desktop (easiest, no commands):**
1. Install **GitHub Desktop** and sign in.
2. `File → Add Local Repository` → choose this project folder.
3. It will offer to create a repository → click **Create a Repository**.
4. Give it a name (e.g. `trekkie-mavala`), keep it **Private**, click **Create**.
5. Click **Publish repository**.
   (GitHub Desktop respects `.gitignore` automatically — secrets stay out.)

**Option B — Command line:**
```bash
cd your-project-folder
git init
git add .
git commit -m "TREKKIE Mavala website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/trekkie-mavala.git
git push -u origin main
```

---

## ✅ Part 4 — Deploy on Vercel (linked to your GitHub)

1. Go to **vercel.com** → sign in **with GitHub**.
2. Click **Add New… → Project**.
3. **Import** your `trekkie-mavala` repository.
4. Framework preset: **Vite** (auto-detected). Leave build settings default:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Open **Environment Variables** and add each of these
   (get Supabase values from your own project; use your Razorpay keys):

   | Name | Example value |
   |------|---------------|
   | `VITE_SUPABASE_URL` | `https://YOUR.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | your anon key |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service role secret |
   | `VITE_RAZORPAY_KEY_ID` | `rzp_test_...` |
   | `RAZORPAY_KEY_ID` | `rzp_test_...` |
   | `RAZORPAY_KEY_SECRET` | your secret |
   | `RAZORPAY_WEBHOOK_SECRET` | any long random string |

6. Click **Deploy**. Done! 🎉

Every time you push new code to GitHub, Vercel auto-deploys the update.

---

## ✅ Part 5 — Set up YOUR OWN Supabase

Your live site needs its own database. In the `migration/` folder you have:
- `1_SCHEMA.sql` – creates all tables (run first)
- `2_SEED.sql` – adds starter content (optional)
- `3_RLS.sql` – security rules (run last)

Steps:
1. Create a project at **supabase.com**.
2. Open **SQL Editor → New query**.
3. Paste `1_SCHEMA.sql` → **Run**. Then `2_SEED.sql` → Run. Then `3_RLS.sql` → Run.
4. Copy your Project URL + keys from **Settings → API** into Vercel (Part 4).

Full details are in `migration/README_GO_LIVE_GUIDE.md` and
`GO_LIVE_CHECKLIST.md`.

---

## 🔒 Security reminders
- **Regenerate your Razorpay key secret** (it was shared in chat) before going live.
- Keep your GitHub repo **Private** if `vercel.json` still holds keys.
- Never commit the real `.env`. Only `.env.example` is safe.
