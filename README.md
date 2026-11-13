# ROUTENEX

**Every Student. Every Route. Every Destination.**

ROUTENEX is a connected rural mobility platform for students, local transport providers, and administrators. Bus routes, shared student rides, community EV providers, and network administration live in one place and read from the same transport records.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + Vite)               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Landing   │ │   Student   │ │  Provider   │ │   Admin   │ │
│  │    Page     │ │   Portal    │ │   Portal    │ │  Portal   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API + JWT
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express + MongoDB)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Auth    │ │ Student  │ │ Provider │ │  Admin   │           │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Journey Planner  •  Pooling  •  Payments         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MONGODB DATABASE                         │
│  Users • Profiles • Villages • Stops • Routes • Schedules      │
│  Vehicles • TravelRequests • RideRequests • PoolingGroups      │
│  Payments • Notifications • AuditLogs • SavedJourneys          │
└─────────────────────────────────────────────────────────────────┘
```

## What the Product Does

| Area | What you can do |
| --- | --- |
| **Public Site** | Read about the network, explore five features and map preview, contact the team, sign in or register |
| **Student Workspace** | Dashboard, smart journey planner, student pooling, community EV rides, saved journeys, travel assistant |
| **Provider Workspace** | Manage availability, register vehicles, accept/decline student ride requests, view earnings |
| **Admin Workspace** | Overview dashboard, transport management (buses, stops, routes, schedules), students, providers, vehicles, ride requests, financials, audit logs |

Every EV ride is confirmed only after the provider accepts it, and administrator changes appear in student search results immediately because all screens share one MongoDB database.

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@routenex.com` | `routenex755` |
| **Student** | Register new account | Any 6+ characters |
| **Provider** | Register new account | Any 6+ characters |

> **Note**: Admin accounts cannot be self-registered. Only one admin exists (seeded on first run).

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19 + Vite 8 |
| **Language** | JavaScript (ES Modules) |
| **Styling** | Tailwind CSS v4 |
| **Routing** | React Router 7 |
| **Charts** | Recharts |
| **Maps** | Leaflet + OpenStreetMap (planned) |
| **Icons** | lucide-react |
| **State** | React Context + localStorage (frontend) / MongoDB (backend) |
| **Backend** | Express.js + MongoDB (Mongoose) |
| **Auth** | JWT (Access + Refresh tokens) + bcrypt |
| **Payments** | Razorpay (test mode) |
| **Validation** | express-validator |
| **Rate Limiting** | express-rate-limit |

## Project Structure

```
ROUTENEX/
├── src/                          # Frontend (React + Vite)
│   ├── components/
│   │   ├── common/               # Button, Badge, Card, Modal, etc.
│   │   ├── landing/              # NetworkMapPreview, LiveConditions
│   │   └── layout/               # AppLayout, Navbar, Footer
│   ├── config/                   # Auth configuration
│   ├── constants/                # App metadata
│   ├── context/                  # AppDataContext, AuthContext
│   ├── data/                     # Seed data (localStorage fallback)
│   ├── features/                 # Feature-scoped modules
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Landing, Auth, Legal, Student, Provider, Admin
│   ├── routes/                   # Route table, path constants, RequireAuth guard
│   ├── services/                 # transport, pooling, assistant, analytics
│   └── styles/                   # Tailwind entry point, design tokens
│
├── server/                       # Backend (Express + MongoDB)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, logout, tokens
│   │   │   ├── studentController.js  # Student portal APIs
│   │   │   ├── providerController.js # Provider portal APIs
│   │   │   └── adminController.js    # Admin portal APIs
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verify, role authorization
│   │   │   ├── errorHandler.js   # Global error handling
│   │   │   ├── rateLimiter.js    # API rate limiting
│   │   │   ├── upload.js         # Multer file uploads
│   │   │   └── validation.js     # express-validator helpers
│   │   ├── models/               # 15 Mongoose models
│   │   │   ├── User.js
│   │   │   ├── StudentProfile.js
│   │   │   ├── ProviderProfile.js
│   │   │   ├── Village.js
│   │   │   ├── Stop.js
│   │   │   ├── Route.js
│   │   │   ├── Schedule.js
│   │   │   ├── Vehicle.js
│   │   │   ├── TravelRequest.js
│   │   │   ├── RideRequest.js
│   │   │   ├── PoolingGroup.js
│   │   │   ├── Payment.js
│   │   │   ├── Payout.js
│   │   │   ├── Notification.js
│   │   │   ├── SavedJourney.js
│   │   │   └── AuditLog.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── studentRoutes.js
│   │   │   ├── providerRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── services/
│   │   │   ├── journeyService.js     # Multi-modal journey planning
│   │   │   ├── poolingService.js     # Student pooling & matching
│   │   │   ├── paymentService.js     # Razorpay + commission logic
│   │   │   ├── notificationService.js # Cross-portal notifications
│   │   │   └── analyticsService.js   # Admin dashboards & reports
│   │   ├── seed/
│   │   │   └── index.js          # Database seeding script
│   │   ├── utils/
│   │   │   └── helpers.js        # Distance, fare, commission, time utils
│   │   └── index.js              # Express app entry point
│   ├── package.json
│   └── .env                      # Environment variables
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Community 6+ (running locally on `mongodb://127.0.0.1:27017`)
- npm or yarn

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

