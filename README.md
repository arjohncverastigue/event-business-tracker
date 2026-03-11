# Event Business Tracker — Day 2 Core Features

This monorepo hosts the Next.js frontend (`frontend/`) and FastAPI backend (`backend/`) for the Event Business Tracker roadmap.

## Quick Start

### Backend (FastAPI)
1. `cd backend`
2. Create a virtual environment and activate it.
3. `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and update the values (at minimum `SECRET_KEY`).
5. `uvicorn app.main:app --reload`

The API is available at `http://localhost:8000` with the following endpoints shipped through Day 3:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /bookings`
- `POST /bookings`
- `PUT /bookings/{id}`
- `DELETE /bookings/{id}`
- `GET /finances`
- `POST /finances`
- `DELETE /finances/{id}`
- `GET /quotations`
- `POST /quotations`
- `PUT /quotations/{id}`
- `DELETE /quotations/{id}`
- `POST /quotations/generate-ai`
- `POST /quotations/{id}/send-email`
- `GET /exports/pdf/quotations/{id}`
- `GET /exports/pdf/finances`
- `GET /exports/excel/finances`
- `GET /health`

### Frontend (Next.js)
1. `cd frontend`
2. `cp .env.local.example .env.local`
3. `npm install`
4. `npm run dev`

The application runs at `http://localhost:3000`. Use the Register/Login pages to create a user through the FastAPI backend, then explore:

- `/bookings` for pipeline management (create + delete)
- `/finances` for income/expense tracking
- `/quotations` for CRUD + AI-assisted proposals with preview
- `/quotations` also offers PDF download + email sending controls
- `/dashboard` for authenticated overview and shortcuts

## Day 1 Deliverables
- ✅ Next.js 14 App Router project with Tailwind CSS styling and bespoke auth layouts.
- ✅ FastAPI project with SQLite + SQLAlchemy models for users, bookings, finances, and quotations.
- ✅ JWT authentication (register/login/me) powered by `python-jose` + `passlib`.
- ✅ React Query provider, Axios client with token interception, and fully designed login/register pages.

## Day 2 Deliverables
- ✅ FastAPI bookings + finances routers with CRUD operations, scoped per user.
- ✅ Shared Pydantic schemas for bookings/finances plus SQLAlchemy wiring.
- ✅ Bookings UI for creating engagements, calculating totals, and deleting entries.
- ✅ Finances UI for logging income/expenses with live profit insights.
- ✅ React Query data fetching & mutations fully connected to the Axios client and JWT storage.

## Day 3 Deliverables
- ✅ SQLAlchemy JSON-backed quotation items with full CRUD routes.
- ✅ Claude-powered quotation suggestion endpoint with graceful fallback behavior.
- ✅ Quotations App Router page featuring AI brief assistant, editable line items, and live preview totals.
- ✅ Updated dashboard & landing messaging to surface the new workflow.

## Day 4 Deliverables
- ✅ ReportLab PDF exports for single quotations and full finance reports.
- ✅ openpyxl Excel export for finance ledgers.
- ✅ FastAPI-Mail integration with `/quotations/{id}/send-email` for emailing attached PDFs.
- ✅ Frontend controls for downloading finances (PDF/Excel) and emailing/downloading quotations.

## Day 5 Deliverables
- ✅ Recharts-powered dashboard with bookings trend, finance comparison, and quotation status pie.
- ✅ Theme toggle with radial light/dark palettes and persistent preference.
- ✅ Frontend polish/cleanup plus linted codebase ready for testing.
