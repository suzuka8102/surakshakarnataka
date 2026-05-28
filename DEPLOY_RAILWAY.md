# 🚀 Deploy SurakshaKarnataka to Railway

## Step 1 — Create GitHub Repository

1. Go to https://github.com and sign in (create account if needed)
2. Click **New repository**
3. Name it `surakshakarnataka`
4. Set to **Public**
5. Click **Create repository**

## Step 2 — Upload Code to GitHub

Open Terminal on your Mac and run:

```bash
cd ~/Downloads/deploy
git init
git add .
git commit -m "SurakshaKarnataka initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/surakshakarnataka.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3 — Create Railway Account

1. Go to https://railway.app
2. Click **Login with GitHub**
3. Authorize Railway

## Step 4 — Set Up MySQL Database on Railway

1. Click **New Project**
2. Click **Add a Service** → **Database** → **MySQL**
3. Wait for it to create (30 seconds)
4. Click on the MySQL service → **Variables** tab
5. Note down these values:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

## Step 5 — Import Database Schema

1. Click MySQL service → **Data** tab → **Connect**
2. Use the connection details to connect a MySQL client
   OR use Railway's built-in query editor
3. Copy and paste the contents of `database/surakshakarnataka.sql`
4. Run it — all 20 tables + 5 views + seed data will be created

## Step 6 — Deploy PHP API

1. In Railway project → **New Service** → **GitHub Repo**
2. Select your `surakshakarnataka` repo
3. Set **Root Directory** to `xampp_api`
4. Railway auto-detects Dockerfile and builds
5. After deploy, go to **Settings** → **Networking** → **Generate Domain**
6. Copy the URL — looks like `https://api-xxx.up.railway.app`

## Step 7 — Deploy React Frontend

1. In Railway project → **New Service** → **GitHub Repo**
2. Select your `surakshakarnataka` repo again
3. Leave Root Directory as `/` (root)
4. Add Environment Variable:
   - `VITE_API_URL` = `https://api-xxx.up.railway.app` (your PHP URL from step 6)
5. After deploy → **Settings** → **Networking** → **Generate Domain**
6. Your app is live at `https://surakshakarnataka-xxx.up.railway.app` 🎉

## Step 8 — Test It

1. Open your Railway URL on your phone
2. Sign up as a new citizen
3. File a complaint
4. Login as police → FIR Inbox → complaint appears
5. ✅ Everything works from anywhere in the world!

## Login Credentials (same as local)
| Role | Email | Password |
|------|-------|----------|
| Citizen | suresh@citizen.in | Citizen@123 |
| Police | sho.kolar@ksp.gov.in | Police@123 |
| Admin | sp.kolar@ksp.gov.in | SP@123 |

## Cost
- Railway free tier: 500 hours/month
- Enough for college demo + presentation
- No credit card required
