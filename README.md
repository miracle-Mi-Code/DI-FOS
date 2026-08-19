# Digital File Opening System (DFOS)

The **Digital File Opening System (DFOS)** is a full-stack self-service web platform that replaces manual, in-person academic department file opening. Students register, upload required credentials (O'Level, Admission Letter, Birth Certificate, Medical Fitness, etc.), and receive an auto-generated **Acknowledgement Letter (PDF)**. Department staff review, comment on, and approve/reject submissions with real-time **Termii SMS** and **Nodemailer Email** status alerts.

---

## 🌟 Tech Stack

- **Frontend**: React (Vite), React Router v6, Tailwind CSS, Lucide Icons, Axios
- **Backend**: Node.js, Express.js (REST API), Multer, Zod Validation
- **Database & ORM**: PostgreSQL, Prisma ORM
- **PDF Generation**: `pdf-lib` (Auto-generated official acknowledgement letter)
- **SMS & Email**: Termii API (SMS OTP & Status Notifications), Nodemailer (Email Alerts)

---

## 📁 Repository Structure

```
DI-FOS/
├── server/                 # Node.js + Express Backend API
│   ├── prisma/             # Prisma Schema & Database Seed Script
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/         # Prisma DB Client config
│   │   ├── controllers/    # Auth, Documents, Submissions, Admin & Reports
│   │   ├── middlewares/    # JWT Auth, Multer Upload, Error Handler
│   │   ├── routes/         # REST API Routes
│   │   ├── services/       # Termii SMS, Mailer & PDF Generation
│   │   └── index.js        # Express Server Entrypoint
│   ├── uploads/            # Disk storage for documents & generated PDFs
│   ├── .env.example
│   └── package.json
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # Navbar, StatusBadge, Toast, DocumentViewerModal
│   │   ├── context/        # AuthContext (JWT & Role state)
│   │   ├── pages/          # Login, Register, Student Portal, Admin Portal
│   │   ├── services/       # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## ⚙️ Setup & Local Installation

### 1. Database Configuration (PostgreSQL)

Ensure PostgreSQL is running locally or provide a valid connection URI in `.env`.

If you are using Neon, use the direct host endpoint rather than the pooled `-pooler` hostname, or Prisma will fail to connect.

Create PostgreSQL database `dfos_db`:
```sql
CREATE DATABASE dfos_db;
```

### 2. Backend Setup (`/server`)

1. Navigate to server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Configure Environment Variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL database URL, JWT secret, and Termii API key:
   ```env
   PORT=5000
   # Local Postgres example
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dfos_db?schema=public"

   # Neon example (direct host, not pooler)
   # DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-dark-frog-ax8r9shp.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="dfos_jwt_super_secret_key_2026_change_in_production"
   TERMII_API_KEY="mock_termii_api_key" # Replace with your live Termii Key
   TERMII_SENDER_ID="DFOS"
   ```

3. Run Database Migrations & Prisma Client Generation:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. Seed Sample Database Records:
   ```bash
   npm run prisma:seed
   ```

5. Start Backend Server:
   ```bash
   npm run dev
   ```
   *The server runs at `http://localhost:5000`.*

---

### 3. Frontend Setup (`/client`)

1. Open a new terminal, navigate to `/client` and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Configure Environment Variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_API_BASE_URL="http://localhost:5000/api"
   ```

3. Start Frontend Development Server:
   ```bash
   npm run dev
   ```
   *The client runs at `http://localhost:5173`.*

---

## 🔑 Pre-seeded Login Credentials

The seed script (`prisma/seed.js`) automatically populates test user accounts:

| User Role | Email / Identifier | Password | Access / Notes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@dfos.edu` | `Admin@123456` | Full platform management & reporting |
| **CS Staff** | `staff.cs@dfos.edu` | `Staff@123456` | Review Computer Science submissions |
| **EEE Staff** | `staff.eee@dfos.edu` | `Staff@123456` | Review Electrical Engineering submissions |
| **Sample Student**| `student.cs@dfos.edu` / `CSC/2026/001` | `Student@123456` | Student upload portal & PDF receipt |

---

## 🚀 Key Features Walkthrough

### 👨‍🎓 Student Portal
1. **Registration + Termii OTP**: Register with Matric No, Department, and Phone. Enter 6-digit Termii SMS OTP (or console mock OTP code in dev mode).
2. **Document Upload Checklist**: Upload required credentials (PDF/JPG, max 5MB). Track mandatory vs optional slots.
3. **Finalize Submission & Acknowledgement Letter**: Auto-generates reference code (e.g. `DFOS-2026-A8F92`) and official PDF receipt via `pdf-lib`.
4. **Rejection Feedback**: View staff comments per document and re-upload replacement files.

### 👨‍💼 Staff / Admin Portal
1. **Queue Dashboard**: Filter submissions by status (`PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`), department, or date range. Search by reference code or matric number.
2. **Review Workspace**: View student details, preview documents in modal, approve/reject individual files with comments.
3. **Status Updates & Termii Notifications**: Update overall status; triggers SMS & Email alerts directly to the student's phone.
4. **CSV Export**: Export submission records as CSV.

---

## 📄 License
MIT License. Developed for Academic Department Digital File Management.
