# ⚡ WhopLevel — Gamification Engine for Whop

A complete gamification app for Whop communities: XP points, daily streaks,
leaderboards, achievement badges, and a rewards shop.

Built with Next.js, Prisma (SQLite/PostgreSQL), and the Whop SDK.

---

## 🚀 Quick Start (5 steps)

### Step 1: Clone and Install

```bash
git clone <your-repo-url> whoplevel
cd whoplevel
pnpm install        # or: npm install
```

### Step 2: Set Up Whop App

1. Go to https://whop.com/dashboard
2. Navigate to your organization → **API Keys** section
3. Click **"Create a new app"**
4. Note down these values:
   - **API Key** → `WHOP_API_KEY`
   - **App ID** → `WHOP_APP_ID`
   - **Agent User ID** → `WHOP_AGENT_USER_ID`
5. Set these in the app settings:
   - **Base Domain**: `https://your-app.vercel.app` (or `http://localhost:3000` for dev)
   - **App Path**: `/experience/[experienceId]`
   - **Dashboard Path**: `/dashboard/[companyId]`

### Step 3: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your real values from Step 2.

### Step 4: Set Up Database

```bash
npx prisma generate    # Generate the Prisma client
npx prisma db push     # Create database tables
```

### Step 5: Run Locally

```bash
# Option A: With Whop proxy (recommended — handles iframe auth)
pnpm whop-proxy

# Option B: Standard Next.js dev server
pnpm dev
```

Visit http://localhost:3000

To test inside Whop:
1. Go to a whop you own
2. Add your app from the tools section
3. Click the settings icon (top right) → Select "localhost"

---

## 📁 Project Structure

```
whoplevel/
├── app/
│   ├── page.tsx                         # Landing page (outside Whop)
│   ├── layout.tsx                       # Root layout
│   ├── globals.css                      # Global styles
│   ├── experience/[experienceId]/
│   │   └── page.tsx                     # MEMBER VIEW (inside Whop iframe)
│   ├── dashboard/[companyId]/
│   │   └── page.tsx                     # ADMIN VIEW (Whop owner settings)
│   └── api/
│       ├── xp/route.ts                  # Add/get XP
│       ├── leaderboard/route.ts         # Leaderboard data
│       ├── badges/route.ts              # Badge system
│       ├── rewards/route.ts             # Rewards shop
│       ├── admin/route.ts               # Admin settings
│       └── webhook/route.ts             # Whop event listener
├── components/
│   ├── GamificationApp.tsx              # Main member UI
│   └── AdminDashboard.tsx               # Admin panel UI
├── lib/
│   ├── whop-api.ts                      # Whop SDK setup & auth
│   ├── db.ts                            # Prisma client singleton
│   └── gamification.ts                  # Core game engine logic
├── prisma/
│   └── schema.prisma                    # Database schema
├── types/
│   └── index.ts                         # Shared TypeScript types
└── .env.example                         # Environment template
```

---

## 🏗️ How It Works

### Authentication Flow
1. Member opens the app inside a Whop community
2. Whop sends a signed token in the iframe headers
3. `lib/whop-api.ts` verifies the token using `@whop/api`
4. App loads the member's data from the database
5. If new member → creates a record and seeds default badges

### XP System
- Each action type (post, lesson, login, referral, quiz, feedback) has configurable XP
- Admin sets the values via the dashboard
- XP is tracked per-member per-community
- Webhooks automatically award XP when members do things in Whop

### Webhook Integration
The `/api/webhook` endpoint listens for Whop events:
- `membership.created` → Welcome XP
- `lesson.completed` → Lesson XP
- `chat.message.created` → Post XP
- `quiz.completed` → Quiz XP
- `payment.completed` (with affiliate) → Referral XP

To enable webhooks:
1. Go to your app settings on Whop dashboard
2. Set webhook URL to: `https://your-app.vercel.app/api/webhook`
3. Copy the webhook secret into your `.env.local`

---

## 🚢 Deploy to Production

### Deploy on Vercel (Free)

