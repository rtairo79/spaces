# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Next.js library room booking system with check-in tracking, analytics, and smart scheduling features.

**Production URL**: https://spaces.novatics.us
**Related Project**: Library-landing (marketing site) - separate deployment

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npx prisma migrate dev   # Run database migrations
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open database GUI
```

## Architecture

### Tech Stack
- Next.js 16 with App Router
- React 19 with React Compiler
- TypeScript (strict mode)
- Prisma 6.18 with PostgreSQL
- NextAuth for authentication
- Tailwind CSS + Framer Motion
- Nodemailer for emails

### Directory Structure
```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── analytics/    # Usage analytics endpoints
│   │   ├── calendar/     # Calendar data endpoint
│   │   ├── checkin/      # Check-in endpoints
│   │   ├── cron/         # Scheduled job endpoints
│   │   ├── predictions/  # Demand forecasting
│   │   ├── reservations/ # Booking CRUD + validation
│   │   ├── suggestions/  # Smart scheduling
│   │   └── walkins/      # Walk-in booking
│   ├── admin/analytics/  # Analytics dashboard
│   ├── available-now/    # Walk-in booking page
│   ├── calendar/         # Calendar view page
│   ├── kiosk/            # Self-service check-in
│   └── predictions/      # Demand forecast page
├── components/
│   ├── analytics/        # Charts and stats
│   ├── booking/          # Conflict alerts
│   ├── calendar/         # Week/month views
│   ├── checkin/          # Check-in UI
│   ├── notifications/    # Banners and alerts
│   ├── predictions/      # Forecast visualization
│   ├── suggestions/      # Smart slot suggestions
│   └── walkin/           # Walk-in components
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── email.ts          # Email templates
│   ├── no-show-processor.ts
│   ├── prediction-engine.ts
│   ├── prisma.ts
│   ├── rate-limit.ts
│   ├── reminder-sender.ts
│   └── suggestion-engine.ts
└── types/
    └── index.ts          # TypeScript interfaces
```

### Key Models (Prisma)
- **User** - ADMIN, STAFF, PATRON roles
- **Location** - Library branches
- **Room** - Bookable spaces with time slots
- **Reservation** - Bookings with check-in status
- **ReminderLog** - Tracks sent reminders
- **UsageAnalytics** - Aggregated metrics
- **BookingRule** - Per-room configuration

### Cron Jobs (vercel.json)
| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| */5 * * * * | /api/cron/no-show | Auto-release no-shows |
| */15 * * * * | /api/cron/reminders | Send 24h/1h reminders |
| 0 2 * * * | /api/cron/aggregate-analytics | Daily metrics |
| 0 3 * * 0 | /api/cron/update-predictions | Weekly forecast |

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000  # Production: https://spaces.novatics.us
EMAIL_SERVER_HOST=...
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=...
EMAIL_SERVER_PASSWORD=...
EMAIL_FROM=...
CRON_SECRET=...  # For Vercel cron auth
```

## Deployment

**Domain**: spaces.novatics.us (CNAME to Vercel)

### Vercel Setup
1. Import repository to Vercel
2. Set environment variables in Vercel dashboard
3. Add custom domain: spaces.novatics.us
4. Enable cron jobs (requires Pro plan)

### DNS Configuration
Add CNAME record:
```
spaces.novatics.us → cname.vercel-dns.com
```

---

## Features Implemented (January 2026)

### 1. Enhanced Conflict Detection
- **API**: `POST /api/reservations/validate` - Pre-submit validation
- **Component**: `ConflictAlert.tsx` - Shows conflicts with alternative slots
- Validates booking rules (max duration, advance days)
- Returns scored alternative time suggestions

### 2. Calendar View
- **Page**: `/calendar` - Week and month views
- **API**: `GET /api/calendar` - Fetch reservations by date range
- Color-coded slots (available/booked/yours)
- Click-to-book functionality
- Room and location filtering

