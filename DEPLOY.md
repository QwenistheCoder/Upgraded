# RaiSK Upgraded — Deployment Guide

This guide covers everything you need to set up yourself. The code is already
written and secure — these are the external steps (accounts, pushing to GitHub,
deploying).

---

## What Files Are PRIVATE (NOT on GitHub)

The root `.gitignore` already blocks:

| File/Pattern | Why |
|---|---|
| `**/.env` | Contains JWT_SECRET and other secrets |
| `**/.env.local`, `.env.production`, `.env.development` | Environment overrides with secrets |
| `**/data/` | SQLite database file (contains all user data) |
| `**/*.db`, `*.db-wal`, `*.db-journal` | SQLite database files |
| `node_modules/` | Thousands of packages — reinstall via `npm install` |
| `**/dist/` | Compiled output — rebuild from source |

**Nothing with passwords or keys will appear on GitHub.**

---

## How to Verify Nothing Sensitive Goes to GitHub

```bash
git add .
git status
# Look through the list. You should NOT see any .env or .db files.
```

The `.gitignore` guarantees they are blocked.

---

## Step 1 — Create `.env` Files

### Local Development (your computer)

This file already exists at `server/.env`. Verify it has a JWT_SECRET:

```
server/.env
```

It should contain:
```
JWT_SECRET=<128-hex-char-string>
PORT=3001
NODE_ENV=development
DATABASE_URL=file:./data/raisk.db
ALLOWED_ORIGINS=*
```

### Production Frontend

Create this file:

```
client/.env.production
```

With this content:
```
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

> **Replace** `YOUR-BACKEND-URL` with the actual URL from Step 3.

This file is also blocked by `.gitignore` — it will NOT go to GitHub.

---

## Step 2 — Push to GitHub

```bash
cd C:\Users\rapha\Downloads\project2
git init
git add .
git status
```

**Check the output.** You should NOT see any `.env` or `.db` files listed.
If you do, stop and tell me.

```bash
git commit -m "Initial commit — RaiSK Upgraded"
```

Now go to https://github.com/new and create a new repository:
- Name: `raisk`
- **Do NOT** initialize with README or .gitignore (you already have them)
- Make it **Public**

Then run the two commands GitHub shows you for pushing an existing repo,
which will look something like:

```bash
git remote add origin https://github.com/YOUR-USERNAME/raisk.git
git branch -M main
git push -u origin main
```

> **Replace** `YOUR-USERNAME` with your actual GitHub username.

---

## Step 3 — Deploy Backend to Render (Free)

1. Go to https://render.com
2. Click **Get started for free** → Sign in with GitHub
3. Authorize Render to access your GitHub account

4. Click **New +** → **Web Service**

5. Connect your `raisk` repository

6. Fill in the form:
   - **Name**: `raisk-api` (or anything you want)
   - **Region**: closest to you
   - **Root Directory**: leave it empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install && cd server && npm install && npm run build`
   - **Start Command**: `cd server && node dist/index.js`
   - **Plan**: **Free**

7. Click **Environment** → **Add Environment Variable** and add these:

   | KEY | VALUE |
   |---|---|
   | `JWT_SECRET` | Paste the 128-char hex from your `server/.env` file |
   | `NODE_ENV` | `production` |
   | `ALLOWED_ORIGINS` | `https://YOUR-USERNAME.github.io` |

   > The ALLOWED_ORIGINS value should match your final GitHub Pages URL.
   > If you don't know it yet, use `*` (allow all) for now and update it later.

8. Click **Create Web Service**

Render will build your project. This takes 3-10 minutes.

Once done, Render gives you a URL like:
```
https://raisk-api.onrender.com
```

**Copy this URL.** You need it in Step 4.

### About the free tier

- The server goes to sleep after 15 minutes of no traffic
- Next request after sleep takes ~30 seconds to start ("cold start")
- After that, responses are fast
- The SQLite database at `./data/raisk.db` persists across requests
- **Warning**: Render free tier does NOT guarantee permanent disk persistence. Database may reset on rebuild. For a real product, upgrade to a paid tier or use Turso (free SQLite at the edge).

---

## Step 4 — Create the Frontend `.env.production`

Create this file:

```
client/.env.production
```

Write:
```
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

Replace the URL with your actual Render URL from Step 3.

This file is **blocked by `.gitignore`** — it will never appear on GitHub.

---

## Step 5 — Deploy Frontend to GitHub Pages

Install the deployment tool:

```bash
npm install --save-dev gh-pages
```

Open `client/package.json` and add these two things:

1. Add `"homepage"` at the top level:
```json
{
  "name": "@raisk/client",
  "homepage": "https://YOUR-USERNAME.github.io/raisk",
  ...
}
```

2. Add `"deploy"` to the `"scripts"` section:
```json
"scripts": {
  ...
  "deploy": "vite build && gh-pages -d dist"
}
```

Then deploy:

```bash
npm run deploy -w client
```

This:
- Builds the React app
- Pushes the built files to a `gh-pages` branch on GitHub

Finally, go to:
- https://github.com/YOUR-USERNAME/raisk → **Settings** → **Pages**
- Set **Source** to `gh-pages` branch
- Click **Save**

Your site is live at: `https://YOUR-USERNAME.github.io/raisk`

It may take 1-5 minutes for the first deploy to work.

---

## How to Update the Frontend After Changing Code

```bash
# Make your code changes
git add .
git commit -m "Update something"
git push

# Then redeploy:
npm run deploy -w client
```

---

## How to Update the Backend After Changing Code

```bash
git push
```

Render automatically redeploys when it detects a change on your main branch.

---

## Security Checklist (Already Done)

- [x] Passwords hashed with bcrypt (12 salt rounds)
- [x] JWT tokens expire after 7 days
- [x] API keys encrypted with AES-256-GCM (authenticated, tamper-proof)
- [x] Helmet.js security headers on all responses
- [x] Rate limiting: 100 req / 15min globally, 20 req / 15min on auth (brute force protection)
- [x] CORS configured to only accept requests from your frontend origin
- [x] `.env` files blocked from Git
- [x] `.db` files blocked from Git
- [x] Body parser limited to 1MB to prevent oversized requests

---

## Local Development

```bash
# First time only:
npm install

# Start both server + client:
npm run dev
```

Opens on `http://localhost:5173`

---

## If You Need to Regenerate the JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Put the output into:
1. `server/.env` → `JWT_SECRET=<the-new-string>`
2. Render dashboard → Environment → update `JWT_SECRET` value

**Warning**: This logs out ALL users. They must sign in again. Only do this
if the old secret was ever leaked or compromised.
