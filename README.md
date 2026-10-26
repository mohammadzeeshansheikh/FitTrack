# ⚡ FITTRACK — Gym Management System

A modern, production-grade Gym Management System built with **React (Functional Components + Hooks)**, **React Router DOM v6**, **Axios**, **JSON Server**, and **Bootstrap 5** with custom dark/light theming.

---

## 🚀 Key Features

### 1. Dual-Role Authentication & Access Control
- **Admin & Member Roles**: Distinct capabilities, access controls, and navigation.
- **Client-Side Auth against `db.json`**: Login, registration, credential validation, and auto-generated tokens.
- **Protected & Role-Guarded Routes**: Dedicated `<AdminRoute>` and `<UserRoute>` wrappers preventing unauthorized access.
- **Persistent Sessions**: User and token persisted across sessions in `localStorage`.

### 2. Light & Dark Theme Toggle
- Seamless light/dark mode switcher located in the navigation bar.
- Uses custom CSS variables synchronized with Bootstrap 5 `data-bs-theme` and `data-theme` on `<html>` and `<body>`.
- Remembers user's theme choice in `localStorage`.

### 3. Admin Management Portal (Full CRUD)
- **Interactive Dashboard**: Summary metrics (Total Members, Active Trainers, Weekly Classes, Total Processed Revenue), recent bookings, and transactions.
- **Gym Members**: Full CRUD, status toggle (Active/Inactive), plan assignment, search, sort, and pagination.
- **Trainers & Coaches**: Full CRUD, certifications, specialties, contact information, and bios.
- **Membership Plans**: Full CRUD, dynamic feature list editor, duration, pricing, and popular badge toggles.
- **Workout & Class Schedule**: Full CRUD, trainer assignment, room allocation, capacity tracking, and live booked seats calculation.
- **Invoices & Billing**: Full CRUD, payment tracking, statuses (`paid`, `pending`, `failed`), manual invoice generation, and member/plan resolution.
- **Reusable DataTable Component**: Client-side multi-column search, column sorting, configurable pagination, and responsive card view fallback for mobile.

### 4. User / Member Experience
- **Personal Dashboard**: View current subscription tier, upcoming booked workouts, quick stats, and recent receipts.
- **Profile Management**: Update personal info (name, phone, avatar) while preserving secure read-only fields.
- **Membership Plans**: Interactive plan pricing cards, current plan indicators, and one-click plan upgrade/switch with automated receipt generation.
- **Class Booking & Cancellation**: Browse weekly group classes, view real-time remaining seat capacities, book slots (Axios `POST /bookings`), and cancel existing bookings (Axios `DELETE /bookings/:id`).
- **Billing History & Receipts**: View personal payment history and open printable invoice receipts.

### 5. Responsive Design & UI/UX Polish
- Responsive Bootstrap 5 grid layout with custom styling.
- Admin sidebar with mobile off-canvas drawer.
- Floating toast alert notifications (`ToastContext`) on all CRUD actions.
- Loading spinners and inline error alerts for every Axios request.

---

## 🛠 Tech Stack

- **Frontend**: React 18+ (Functional Components & Hooks only)
- **Language**: JavaScript (ES6+)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (configured in `src/api/axiosInstance.js`)
- **Styling**: Bootstrap 5 + Bootstrap Icons + Custom CSS Variables
- **State Management**: Context API (`AuthContext`, `ThemeContext`, `ToastContext`)
- **Backend Mock**: `json-server` (running on `http://localhost:5000` via `db.json`)
- **Process Runner**: `concurrently`

---

## 🔑 Default Login Credentials

| Role | Email | Password | Pre-configured Data |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fittrack.com` | `admin123` | Full access to all CRUD management suites |
| **Member (User)** | `user@fittrack.com` | `user123` | Active Pro Fitness plan, 2 booked classes |
| **Member (User 2)** | `david.chen@example.com` | `password123` | Active Basic plan, 1 booked class |

> **Tip**: The login page includes convenient **"Admin Demo"** and **"Member Demo"** buttons to auto-fill test credentials with one click.

---

## 📦 Installation & Setup

### 1. Install Dependencies
```bash
cd fittrack
npm install
```

### 2. Run Application & Mock Server Concurrently (Recommended)
This starts `json-server` on port `5000` and the React Vite development server simultaneously:
```bash
npm run dev:all
```

### 3. Or Run Independently

**Terminal 1 — Mock JSON Server:**
```bash
npm run server
```
*Runs at `http://localhost:5000`*

