## 🗂️ Project Structure

```
event-business-tracker/
├── frontend/                  # Next.js App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── bookings/page.tsx
│   │   ├── finances/page.tsx
│   │   ├── quotations/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── Sidebar.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── charts/
│   ├── lib/
│   │   ├── api.ts            # Axios API calls
│   │   └── auth.ts           # Auth helpers
│   └── .env.local
│
├── backend/                   # FastAPI App
│   ├── app/
│   │   ├── main.py           # Entry point
│   │   ├── database.py       # SQLite connection
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── booking.py
│   │   │   ├── finance.py
│   │   │   └── quotation.py
│   │   ├── routers/          # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── bookings.py
│   │   │   ├── finances.py
│   │   │   ├── quotations.py
│   │   │   └── exports.py
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/
│   │   │   ├── ai_service.py      # Google Gemini API
│   │   │   ├── email_service.py   # SMTP email
│   │   │   ├── pdf_service.py     # PDF generation
│   │   │   └── excel_service.py   # Excel export
│   │   └── utils/
│   │       └── auth.py       # JWT helpers
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## ⚙️ Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | FastAPI + Uvicorn |
| Database | SQLite + SQLAlchemy |
| Auth | JWT (python-jose) + bcrypt |
| AI | Google Gemini API |
| PDF | WeasyPrint or ReportLab |
| Excel | openpyxl |
| Email | FastAPI-Mail (SMTP) |
| Charts | Recharts |

---

## 🚀 Setup Commands

**Frontend:**
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install axios @tanstack/react-query recharts lucide-react
npx shadcn-ui@latest init
```

**Backend:**
```bash
mkdir backend && cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy python-jose[cryptography] passlib[bcrypt] google-generativeai reportlab openpyxl fastapi-mail python-multipart python-dotenv
```

---

## 🗄️ Database Schema

```
users         → id, name, email, password_hash, created_at
bookings      → id, user_id, client, event_type, date, venue, amount, status
finances      → id, user_id, type, description, category, amount, date
quotations    → id, user_id, client, event_type, date, status, items (JSON)
```

---

## 📡 API Endpoints

```
AUTH
POST   /auth/register
POST   /auth/login
GET    /auth/me

BOOKINGS
GET    /bookings
POST   /bookings
PUT    /bookings/{id}
DELETE /bookings/{id}

FINANCES
GET    /finances
POST   /finances
DELETE /finances/{id}

QUOTATIONS
GET    /quotations
POST   /quotations
PUT    /quotations/{id}
DELETE /quotations/{id}
POST   /quotations/generate-ai     ← Google Gemini AI
POST   /quotations/{id}/send-email ← Email

EXPORTS
GET    /exports/pdf/{type}
GET    /exports/excel/{type}

DASHBOARD
GET    /dashboard/summary
```

---

## 📅 5-Day Build Plan

**Day 1 — Foundation**
- Set up both projects (Next.js + FastAPI)
- Configure SQLite + SQLAlchemy models
- Build JWT authentication (register, login)
- Build login/register pages in Next.js

**Day 2 — Core Features**
- Build Bookings API + frontend page
- Build Finances API + frontend page
- Connect frontend to backend with Axios

**Day 3 — Quotations + AI**
- Build Quotations CRUD API + frontend
- Integrate Google Gemini API for AI-generated quotations
- Build quotation preview UI

**Day 4 — Exports + Email**
- PDF export using ReportLab (quotations + finance report)
- Excel export using openpyxl
- Email sending via FastAPI-Mail

**Day 5 — Polish**
- Dashboard with charts (Recharts)
- Dark/Light mode toggle (Tailwind)
- Testing, bug fixes, and final cleanup

---

## ✅ Progress Log

- **Day 1 completed**: Auth foundation, shared models, onboarding UI.
- **Day 2 completed**: Bookings + finances APIs, React Query pages, Axios wiring to FastAPI.
- **Day 3 completed**: Quotations CRUD, Gemini-powered drafting endpoint, proposal UI/preview.
- **Day 4 completed**: PDF/Excel exports plus FastAPI-Mail email sending and UI hooks.
- **Day 5 completed**: Dashboard charts, theme toggle, and final refinement.

---

## 🔑 Environment Variables

**backend/.env**
```env
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=models/gemini-1.5-flash-latest
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_email_password
MAIL_SERVER=smtp.gmail.com
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=https://localhost:8000
```

### Gemini key rotation checklist
1. Issue a new API key inside Google AI Studio and copy it locally.
2. Update `backend/.env` (or your deployment secret store) with `GEMINI_API_KEY=<new value>` and restart the FastAPI process.
3. After confirming `/quotations/generate-ai` works, revoke the previous key in AI Studio to prevent stale credentials from being used.
