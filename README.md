# Modern Personal Expense Tracker PWA 💰

A production-quality personal finance and expense tracking Progressive Web App (PWA) built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui style components**, **PostgreSQL**, and **Prisma ORM**.

Designed around **Salary Cycles** rather than standard calendar months, this tracker accurately reflects your real financial reality, tracks **Committed vs. Available money**, prevents duplicate recurring charges, and feels like a native mobile app.

---

## 🌟 Key Features

### 1. Dynamic Salary Cycles (Not Calendar Months)
- Your financial cycle begins on the date your salary arrives (e.g. **September 5 → October 4**).
- Automatically calculates: `Start Date + 1 Month - 1 Day` with leap-year and varying month-length precision (e.g., `Jan 31` $\rightarrow$ `Feb 27` / `Feb 28`).
- Allows manual cycle adjustments if needed.
- Warns before moving an expense across cycle boundaries when editing dates.

### 2. Committed vs. Available Balance
- **Total Income**: Base Salary + Bonus + Other Inflows.
- **Normal Spending**: Living expenses (groceries, food, transport, bills).
- **Investments / SIP**: Treated separately as asset savings rather than consumed spending.
- **Current Balance**: $\text{Income} - \text{Total Outflow}$.
- **Available Balance**: $\text{Current Balance} - \text{Upcoming Recurring Commitments}$ (*safe-to-spend funds*).
- **Pace Tracking**: Compares `% of income spent` against `% of cycle elapsed` (e.g., "Day 17 of 30, 57% of cycle elapsed").

### 3. Idempotent Recurring Expenses
- Manages monthly SIPs, internet bills, rent, and subscriptions.
- Identifies upcoming expenses for the active salary cycle and previews them before confirmation.
- Uses database compound keys `[recurringExpenseId, salaryMonthId]` to ensure no duplicate entries are generated when visiting the app.

### 4. Fast Mobile-First Quick Add & Natural Entry
- Floating Action Button (FAB) on mobile.
- Structured form with large touch-friendly inputs.
- **Smart Natural Text Entry**: parses quick inputs like `450 Food`, `180 Coffee Cash`, `Rs 2450 Groceries`, or `SIP 3000`.

### 5. iOS Safari Input Zoom Prevention
- Styled with strict `16px` font size for inputs to prevent Safari from auto-zooming the page.
- Retains user pinch-to-zoom accessibility (does not use `user-scalable=no`).

### 6. Interactive Category Budgets
- Optional monthly category budget limits.
- Visual progress bars with multi-tiered alerts:
  - **Safe**: $< 75\%$
  - **Warning**: $75\% - 89\%$
  - **Danger**: $90\% - 99\%$
  - **Exceeded**: $\ge 100\%$

### 7. Rich Analytics & Visualizations
- Spending breakdown by category (Recharts donut chart).
- Cumulative spending over time vs. linear daily budget pace.
- Category trend comparison (current cycle vs. previous cycle with $\%$ change).
- Historical cycle savings bar chart.
- Payment method breakdown (Cash, Bank, Debit, Credit, eSewa, Khalti).

### 8. Full PWA & Offline Support
- Web App Manifest (`/manifest.json`) and SVG icons.
- Service Worker (`public/sw.js`) with cache-first static asset caching and offline fallback page (`public/offline.html`).
- Standalone display mode installable on iOS and Android.

### 9. Complete Data Ownership
- One-click **JSON full backup export**.
- One-click **CSV expenses export**.
- Category and payment method customization.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma 6 (with Decimal precision for currency)
- **Styling**: Tailwind CSS, next-themes (Dark & Light mode)
- **UI Primitives**: Radix UI, Lucide Icons, Sonner Toasts
- **Charts**: Recharts
- **Date Math**: `date-fns` & `date-fns-tz`
- **Testing**: Vitest
- **Containers**: Docker & Docker Compose

---

## 🚀 Quick Start (Host Development)

### 1. Requirements
- Node.js 18+ (tested on Node v20/v24)
- npm 9+
- Docker (for local PostgreSQL container)

### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd expense-tracker-nextjs

# Install host dependencies
npm install --legacy-peer-deps
```

### 3. Start Database & Environment
Launch a local PostgreSQL container:
```bash
docker run -d --name expense-db -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=expense_tracker \
  --restart unless-stopped postgres:16-alpine
```

Configure `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_tracker?schema=public"
AUTH_SECRET="super-secret-expense-tracker-jwt-key-minimum-32-chars-long"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
DEFAULT_TIMEZONE="Asia/Kathmandu"
DEFAULT_CURRENCY="Rs."
PORT=3001
```

### 4. Push Schema & Seed Data
```bash
# Push schema to PostgreSQL
npm run db:push

# Populate realistic data (3 salary cycles, categories, expenses, recurring rules)
npm run db:seed
```

### 5. Run Automated Tests
```bash
npm run test
```
Verifies:
- Salary cycle end date math (`Jan 31` $\rightarrow$ `Feb 27` / `Feb 28`, `Sep 5` $\rightarrow$ `Oct 4`)
- Available balance and committed calculations
- Budget alert threshold logic ($75\%, 90\%, 100\%$)
- Recurring expense cycle mapping and filtering
- Natural language quick expense parsing

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🐳 Docker Deployment (Production)

To deploy the entire production stack (PostgreSQL database + optimized standalone Next.js container) with Docker Compose:

```bash
# Build and start all services in the background
docker compose up --build -d