**Terminal 2 — React Frontend:**
```bash
npm run dev
```
*Runs at `http://localhost:5173` (or port indicated by Vite)*

---

## 📁 Project Directory Structure

```
fittrack/
├── db.json                      # Seed database (users, trainers, plans, schedule, bookings, payments)
├── .eslintrc.json               # ESLint configuration
├── package.json                 # Scripts: dev, server, dev:all, lint, build
├── vite.config.js               # Vite config
├── index.html                   # HTML template with Google Fonts & Bootstrap
├── README.md                    # Documentation
└── src/
    ├── api/
    │   └── axiosInstance.js     # Configured Axios client with interceptors
    ├── context/
    │   ├── AuthContext.jsx      # Auth state, login, register, profile update, localStorage sync
    │   ├── ThemeContext.jsx     # Dark/Light mode state and document attributes
    │   └── ToastContext.jsx     # Floating toast notifications
    ├── hooks/
    │   ├── useAuth.js           # Auth hook
    │   ├── useTheme.js          # Theme hook
    │   └── useToast.js          # Toast hook
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx       # Responsive header with theme toggle & user dropdown
    │   │   ├── Sidebar.jsx      # Admin sidebar + mobile offcanvas drawer
    │   │   ├── ThemeToggle.jsx  # Sun/moon toggle switch
    │   │   ├── DataTable.jsx    # Searchable, sortable, paginated responsive table
    │   │   ├── Modal.jsx        # Accessible dialog modal
    │   │   ├── Spinner.jsx      # Loading spinner
    │   │   ├── AlertMessage.jsx # Error and alert banner
    │   │   ├── ToastContainer.jsx # Floating toast alerts
    │   │   └── StatCard.jsx     # Dashboard metric card
    │   └── routes/
    │       ├── ProtectedRoute.jsx # Auth gate
    │       ├── AdminRoute.jsx     # Admin gate
    │       └── UserRoute.jsx      # User gate
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.jsx        # Login page with demo autofill buttons
    │   │   └── Register.jsx     # Registration with plan & avatar selection
    │   ├── admin/
    │   │   ├── AdminLayout.jsx    # Admin layout with sidebar
    │   │   ├── AdminDashboard.jsx # KPI stats, revenue, recent activity
    │   │   ├── MembersManager.jsx # Full CRUD for gym members
    │   │   ├── TrainersManager.jsx# Full CRUD for fitness trainers
    │   │   ├── PlansManager.jsx   # Full CRUD for membership tiers
    │   │   ├── ScheduleManager.jsx# Full CRUD for class calendar & capacities
    │   │   └── PaymentsManager.jsx# Full CRUD for invoices & billing
    │   ├── user/
    │   │   ├── UserLayout.jsx   # Member layout
    │   │   ├── UserDashboard.jsx# Member dashboard & upcoming workouts
    │   │   ├── UserProfile.jsx  # Editable profile
    │   │   ├── UserPlans.jsx    # Plan pricing & upgrade workflow
    │   │   ├── UserSchedule.jsx # Class booking & cancellation
    │   │   └── UserPayments.jsx # Invoices & printable receipt modal
    │   └── NotFound.jsx         # 404 page
    ├── styles/
    │   ├── theme.css            # Dark/light theme CSS variables
    │   └── index.css            # Global layout, badges, animations
    ├── router.jsx               # Centralized React Router configuration & guards
    ├── App.jsx                  # Main application component & toaster container
    └── main.jsx                 # Entry point with context providers
```

---

## 🧪 Quality & Verification

- **Linting**: Run `npm run lint` — configured with zero errors and zero warnings.
- **Production Build**: Run `npm run build` — verified clean output with optimized chunking.