### 3. Check-in System
- **API**: `POST /api/checkin` - Perform check-in
- **API**: `GET /api/checkin/[reservationId]` - Check-in status
- **Components**: `CheckInButton.tsx`, `StaffCheckInPanel.tsx`
- **Page**: `/kiosk` - Self-service kiosk mode
- 15-min early check-in window
- Staff override for late arrivals

### 4. No-Show Detection & Auto-Release
- **Cron**: `/api/cron/no-show` - Runs every 5 minutes
- **Lib**: `no-show-processor.ts` - Business logic
- **Component**: `RoomReleasedBanner.tsx` - Notification
- Marks as AUTO_RELEASED after grace period
- Sends email notification to patron

### 5. Automated Reminders
- **Cron**: `/api/cron/reminders` - Runs every 15 minutes
- **Lib**: `reminder-sender.ts` - Email logic
- Sends 24h and 1h reminders
- Tracks in ReminderLog to avoid duplicates

### 6. Usage Analytics Dashboard
- **Page**: `/admin/analytics` - Full dashboard
- **APIs**: `/api/analytics/summary`, `/hourly`, `/trends`
- **Cron**: `/api/cron/aggregate-analytics` - Daily aggregation
- **Components**: `StatsCards`, `UtilizationChart`, `HeatmapGrid`
- Metrics: reservations, check-in rate, no-show rate, utilization

### 7. Smart Scheduling Suggestions
- **APIs**: `/api/suggestions/times`, `/api/suggestions/rooms`
- **Lib**: `suggestion-engine.ts` - Scoring algorithm
- **Component**: `SuggestedSlots.tsx`
- Considers historical utilization and preferences

### 8. Walk-in Tracking
- **Page**: `/available-now` - Public availability
- **APIs**: `/api/walkins/available`, `/api/walkins/create`
- **Components**: `AvailableNowList`, `QuickBookForm`
- Shows released slots for immediate booking
- Simplified form, auto check-in

### 9. Weekly Usage Predictions
- **Page**: `/predictions` - Forecast visualization
- **API**: `/api/predictions/weekly`
- **Cron**: `/api/cron/update-predictions` - Weekly update
- **Lib**: `prediction-engine.ts` - Weighted moving average
- **Component**: `WeeklyForecast.tsx` - Heatmap display

---

## What Remains To Do

### Database Migration
```bash
# Set DATABASE_URL in .env first
npx prisma migrate dev --name add_booking_features
```

### Integration Tasks
1. **Update patron dashboard** (`components/patron/dashboard.tsx`)
   - Add link to calendar view
   - Show upcoming reservations with check-in buttons
   - Display suggested slots panel

2. **Update admin dashboard** (`components/admin/dashboard.tsx`)
   - Add Analytics tab linking to `/admin/analytics`
   - Add Staff Check-in panel for today's reservations
   - Show no-show management controls

3. **Add navigation links**
   - Header: Calendar, Available Now, Predictions
   - Admin nav: Analytics

4. **Email template configuration**
   - Add reminder templates to seed data
   - Configure SMTP in production

### Testing Checklist
- [ ] Create overlapping reservation → verify conflict rejection
- [ ] Navigate calendar weeks → verify availability colors
- [ ] Book room, check in via button → verify status update
- [ ] Let reservation pass grace period → verify auto-release
- [ ] Create future booking → verify reminder emails
- [ ] Generate bookings → run aggregation → verify dashboard
- [ ] Release a room → verify appears in available-now
- [ ] Request busy time → verify alternatives offered
- [ ] After 2+ weeks data → verify forecast accuracy

### Production Considerations
1. Set `CRON_SECRET` and validate in cron endpoints
2. Configure Vercel cron jobs (Pro plan required)
3. Set up email provider (SendGrid, AWS SES, etc.)
4. Add error monitoring (Sentry)
5. Consider rate limiting on public endpoints

### Optional Enhancements
- QR code generation for kiosk check-in
- SMS reminders via Twilio
- Slack/Teams notifications for staff
- Export analytics to CSV
- Room equipment availability tracking
- Waitlist for fully booked slots