1. Push your code to GitHub
2. Go to https://vercel.com → "New Project"
3. Import your GitHub repo
4. Add environment variables:
   - `WHOP_API_KEY`
   - `WHOP_APP_ID`
   - `WHOP_AGENT_USER_ID`
   - `WHOP_WEBHOOK_SECRET`
   - `DATABASE_URL` (use Vercel Postgres or Supabase)
5. Deploy!

### Database for Production

SQLite works for development but NOT for production on Vercel.
Use one of these free PostgreSQL options:

**Vercel Postgres** (easiest with Vercel):
1. In Vercel dashboard → Storage → Create Database
2. It auto-sets DATABASE_URL

**Supabase** (generous free tier):
1. Create project at https://supabase.com
2. Copy the connection string
3. Update `DATABASE_URL` in Vercel env vars
4. Change `provider = "sqlite"` to `provider = "postgresql"` in schema.prisma

After switching to PostgreSQL:
```bash
npx prisma generate
npx prisma db push
```

### Update Whop App Settings

After deploying, update your Whop app:
- **Base Domain**: `https://your-app.vercel.app`
- **Webhook URL**: `https://your-app.vercel.app/api/webhook`

---

## 💰 Monetization

### Three Ways to Charge

1. **Installation Fee**: Charge $500-2000 one-time
   - Set this in Whop App Store listing

2. **Monthly Subscription**: $15-25/month per community
   - Best for recurring revenue
   - Use Whop's built-in subscription billing

3. **Revenue Share**: Take 10-30% of what creators charge
   - Use Whop SDK to track revenue through your app

### Pricing Recommendation (Start Here)

- **Free Tier**: Leaderboard + basic streaks (drives installs)
- **Pro Tier ($19/month)**: Full badges, rewards shop, admin dashboard
- **Enterprise ($49/month)**: Custom badges, API access, priority support

---

## 🔧 Customization

### Add New Action Types

In `lib/gamification.ts`, the XP system is action-based.
To add a new action:

1. Add a field in `prisma/schema.prisma` → `AppSettings`
2. Add the mapping in `app/api/xp/route.ts` → `xpMap`
3. Add the webhook handler in `app/api/webhook/route.ts`
4. Add the admin control in `components/AdminDashboard.tsx`

### Add New Badge Types

In `lib/gamification.ts` → `checkBadgeUnlocks()`:
Add a new case to the switch statement with your criteria logic.

### Change Rank Thresholds

In `lib/gamification.ts` → `RANKS` array:
Modify the `minXP` values to change when members rank up.

---

## 📋 Development Checklist

- [x] Member authentication via Whop SDK
- [x] XP tracking per action per community
- [x] Daily streak system with auto-reset
- [x] Leaderboard (weekly/monthly/all-time)
- [x] Achievement badges with auto-unlock
- [x] Rewards shop with XP spending
- [x] Admin dashboard for configuration
- [x] Webhook integration for auto-XP
- [x] Database schema with Prisma
- [x] Full API routes
- [x] Dark theme UI matching Whop aesthetic

### Future Ideas (V2)
- [ ] Weekly competitions with custom prizes
- [ ] Team challenges (group XP goals)
- [ ] Custom badge creator for admins
- [ ] Activity analytics charts
- [ ] Discord notifications for badge unlocks
- [ ] Referral tracking integration
- [ ] CSV export for admin data

---

## 🆘 Troubleshooting

**App not loading in Whop iframe?**
- Make sure "App Path" is set to `/experience/[experienceId]` in Whop dashboard
- Make sure "Base Domain" matches your deployment URL exactly

**Authentication errors?**
- Double-check WHOP_API_KEY and WHOP_APP_ID in .env.local
- Make sure you're accessing the app from within a Whop community

**Database errors?**
- Run `npx prisma generate` then `npx prisma db push`
- For production: make sure DATABASE_URL points to PostgreSQL, not SQLite

**Webhooks not working?**
- Verify webhook URL in Whop app settings
- Check WHOP_WEBHOOK_SECRET matches
- Check Vercel function logs for errors

---

Built with ❤️ for Whop creators. Let's make communities more engaging.
