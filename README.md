# 🍔 FoodDash — Full-Stack Food Delivery App

A complete, production-style food delivery application:

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + Framer Motion + Lucide React
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Auth:** JWT (JSON Web Tokens) with bcrypt password hashing

```
HOME → Restaurants / Login / Signup
        → Restaurant List → Restaurant Details → Add Food → Reviews
        → CART (+ coupon code) → CHECKOUT → ADDRESS → PAYMENT (card / UPI / QR scan / COD)
        → ORDER SUCCESS → ORDER TRACKING (live) → DELIVERED
        → My Orders · Favorites (❤) · Owner Dashboard
```

---

## ✨ What's new in this version

This build fixes the **"Track your order" button not opening the next page"**
issue and adds several new features on top of the original app:

| Fixed | What was wrong | What changed |
|---|---|---|
| Order tracking page "not opening" | `axios` had **no request timeout**. If the backend API was unreachable, the login-check request on every page hung forever, leaving the app stuck on a loading spinner forever — which looks exactly like "the page won't open." | Added a 10s timeout to `frontend/src/api/axios.js`, and made the tracking page poll a real status endpoint with an automatic offline fallback so it can **never get stuck**. See [Troubleshooting](#-troubleshooting). |

| New feature | Where |
|---|---|
| 💳 **Payment QR code scanner** — generate a "Scan to Pay" UPI QR code, *and* scan any QR code with your device camera to pay instantly | `frontend/src/pages/Payment.jsx`, `frontend/src/components/QrScanner.jsx` |
| 📦 **Live order tracking** — the backend now auto-advances orders through Confirmed → Preparing → Out for delivery → Delivered over time, and the tracking page polls it every 4s | `backend/src/routes/orders.js`, `frontend/src/pages/OrderTracking.jsx` |
| 🧾 **My Orders** (order history) | `frontend/src/pages/Orders.jsx` |
| ❤️ **Favorites** — save restaurants and see them in one place | `backend/src/routes/favorites.js`, `frontend/src/pages/Favorites.jsx` |
| ⭐ **Ratings & reviews** on every restaurant page | `backend/src/routes/reviews.js`, `frontend/src/components/ReviewSection.jsx` |
| 🎟️ **Coupon codes** at checkout (`WELCOME50`, `SAVE10`, `FOODIE20` seeded) | `backend/src/routes/coupons.js`, `frontend/src/pages/Cart.jsx` |
| 🔔 **Toast notifications** app-wide | `frontend/src/context/ToastContext.jsx` |

---

## 📑 Table of contents

1. [Project structure](#-project-structure)
2. [Prerequisites](#-prerequisites)
3. [Setup — Part A: Backend (step by step)](#-part-a--backend-setup)
4. [Setup — Part B: Frontend (step by step)](#-part-b--frontend-setup)
5. [Demo accounts](#-demo-accounts)
6. [API reference](#-api-reference)
7. [Deploy to AWS EC2 (full steps)](#-deploy-to-aws-ec2)
8. [Camera / QR scanner & HTTPS](#-camera--qr-scanner--https)
9. [Where to change code](#-where-to-change-code)
10. [Troubleshooting](#-troubleshooting)

---

## 📂 Project structure

```
food-main/
├── backend/
│   ├── .env.example              # copy to .env and fill in
│   ├── package.json
│   └── src/
│       ├── server.js             # Express entrypoint
│       ├── db/
│       │   ├── pool.js           # PostgreSQL connection pool
│       │   ├── schema.sql        # all tables (incl. coupons, reviews, favorites)
│       │   ├── seed.sql          # restaurants + food items + coupons
│       │   ├── migrate.js        # `npm run migrate`
│       │   └── seed.js           # `npm run seed`
│       ├── middleware/
│       │   ├── auth.js           # JWT verify / owner guard
│       │   └── error.js
│       └── routes/
│           ├── auth.js       restaurants.js  menu.js
│           ├── cart.js       orders.js       payments.js
│           ├── addresses.js  owner.js
│           ├── favorites.js  reviews.js      coupons.js       ← new
│
└── frontend/
    ├── .env.example
    ├── package.json
    ├── vite.config.js            # dev proxy /api -> :5000
    ├── tailwind.config.js
    └── src/
        ├── main.jsx  App.jsx  index.css
        ├── api/axios.js          # axios client + JWT interceptor + timeout
        ├── context/              # AuthContext, CartContext, ToastContext   ← new
        ├── components/           # Navbar, Footer, cards, guards, QrScanner, ReviewSection  ← new
        └── pages/                # every screen in the flow
            ├── Orders.jsx  Favorites.jsx                                    ← new
            └── owner/Dashboard.jsx
```

---

## ✅ Prerequisites

Install these once on your computer (or on the server you're deploying to):

- **Node.js 18+** (18, 20 or 22 all work) — [nodejs.org](https://nodejs.org)
- **PostgreSQL 14+** — [postgresql.org/download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)
- A code editor (VS Code recommended)

Check your versions:
```bash
node -v
npm -v
psql --version
```

---

## 🗄 Part A — Backend setup

Follow these in order — each step depends on the one before it.

### Step 1 — Unzip the project and open a terminal in `backend/`
```bash
cd food-main/backend
```

### Step 2 — Create the database and a database user
Open `psql` (or pgAdmin) and run:
```sql
CREATE DATABASE fooddb;
CREATE USER fooduser WITH PASSWORD 'foodpass';
GRANT ALL PRIVILEGES ON DATABASE fooddb TO fooduser;
-- On PostgreSQL 15+, also grant schema rights:
\c fooddb
GRANT ALL ON SCHEMA public TO fooduser;
```

### Step 3 — Create your `.env` file
```bash
cp .env.example .env
```
Open `.env` and check the values match what you created in Step 2 (the
defaults already match `fooddb` / `fooduser` / `foodpass`). Leave
`UPI_MERCHANT_VPA` / `UPI_MERCHANT_NAME` as-is for the demo QR payment code,
or set them to whatever you'd like the QR code to display.

### Step 4 — Install dependencies
```bash
npm install
```

### Step 5 — Create all database tables
```bash
npm run migrate
```
This runs `src/db/schema.sql`, which creates every table — including the new
`coupons`, `reviews` and `favorites` tables, and the `discount` / `coupon_code`
columns on `orders`.

### Step 6 — Seed demo data
```bash
npm run seed
```
This creates a demo customer + owner account, 6 restaurants with menus, and
3 demo coupon codes.

### Step 7 — Start the API server
```bash
npm run dev        # auto-restarts on file changes (development)
# or
npm start           # plain node (production)
```

### Step 8 — Verify it's running
Open **http://localhost:5000/api/health** in a browser. You should see:
```json
{"status":"ok","db":"connected"}
```
If you see `"db":"disconnected"`, go back to Steps 2–3 — your `.env` database
credentials don't match what Postgres has.

**Leave this terminal running** and open a new terminal for Part B.

---

## 💻 Part B — Frontend setup

### Step 1 — Open a new terminal in `frontend/`
```bash
cd food-main/frontend
```

### Step 2 — Create your `.env` file
```bash
cp .env.example .env
```
The default `VITE_API_URL=/api` is correct for local development — Vite's
dev server proxies `/api` requests to `http://localhost:5000` automatically
(configured in `vite.config.js`), so there are no CORS issues.

### Step 3 — Install dependencies
```bash
npm install
```
This installs the two new packages used by the QR payment feature:
`qrcode.react` (generates the "Scan to Pay" QR image) and `html5-qrcode`
(reads QR codes from your camera).

### Step 4 — Start the dev server
```bash
npm run dev
```

### Step 5 — Open the app
Visit **http://localhost:5173**.

### Step 6 — Log in and try the full flow
Use one of the [demo accounts](#-demo-accounts) below, add food to your cart,
try a coupon code (`WELCOME50`), check out, and pay with **UPI → Scan to
Pay** to see the new QR code feature. Track the order on the tracking page —
it will automatically progress through the delivery stages every ~20–60
seconds without you doing anything (the backend advances it).

---

## 🔑 Demo accounts

Created by `npm run seed`:

| Role     | Email              | Password    |
|----------|--------------------|-------------|
| Customer | customer@food.com  | customer123 |
| Owner    | owner@food.com     | owner123    |

- Log in as the **customer** to place an order through the full flow.
- Log in as the **owner** to see the dashboard (stats, orders, menu, settings).

**Demo coupon codes** (seeded, try these at checkout):

| Code | Discount | Minimum order |
|---|---|---|
| `WELCOME50` | ₹50 off | ₹200 |
| `SAVE10` | 10% off, up to ₹100 | ₹300 |
| `FOODIE20` | 20% off, up to ₹150 | ₹500 |

---

## 🔌 API reference

Base URL: `/api`

| Method | Endpoint                     | Auth    | Description                        |
|--------|------------------------------|---------|------------------------------------|
| POST   | /auth/register               | –       | Create account                     |
| POST   | /auth/login                  | –       | Log in, returns JWT                |
| GET    | /auth/me                     | user    | Current user                       |
| GET    | /restaurants                 | –       | List (supports `?search=`)         |
| GET    | /restaurants/:id             | –       | One restaurant                     |
| PUT    | /restaurants/:id             | owner   | Update details / offer             |
| PATCH  | /restaurants/:id/status      | owner   | Open / close toggle                |
| GET    | /menu/:restaurantId          | –       | Menu items                         |
| POST   | /menu                        | owner   | Add food item                      |
| PUT    | /menu/:id                    | owner   | Update food item                   |
| DELETE | /menu/:id                    | owner   | Delete food item                   |
| GET    | /cart                        | user    | Server-side cart (optional)        |
| POST   | /cart                        | user    | Add to cart                        |
| DELETE | /cart/:id                    | user    | Remove cart item                   |
| POST   | /orders                      | user    | Place order (accepts `coupon_code`, `discount`) |
| GET    | /orders                      | user    | My orders (owner: all orders) — live status     |
| GET    | /orders/:id                  | user    | Order detail + items — live status              |
| GET    | /orders/:id/status           | user    | **New.** Lightweight status for polling         |
| PUT    | /orders/:id/status           | owner   | Manually override order status                  |
| POST   | /payments                    | user    | Mock payment (accepts `qr_ref`)                 |
| POST   | /payments/qr                 | user    | **New.** Generate a UPI "Scan to Pay" QR payload |
| GET    | /favorites                   | user    | **New.** My favorite restaurants                |
| POST   | /favorites                   | user    | **New.** Add a favorite                         |
| DELETE | /favorites/:restaurantId     | user    | **New.** Remove a favorite                      |
| GET    | /reviews/:restaurantId       | –       | **New.** Reviews + average rating               |
| POST   | /reviews                     | user    | **New.** Post a review                          |
| GET    | /coupons                     | –       | **New.** List active coupons                    |
| POST   | /coupons/validate            | user    | **New.** Validate a code, returns the discount  |
| GET    | /owner/stats                 | owner   | Dashboard cards                    |
| GET    | /owner/restaurant             | owner   | Owner's restaurant                 |

> The frontend keeps the **cart in the browser** (React context + localStorage)
> for a smooth flow. The server-side `/cart` endpoints exist too if you prefer
> a DB-backed cart.

### How live order tracking works
`orders.status` in the database only changes when an owner manually updates
it (`PUT /orders/:id/status`). But `GET /orders/:id`, `GET /orders`, and
`GET /orders/:id/status` all return a **derived, live status** computed from
how long ago the order was placed — it auto-advances through `confirmed` →
`preparing` → `out_for_delivery` → `delivered` on a timer (20s / 40s / 60s
per stage by default — edit `STAGE_SECONDS` in `backend/src/routes/orders.js`
to change the timing). This means order tracking works correctly even if no
restaurant owner ever touches the dashboard.

---

## ☁️ Deploy to AWS EC2

This deploys **everything on one Ubuntu EC2 instance**:
PostgreSQL + Node API (PM2) + React build served by Nginx, with Nginx
reverse-proxying `/api` to the Node server.

### Step 1 — Launch the EC2 instance

1. AWS Console → **EC2 → Launch instance**.
2. Name: `fooddash`.
3. AMI: **Ubuntu Server 22.04 LTS**.
4. Instance type: **t2.micro** (free tier) or **t3.small** for smoother builds.
5. Create/choose a **key pair** (`.pem`) — you'll SSH with it.
6. **Security group** — add inbound rules:

   | Type  | Port | Source            | Why                     |
   |-------|------|-------------------|-------------------------|
   | SSH   | 22   | My IP             | SSH access              |
   | HTTP  | 80   | Anywhere (0.0.0.0/0) | Website                 |
   | HTTPS | 443  | Anywhere          | Required for the camera QR scanner — see below |

   > Do **not** open port 5432 (Postgres) or 5000 (API) to the world — Nginx
   > handles public traffic and talks to them internally.
7. Launch, then note the **Public IPv4 address** (e.g. `13.234.56.78`).

### Step 2 — Connect
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 3 — Install Node, PostgreSQL, Nginx, PM2
```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL + Nginx + git + unzip
sudo apt install -y postgresql postgresql-contrib nginx git unzip

# PM2 (keeps the API running / restarts on reboot)
sudo npm install -g pm2

node -v && npm -v && psql --version && nginx -v
```

### Step 4 — Create the database
```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE fooddb;
CREATE USER fooduser WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE fooddb TO fooduser;
\c fooddb
GRANT ALL ON SCHEMA public TO fooduser;
SQL
```

### Step 5 — Upload the project

**Option A — SCP the zip from your machine:**
```bash
# run this on your LOCAL computer, in the folder that has the zip
scp -i your-key.pem food-main.zip ubuntu@YOUR_EC2_PUBLIC_IP:~
```
Then on the server:
```bash
unzip food-main.zip -d ~/app
cd ~/app/food-main
```

**Option B — clone from Git** (if you pushed it to GitHub):
```bash
git clone https://github.com/you/food-main.git ~/app/food-main
cd ~/app/food-main
```

### Step 6 — Configure & start the backend
```bash
cd ~/app/food-main/backend
cp .env.example .env
nano .env
```
Set these values in `.env` (⚠️ **change the marked ones**):
```env
PORT=5000
NODE_ENV=production
CLIENT_ORIGIN=http://YOUR_EC2_PUBLIC_IP     # ← your EC2 public IP or domain
PGHOST=localhost
PGPORT=5432
PGUSER=fooduser
PGPASSWORD=STRONG_PASSWORD_HERE             # ← same as Step 4
PGDATABASE=fooddb
JWT_SECRET=paste_a_long_random_string_here  # ← change this!
JWT_EXPIRES_IN=7d
UPI_MERCHANT_VPA=fooddash@upi
UPI_MERCHANT_NAME=FoodDash
```
Then:
```bash
npm install --omit=dev
npm run migrate
npm run seed
pm2 start src/server.js --name fooddash-api
pm2 save
pm2 startup            # run the command it prints, to auto-start on reboot
```
Verify: `curl http://localhost:5000/api/health` → `{"status":"ok",...}`

### Step 7 — Build the frontend
```bash
cd ~/app/food-main/frontend
cp .env.example .env
nano .env
```
Set:
```env
VITE_API_URL=/api
```
(Nginx will forward `/api` to the Node server, so a relative path is correct.)
Then build:
```bash
npm install
npm run build          # outputs the static site into ./dist
```

### Step 8 — Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/fooddash
```
Paste (replace the `root` path only if your username isn't `ubuntu`):
```nginx
server {
    listen 80;
    server_name _;

    # Serve the built React app
    root /home/ubuntu/app/food-main/frontend/dist;
    index index.html;

    # React Router (client-side routing) — send unknown paths to index.html
    # so that refreshing or directly opening e.g. /order-tracking/1 works.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to the Node server
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable it and reload:
```bash
sudo ln -s /etc/nginx/sites-available/fooddash /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t          # should say "syntax is ok"
sudo systemctl restart nginx

# Let Nginx read files in your home directory
sudo chmod o+x /home/ubuntu
```

### Step 9 — Open the app 🎉
Visit **`http://YOUR_EC2_PUBLIC_IP`** in a browser. Log in with the demo
accounts and place an order all the way through to Order Tracking.

### Step 10 (strongly recommended) — Custom domain + free HTTPS
Point your domain's A-record at the EC2 IP, then:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot edits Nginx for HTTPS automatically. Afterwards update the backend
`.env` `CLIENT_ORIGIN=https://yourdomain.com` and run `pm2 restart fooddash-api`.

**This step matters more than usual in this version** — see the next section.

### Updating after a code change
```bash
cd ~/app/food-main
# git pull   (if using Git)
cd backend  && npm install --omit=dev && pm2 restart fooddash-api
cd ../frontend && npm install && npm run build
sudo systemctl reload nginx
```

---

## 📷 Camera / QR scanner & HTTPS

The new **"Use camera to scan a QR & pay instantly"** button on the Payment
page uses your device's camera (via the browser's `getUserMedia` API).

**Browsers only allow camera access on a secure origin** — that means
`https://` or `http://localhost`. On plain `http://13.234.x.x` (an EC2 IP
over HTTP, like the screenshot this app started from), the browser blocks
the camera and the app shows a friendly in-app message explaining why,
instead of crashing.

To use the camera-based scanner in production:
1. Complete **Step 10** above (custom domain + certbot HTTPS), **or**
2. Put the app behind any HTTPS-terminating proxy/CDN (CloudFront, an ALB
   with an ACM certificate, Cloudflare, etc).

The **"Generate QR code → Scan to Pay"** flow (showing a QR code for other
devices to scan) does **not** need the camera and works fine over plain HTTP.

---

## 🛠 Where to change code

A quick map of the most common things you'll want to customise.

### Branding & look
| What | File | Change |
|------|------|--------|
| App name "FoodDash" | `frontend/src/components/Navbar.jsx`, `Footer.jsx`, `frontend/index.html` | Replace the text |
| Brand color (orange) | `frontend/tailwind.config.js` → `colors.brand` | Change hex `#ff5200` |
| Global button/card styles | `frontend/src/index.css` → `@layer components` | Edit `.btn`, `.card`, `.input` |
| Home page hero / images | `frontend/src/pages/Home.jsx` | Text + Unsplash image URLs |

### Fees, tax & coupons
| What | File | Change |
|------|------|--------|
| Delivery fee & tax rate | `frontend/src/context/CartContext.jsx` | `DELIVERY_FEE`, `TAX_RATE` constants |
| Coupon codes | `backend/src/db/seed.sql` → `INSERT INTO coupons` | Add/edit codes, then `npm run migrate && npm run seed` |
| Coupon validation logic | `backend/src/routes/coupons.js` | `computeDiscount()` |

### Restaurants & menu (seed data)
| What | File | Change |
|------|------|--------|
| Starter restaurants | `backend/src/db/seed.sql` | Edit the `INSERT INTO restaurants` rows |
| Starter food items | `backend/src/db/seed.sql` | Edit `INSERT INTO food_items` |
| Re-seed after edits | run `npm run migrate && npm run seed` | ⚠️ migrate drops & recreates tables |

> After deploy you don't have to touch SQL — the **owner dashboard → Menu tab**
> lets you add/delete food, and the **Restaurant tab** edits details/offers and
> open/close status live.

### Auth / security
| What | File | Change |
|------|------|--------|
| JWT secret & expiry | `backend/.env` → `JWT_SECRET`, `JWT_EXPIRES_IN` | **Always change the secret in production** |
| Password hashing rounds | `backend/src/routes/auth.js` → `bcrypt.hash(password, 10)` | Increase `10` for stronger (slower) hashing |
| Who can access owner routes | `backend/src/middleware/auth.js` → `requireOwner` | Role logic |

### Payments (currently mocked)
The payment endpoint always succeeds. To integrate a **real** gateway
(Razorpay / Stripe / a real UPI PSP):
- Backend: `backend/src/routes/payments.js` — replace the handler body with a
  real charge/verify call, keep the `INSERT INTO payments` record. The
  `/payments/qr` handler currently just builds a `upi://pay?...` string — a
  real integration would call your PSP's order/QR-generation API instead.
- Frontend: `frontend/src/pages/Payment.jsx` — `pay()`, `generateQr()` and
  `confirmQrPaid()` are where the order is created and payment confirmed;
  swap in the gateway's checkout SDK/UI here.

### Order status & tracking
| What | File | Change |
|------|------|--------|
| Allowed statuses | `backend/src/routes/orders.js` → `VALID_STATUSES` | Add/rename stages |
| Auto-advance timing | `backend/src/routes/orders.js` → `STAGE_SECONDS` | Seconds spent in each stage |
| Tracking screen stages | `frontend/src/pages/OrderTracking.jsx` → `STAGES` | Labels, icons |
| Poll frequency | `frontend/src/pages/OrderTracking.jsx` → `setInterval(poll, 4000)` | Milliseconds between polls |

### API location
| What | File | Change |
|------|------|--------|
| Frontend → API base URL | `frontend/.env` → `VITE_API_URL` | `/api` (proxied) or a full URL |
| Request timeout | `frontend/src/api/axios.js` → `timeout: 10000` | Milliseconds before a hung request fails instead of blocking the UI forever |
| Dev proxy target | `frontend/vite.config.js` → `server.proxy` | Backend host/port for `npm run dev` |
| Allowed CORS origins | `backend/.env` → `CLIENT_ORIGIN` | Comma-separated list of frontend origins |

---

## 🧯 Troubleshooting

| Symptom | Fix |
|---------|-----|
| **"Track your order" doesn't open the next page** | This was almost always caused by `axios` having no timeout: if the backend is unreachable, the app hangs on a loading spinner forever. This build fixes it — confirm you're running the updated `frontend/src/api/axios.js` (has `timeout: 10000`), rebuild (`npm run build`) and redeploy. Also check `curl http://localhost:5000/api/health` on the server returns `{"status":"ok"}` — if it doesn't, the API isn't running or the DB is unreachable. |
| Order tracking shows a yellow "Can't reach the server" banner | The frontend can't reach `/api/orders/:id/status`. Check PM2 is running (`pm2 status`), check Nginx's `/api/` proxy block, and check the browser console/Network tab for the actual failing request URL. |
| Camera scanner shows "Camera access needs HTTPS" | Expected on plain `http://` — see [Camera / QR scanner & HTTPS](#-camera--qr-scanner--https). Use the "Generate QR code" option instead, or set up HTTPS. |
| `db: disconnected` on `/api/health` | Check `.env` Postgres values; is PostgreSQL running? `sudo systemctl status postgresql` |
| `password authentication failed` | The `PGPASSWORD` in `.env` doesn't match the user you created in Step 4 |
| Frontend loads but API calls 404 | Nginx `/api/` block missing or `sudo nginx -t` failing; reload Nginx |
| Refreshing a page like `/order-tracking/3` gives an Nginx 404 | Missing SPA fallback — make sure Nginx's `location /` block has `try_files $uri $uri/ /index.html;` (Step 8) |
| `permission denied` from Nginx to dist | `sudo chmod o+x /home/ubuntu` (Nginx must traverse your home dir) |
| Login works but refresh logs out | Normal only if you cleared localStorage; the JWT is stored there |
| Owner dashboard empty | Log in with `owner@food.com`; the seed links this owner to restaurant #1 |
| Coupon code says "Invalid or expired" | Codes are case-insensitive but must exist in `coupons` — re-run `npm run seed`, or check `is_active`/`expires_at` in the table |
| Build runs out of memory on t2.micro | Build locally and upload `dist/`, or use a bigger instance for the build |

---

Built with React, Express and PostgreSQL. Happy shipping! 🚀