**Backend** (`server/.env`):
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/routenex

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

PLATFORM_COMMISSION_PERCENT=3

SEED_DB=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend** (optional, `.env` in root):
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB
Ensure MongoDB is running:
```bash
# Windows (if installed as service)
net start MongoDB

# Or start manually
mongod --dbpath "C:\data\db"
```

### 5. Seed Database & Start Backend
```bash
cd server
npm run seed      # Seeds admin, villages, stops, routes, vehicles, schedules
npm run dev       # Starts backend on http://localhost:5000
```

### 6. Start Frontend
```bash
# In a new terminal, from project root
npm run dev       # Starts frontend on http://localhost:5173
```

### 7. Verify Setup
- **Frontend**: http://localhost:5173
- **Backend Health**: http://localhost:5000/api/health
- **API Base**: http://localhost:5000/api

## Authentication System

### JWT Token Structure

**Access Token** (15 min - 7 days):
```json
{
  "id": "user_id",
  "role": "student|provider|admin",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Refresh Token** (30 days):
```json
{
  "id": "user_id",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Password Security
- bcrypt with 12 rounds
- Minimum 6 characters
- Never logged or returned in responses

### Token Storage
- **Access Token**: HttpOnly cookie (`token`) + returned in response body
- **Refresh Token**: HttpOnly cookie (`refreshToken`) + returned in response body
- **Frontend**: Stores access token in memory, refresh token in httpOnly cookie

### Role-Based Access Control

| Role | Portal Access | API Prefix |
| --- | --- | --- |
| `admin` | `/admin/*` | `/api/admin/*` |
| `student` | `/student/*` | `/api/student/*` |
| `provider` | `/provider` | `/api/provider/*` |

### Auth Flow

```
1. REGISTER
   POST /api/auth/register
   { role, name, email, phone, password, villageId?, college? }
   → Creates User + Profile (StudentProfile or ProviderProfile)
   → Returns { user, accessToken, refreshToken }
   → Sets HttpOnly cookies

2. LOGIN
   POST /api/auth/login
   { role, email, password }
   → Validates role matches, bcrypt compare
   → Updates lastLogin
   → Returns { user, profile, accessToken, refreshToken }

3. AUTHENTICATED REQUESTS
   Authorization: Bearer <accessToken>
   OR Cookie: token=<accessToken>
   → Middleware verifies JWT, attaches req.user

4. TOKEN REFRESH
   POST /api/auth/refresh
   (reads refreshToken from cookie or body)
   → Verifies refresh token, issues new pair

5. LOGOUT
   POST /api/auth/logout
   → Clears cookies

6. PASSWORD RESET
   POST /api/auth/forgot-password { email }
   → Generates token, logs to console (dev)
   POST /api/auth/reset-password { token, password }
   → Validates token, updates password
```

### Frontend Integration (AuthContext)

```javascript
// src/context/AuthContext.jsx
const { user, login, register, logout, refreshToken, isAuthenticated } = useAuth();

// Login
await login({ role: 'student', email: 'student@test.com', password: 'password123' });

// Register
await register({ role: 'student', name: 'John', email: 'john@test.com', password: 'password123' });

// Access token for API calls
const token = user?.accessToken;
fetch('/api/student/dashboard', { headers: { Authorization: `Bearer ${token}` } });
```

## API Reference

### Base URL
```
Development: http://localhost:5000/api
Production:  https://api.routenex.com/api
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

### 🔐 Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/register` | Public | Register student/provider |
| POST | `/login` | Public | Login any role |
| POST | `/logout` | Authenticated | Logout, clear cookies |
| POST | `/refresh` | Public (cookie) | Refresh access token |
| GET | `/me` | Authenticated | Get current user + profile |
| PUT | `/profile` | Authenticated | Update profile |
| PUT | `/password` | Authenticated | Change password |
| POST | `/forgot-password` | Public | Request reset token |
| POST | `/reset-password` | Public | Reset with token |

**Register Body (Student):**
```json
{
  "role": "student",
  "name": "Ananya",
  "email": "ananya@college.edu",
  "phone": "9876543210",
  "password": "password123",
  "villageId": "village_object_id",
  "college": "Govt. Arts & Science College"
}
```

**Register Body (Provider):**
```json
{
  "role": "provider",
  "name": "Green Wheels",
  "email": "prakash@greenwheels.in",
  "phone": "9876543210",
  "password": "password123"
}
```

---

### 🎓 Student Routes (`/api/student`) — Requires `student` role

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dashboard` | Dashboard with stats & recent activity |
| GET | `/journeys/search` | Multi-modal journey planner |
| GET | `/evs/search` | Search available EVs |
| POST | `/evs/request` | Request EV ride |
| GET | `/rides` | List my ride requests |
| DELETE | `/rides/:id` | Cancel ride request |
| POST | `/travel-requests` | Create travel request (for pooling) |
| GET | `/travel-requests` | List my travel requests |
| PUT | `/travel-requests/:id` | Update travel request |
| GET | `/pooling/matches` | Find pooling matches |
| POST | `/pooling/groups` | Create pooling group from matches |
| GET | `/pooling/groups` | List my pooling groups |
| POST | `/pooling/groups/:id/ev` | Request shared EV for group |
| DELETE | `/pooling/groups/:id` | Cancel pooling group |
| POST | `/journeys/save` | Save a journey |
| GET | `/journeys/saved` | List saved journeys |
| DELETE | `/journeys/saved/:id` | Delete saved journey |
| GET | `/villages` | List all villages |
| GET | `/stops` | List stops (filter by village) |
| GET | `/stops/nearby` | Find stops near coordinates |
| POST | `/payments/initiate` | Create Razorpay order |
| POST | `/payments/verify` | Verify payment signature |
| GET | `/payments/history` | Payment history |

**Journey Search Query:**
```
GET /journeys/search?originStopId=xxx&destinationStopId=yyy&date=2026-01-15&afterTime=08:00&seats=1&preference=recommended
```

**EV Search Query:**
```
GET /evs/search?originStopId=xxx&destinationStopId=yyy&date=2026-01-15&afterTime=08:00&seats=1&kind=ev-auto
```

---

### 🚌 Provider Routes (`/api/provider`) — Requires `provider` role

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dashboard` | Dashboard with stats & pending requests |
| PUT | `/profile` | Update provider profile |
| PUT | `/availability` | Toggle availability |
| POST | `/vehicles` | Register new vehicle |
| GET | `/vehicles` | List my vehicles |
| PUT | `/vehicles/:id` | Update vehicle |
| DELETE | `/vehicles/:id` | Delete vehicle |
| PUT | `/vehicles/:id/availability` | Toggle vehicle availability |
| GET | `/requests/pending` | List pending ride requests |
| PUT | `/requests/:id/accept` | Accept ride request |
| PUT | `/requests/:id/reject` | Reject ride request |
| PUT | `/requests/:id/complete` | Mark ride completed |
| GET | `/rides/history` | Ride history with pagination |
| GET | `/earnings` | Earnings summary & history |

---

### 👑 Admin Routes (`/api/admin`) — Requires `admin` role

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dashboard` | System overview dashboard |
| GET | `/students` | List students (paginated, searchable) |
| PUT | `/students/:id/status` | Activate/deactivate student |
| GET | `/providers` | List providers (paginated, searchable) |
| PUT | `/providers/:id/verify` | Verify provider |
| PUT | `/providers/:id/status` | Activate/deactivate provider |
| GET | `/villages` | List villages |
| POST | `/villages` | Create village |
| PUT | `/villages/:id` | Update village |
| DELETE | `/villages/:id` | Delete village |
| GET | `/stops` | List stops |
| POST | `/stops` | Create stop |
| PUT | `/stops/:id` | Update stop |
| DELETE | `/stops/:id` | Delete stop |
| GET | `/routes` | List routes |
| POST | `/routes` | Create route |
| PUT | `/routes/:id` | Update route |
| DELETE | `/routes/:id` | Delete route |
| GET | `/schedules` | List schedules |
| POST | `/schedules` | Create schedule |
| PUT | `/schedules/:id` | Update schedule |
| DELETE | `/schedules/:id` | Delete schedule |
| GET | `/rides` | All ride requests (admin view) |
| GET | `/financials` | Financial summary & daily earnings |
| GET | `/system/health` | System health metrics |
| GET | `/audit-logs` | Audit logs |
| POST | `/notifications` | Send notification to user/role |

---

## Database Seeding

Run the seed script to populate initial data:

```bash
cd server
npm run seed
```

**Seeded Data:**
- **Admin**: `admin@routenex.com` / `routenex755`
- **8 Villages**: Uthiramerur, Kanchipuram, Chengalpattu, Maduranthakam, Sriperumbudur, Tirukalukundram, Walajabad, Acharapakkam
- **9 Stops**: College + bus stands/railway stations
- **6 Routes**: UTR-KPM, UTR-CGL, UTR-SPB, KPM-CGL, MDK-CGL, TRK-CGL
- **10 Vehicles**: 4 buses + 3 EV autos + 3 EV two-wheelers
- **76 Schedules**: 7 days × multiple departures per route

## Commission Model

| Student Pays | Platform (3%) | Provider Gets |
| --- | --- | --- |
| ₹500 | ₹15 | ₹485 |
| ₹1,000 | ₹30 | ₹970 |
| ₹2,000 | ₹60 | ₹1,940 |

Platform commission is fixed at **3%** and calculated server-side.

## Payment Flow (Razorpay Test Mode)

```
1. Student requests EV ride → RideRequest created (status: pending)
2. Provider accepts → RideRequest status: accepted
3. Student initiates payment:
   POST /api/student/payments/initiate { rideRequestId }
   → Creates Razorpay order, Payment record (status: pending)
   → Returns { orderId, amount, currency, paymentId }
4. Frontend opens Razorpay checkout with orderId
5. On success, frontend calls:
   POST /api/student/payments/verify { paymentId, orderId, signature, rideRequestId }
   → Verifies HMAC signature
   → Updates Payment status: completed
   → Updates RideRequest status: completed
   → Provider earnings updated
6. On failure: Payment status: failed
```

## Development Workflow

### Running Tests
```bash
# Backend
cd server && npm test

# Frontend
npm run lint
```

### Building for Production
```bash
# Frontend
npm run build        # Output in dist/

# Backend
cd server && npm run build  # If using TypeScript, otherwise just deploy
```

### Environment-Specific Configs

| Environment | Frontend URL | Backend URL | MongoDB |
| --- | --- | --- | --- |
| Development | http://localhost:5173 | http://localhost:5000 | mongodb://127.0.0.1:27017/routenex |
| Staging | https://staging.routenex.com | https://api-staging.routenex.com | MongoDB Atlas |
| Production | https://routenex.com | https://api.routenex.com | MongoDB Atlas |

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (64+ chars)
- [ ] Configure production MongoDB URI (MongoDB Atlas)
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Configure Razorpay live keys
- [ ] Enable HTTPS (cookies require `secure: true`)
- [ ] Set up reverse proxy (nginx) for API
- [ ] Configure CORS for production domains only
- [ ] Set up logging (Winston/Pino)
- [ ] Configure PM2 or Docker for process management
- [ ] Set up database backups
- [ ] Configure monitoring (Sentry, Datadog, etc.)

## Known Limitations

- **Demo authentication only** in frontend (localStorage). Backend now has full JWT auth.
- **Razorpay in test mode** — use test cards: `4111 1111 1111 1111` (success), `4000 0000 0000 0002` (failure)
- **Sample transport data** — routes, schedules, seat counts are illustrative
- **Map preview is schematic** — Leaflet + OSM integration planned
- **Local persistence** — frontend localStorage cleared on cache reset

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License — see LICENSE file for details.

## Support

- **Issues**: GitHub Issues
- **Email**: team@routenex.com
- **Documentation**: `/docs` (planned)

---

**Built with ❤️ for rural student mobility**