# Verify containers are healthy
docker compose ps
```

The application will be accessible at [http://localhost:3001](http://localhost:3001).

---

## 📱 PWA Installation Instructions

### iOS (Safari)
1. Open the application in Safari.
2. Tap the **Share** button (box with an upward arrow) in the bottom navigation bar.
3. Scroll down and select **"Add to Home Screen"**.
4. Confirm by tapping **Add**. The app will launch in full-screen standalone mode without Safari browser chrome.

### Android (Chrome)
1. Open the application in Google Chrome.
2. Tap the browser options menu (three vertical dots) or wait for the automatic install banner.
3. Tap **"Add to Home screen"** or **"Install app"**.
4. The app will be installed on your device launcher.

---

## 📁 Project Structure

```text
├── prisma/
│   ├── schema.prisma              # Relational PostgreSQL database schema
│   └── seed.js                    # Realistic seed script (July, Aug, Sep cycles)
├── public/
│   ├── manifest.json              # PWA Web App Manifest
│   ├── sw.js                      # Service Worker (offline caching)
│   ├── offline.html               # Offline fallback screen
│   └── icons/                     # App SVG and maskable icons
├── src/
│   ├── actions/                   # Server Actions with Zod validation
│   │   ├── salary-actions.ts      # Salary cycle lifecycle actions
│   │   ├── expense-actions.ts     # Expense CRUD & cycle boundary checks
│   │   ├── income-actions.ts      # Multi-source income entries
│   │   ├── recurring-actions.ts   # Idempotent recurring rule confirmation
│   │   ├── budget-actions.ts      # Category budgets & threshold alerts
│   │   ├── category-actions.ts    # Categories & payment methods
│   │   └── data-actions.ts        # JSON & CSV backup exports
│   ├── app/
│   │   ├── layout.tsx             # Root layout with PWA, Theme & Viewport
│   │   ├── globals.css            # Global CSS + iOS 16px zoom prevention
│   │   ├── page.tsx               # Dashboard (progress, available balance, insights)
│   │   ├── expenses/              # Expenses feed (mobile cards, desktop table)
│   │   ├── incomes/               # Income sources & bonus tracking
│   │   ├── recurring/             # Recurring rules & commitments
│   │   ├── budgets/               # Category budgets & alerts
│   │   ├── analytics/             # Charts, trends & historical savings
│   │   ├── salary-months/         # Salary cycles timeline & reports
│   │   └── settings/              # Preferences, dark mode & backup export
│   ├── components/                # Modular UI components
│   │   ├── ui/                    # Base primitives (Card, Button, Dialog, Progress)
│   │   ├── navigation/            # BottomNav, Sidebar, Header, MoreMenu
│   │   ├── dashboard/             # Overview, Progress card, Commitments
│   │   ├── expenses/              # Date grouped list, Edit modal with warning
│   │   ├── recurring/             # Recurring rules list & modal
│   │   ├── budgets/               # Budget list & status bars
│   │   ├── analytics/             # Recharts donut, area, bar charts
│   │   └── quick-add-modal.tsx    # Fast mobile modal with smart text entry
│   └── lib/
│       ├── salary-cycle.ts        # Salary cycle calculation & balance engine
│       ├── recurring.ts           # Cycle mapping for recurring rules
│       ├── quick-parser.ts        # Natural language expense parsing
│       ├── insights.ts            # Rule-based financial insights engine
│       ├── currency.ts            # Nepalese Rupees (Rs.) formatting
│       ├── auth.ts                # Session management & JWT
│       └── prisma.ts              # Prisma singleton client
├── tests/                         # Vitest automated test suite
│   ├── salary-cycle.test.ts       # Leap year, end-of-month, balance tests
│   ├── recurring.test.ts          # Idempotent cycle mapping tests
│   └── quick-parser.test.ts       # Text parsing tests
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Orchestration for PostgreSQL + Web
└── package.json
```

---

## 🚀 Production Deployment (Supabase & Vercel)

### 1. Database Setup on Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Under **Project Settings** → **Database**:
   - Locate **Connection string** and select **URI**.
   - Note the **Transaction pooler** (Port 6543) and **Direct connection** (Port 5432).
3. Set your environment variables:
   - `DATABASE_URL`: Transaction pooler URI (with `?pgbouncer=true` if using pgbouncer mode).
   - `DIRECT_URL`: Direct connection URI (port 5432).
4. Run migrations/push schema to Supabase:
   ```bash
   DATABASE_URL="<your-pooler-url>" DIRECT_URL="<your-direct-url>" npx prisma db push
   ```
5. Seed initial data and bootstrap default admin:
   ```bash
   DATABASE_URL="<your-direct-url>" node prisma/seed.js
   ```

### 2. Frontend Deployment on Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure Environment Variables in Vercel Project Settings:
   - `DATABASE_URL`: Your Supabase transaction pooler URI.
   - `DIRECT_URL`: Your Supabase direct connection URI.
   - `AUTH_SECRET`: A secure random 32+ character key (`openssl rand -base64 32`).
   - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment domain (e.g. `https://your-app.vercel.app`).
   - `DEFAULT_TIMEZONE`: `Asia/Kathmandu` (or your timezone).
   - `DEFAULT_CURRENCY`: `Rs.` (or `$`).
3. Deploy! Vercel automatically runs `npm run postinstall` (`prisma generate`) and `npm run build`.

---

## 🧪 Verification & Testing

To run the complete automated test suite:
```bash
npm run test
```

To run a production build verification:
```bash
npm run build
```

---

## 🔒 Security & Privacy

- Financial computations utilize Prisma `Decimal(12, 2)` to eliminate floating-point rounding inaccuracies.
- Passwords hashed using `bcryptjs`.
- Role-Based Access Control (RBAC): Only Administrators can access `/users` and perform user CRUD.
- HTTP-only cookie-based sessions with tamper-proof JWT signing (`jose`).
- Data isolation: All data strictly partitioned by `userId`.

