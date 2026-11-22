# SmartPass — All-in-One Digital Card (Backend REST API)

> **IMPORTANT SECURITY WARNING**  
> The seed data provides an administrative account (`admin@smartpass.edu` with password `Admin@123`) strictly for demonstration and testing purposes. **You MUST change the admin password and `JWT_SECRET` in `.env` before any production deployment.**

---

## 1. Overview & System Purpose

SmartPass replaces all physical school cards with **ONE digital card per user**.  
One user = one account = one primary card, used for:
- Student ID & verification
- Attendance check-in
- Library loans & return tracking
- Canteen cashless wallet payment
- Parking check-in & automated fee calculation
- Room booking with conflict detection
- Event registration with atomic capacity management
- Class schedule view
- Multi-audience school notifications
- Privacy-controlled emergency card via public QR / NFC

---

## 2. Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **Database**: MongoDB
- **ODM**: Mongoose 8
- **Language**: JavaScript (CommonJS `require` / `module.exports`, strictly NO TypeScript)
- **Authentication**: `bcryptjs` (salt rounds = 10) + `jsonwebtoken` (JWT)
- **Configuration**: `dotenv`
- **Development Runner**: `nodemon`

---

## 3. Architecture: 4-Layer Unidirectional Flow

The architecture strictly enforces unidirectional flow with zero cross-layer rule violations:
`Client -> Route -> Middleware -> Controller -> Service -> Model -> MongoDB`

```
smartpass-backend/
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── server.js               # Express application setup and route mounting
    ├── config/
    │   └── db.js               # MongoDB connection lifecycle
    ├── models/                 # Mongoose schemas, enums, defaults, and indexes ONLY
    ├── middleware/             # Authentication (protect) & Authorization (authorize) only
    ├── controllers/            # Read req, call ONE service function, return HTTP res
    ├── services/               # ALL business logic, status checks, money math, and errors
    ├── utils/                  # Shared utilities (assertCardUsable, generateToken)
    └── seed/
        └── seed.js             # Initial database seed script
```

### Layer Responsibilities:
1. **`routes/`**: Declare HTTP method and URL path, attach authentication/authorization middleware, and invoke exactly ONE controller function. **No business logic, no direct Model imports.**
2. **`middleware/`**: Handle cross-cutting concerns: `protect` (verifies Bearer JWT), `authorize(...roles)` (role-based access control), and `errorHandler` (central sanitized error responses).
3. **`controllers/`**: Extract request inputs (`params`, `query`, `body`, `user`), call exactly ONE service function, and dispatch standardized JSON response. **Never import any Mongoose Model.**
4. **`services/`**: Execute ALL validation, database queries via Models, money math, status transitions, and throw errors with explicit `statusCode` properties.
5. **`models/`**: Define schema definitions, constraints, default values, and compound indexes. Contain no business logic.

---

## 4. Design Choices & Assumptions (Satisfying Spec)

1. **Staff Roles**: Allowed roles are `admin`, `student`, `librarian`, `canteen_staff`, and `parking_staff`. Default role is `student`.
2. **Card Verification (`POST /api/cards/verify`)**: Open to authenticated users/staff to verify a card via `cardCode`, `nfcUid`, or `qrToken`.
3. **Parking Fee Calculation**: Fixed rate of 2,000 VND/hour. Parked duration is rounded up via `Math.ceil(hours)`. Minimum parking charge is 1 hour (2,000 VND).
4. **Library Loan Due Date**: Default loan period is exactly 14 days from time of borrowing.
5. **Class Schedule Days**: Stored as integers where 2 = Monday, 3 = Tuesday, ..., 8 = Sunday.

---

## 5. Standard Response Format

### Success (Single Resource):
```json
{
  "success": true,
  "data": { ... }
}
```

### Success (List with Pagination):
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 57
  }
}
```

### Error:
```json
{
  "success": false,
  "message": "Human-readable reason"
}
```

---

## 6. Complete API Endpoints Table

| Method | Path | Allowed Roles | Purpose |
|---|---|---|---|
| **Root** | | | |
| `GET` | `/` | Public | API Health Check |
| **Auth** | | | |
| `POST` | `/api/auth/register` | Public | Register new account & auto-create wallet |
| `POST` | `/api/auth/login` | Public | Login with email/password; rate-limited (INV-09/10) |
| `GET` | `/api/auth/me` | Authenticated | Get current user profile (no password) |
| `PATCH`| `/api/auth/change-password` | Authenticated | Change account password |
| **Users (Admin)** | | | |
| `GET` | `/api/users` | `admin` | Search users (`?q=`) with pagination |
| `POST` | `/api/users` | `admin` | Create new user account |
| `GET` | `/api/users/:id` | `admin` | Get user details by ID |
| `PATCH`| `/api/users/:id` | `admin` | Update user profile fields |
| `PATCH`| `/api/users/:id/role` | `admin` | Update user role |
| `PATCH`| `/api/users/:id/deactivate` | `admin` | Deactivate user account |
| `DELETE`| `/api/users/:id` | `admin` | Delete user account |
| **Cards** | | | |
| `POST` | `/api/cards` | `admin` | Create new card with secure `qrToken` |
| `GET` | `/api/cards` | `admin` | List cards with filters & pagination |
| `POST` | `/api/cards/verify` | Authenticated | Verify card and retrieve owner metadata |
| `GET` | `/api/cards/:id` | `admin`, Owner | Get card details |
| `PATCH`| `/api/cards/:id/issue` | `admin` | Activate card and record `issuedAt` |
| `PATCH`| `/api/cards/:id/lock` | `admin` | Lock card |
| `PATCH`| `/api/cards/:id/unlock`| `admin` | Unlock card back to active |
| `PATCH`| `/api/cards/:id/renew` | `admin` | Renew card validity (`expiresAt += months`) |
| `PATCH`| `/api/cards/:id/lost` | `admin`, Owner | Mark card as lost |
| `DELETE`| `/api/cards/:id` | `admin` | Delete card |
| `GET` | `/api/cards/:id/history` | `admin`, Owner | View card access log history |
| **Access Logs** | | | |
| `GET` | `/api/logs` | `admin` | Query access logs with multi-field filters |
| **Attendance** | | | |
| `POST` | `/api/attendance/check` | Staff roles | Check-in attendance by card (INV-02, INV-04) |
| `GET` | `/api/attendance/my` | `student` | View student's personal attendance history |
| `GET` | `/api/attendance` | Staff roles | List attendance records by session / date |
| **Library** | | | |
| `POST` | `/api/library/borrow` | `admin`, `librarian` | Borrow book (INV-06: max 3 active loans) |
| `POST` | `/api/library/return` | `admin`, `librarian` | Return book and report overdue status |
| `GET` | `/api/library/my-loans`| `student` | View student's current and past loans |
| `GET` | `/api/library/loans` | `admin`, `librarian` | List all library loans with pagination |
| **Canteen & Wallet** | | | |
| `GET` | `/api/wallet/me` | `student` | View current wallet balance |
| `POST` | `/api/wallet/topup` | `admin`, `canteen_staff` | Top up student wallet balance |
| `POST` | `/api/wallet/pay` | `admin`, `canteen_staff` | Deduct wallet payment (INV-02, INV-03, INV-04) |
| `GET` | `/api/wallet/transactions` | `student` | View personal transaction history |
| `GET` | `/api/wallet/transactions/all` | `admin` | List all canteen transactions |
| **Parking** | | | |
| `POST` | `/api/parking/check-in` | `admin`, `parking_staff` | Vehicle check-in (INV-05: max 1 open session) |
| `POST` | `/api/parking/check-out`| `admin`, `parking_staff` | Vehicle check-out and fee calculation |
| `GET` | `/api/parking/my` | `student` | View personal parking sessions |
| `GET` | `/api/parking/active` | `admin`, `parking_staff` | View currently active parked vehicles |
| **Room Booking** | | | |
| `GET` | `/api/rooms/availability` | Authenticated | View approved time slots for date/room |
| `POST` | `/api/room-bookings` | Authenticated | Request room booking (INV-08 conflict check) |
| `PATCH`| `/api/room-bookings/:id/approve` | `admin` | Approve pending room booking (INV-08) |
| `PATCH`| `/api/room-bookings/:id/reject` | `admin` | Reject pending room booking |
| `GET` | `/api/room-bookings/my`| Authenticated | View my room bookings |
| `PATCH`| `/api/room-bookings/:id/cancel` | Owner | Cancel room booking |
| **Events** | | | |
| `POST` | `/api/events` | `admin` | Create new event with capacity |
| `GET` | `/api/events` | Authenticated | List upcoming events |
| `POST` | `/api/events/:id/register` | `student` | Atomic event registration (INV-07) |
| `GET` | `/api/events/my` | `student` | View registered events |
| **Schedule & Notifications** | | | |
| `GET` | `/api/schedules/my` | `student` | View current student's class schedule |
| `POST` | `/api/schedules` | `admin` | Create class schedule row |
| `GET` | `/api/schedules` | `admin` | List class schedules |
| `PATCH`| `/api/schedules/:id` | `admin` | Update schedule row |
| `DELETE`| `/api/schedules/:id`| `admin` | Delete schedule row |
| `POST` | `/api/notifications` | `admin` | Broadcast or target notification |
| `GET` | `/api/notifications/my`| Authenticated | Get user notifications with `isRead` |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| **Emergency Profile** | | | |
| `GET` | `/api/emergency/me` | Authenticated | Get own emergency profile |
| `PUT` | `/api/emergency/me` | Authenticated | Update emergency profile & visibility |
| `POST` | `/api/emergency/me/rotate-qr` | Authenticated | Invalidate old and generate new QR token |
| `GET` | `/api/emergency/public/:qrToken` | Public | Emergency profile view (R1 to R6 strict) |

---

## 7. How to Install and Run

### Prerequisites
- Node.js version 20+
- MongoDB Atlas account and a connection string

### Setup Steps
```bash
# 1. Navigate to backend directory
cd smartpass-backend

# 2. Configure environment variables
cp .env.example .env
# Open .env and paste your MongoDB Atlas URI:
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartpass?retryWrites=true&w=majority

# 3. Install dependencies
npm install

# 4. Seed initial database records
npm run seed

# 5. Start development server with nodemon
npm run dev

# 6. Run acceptance tests (automatically runs against smartpass_test)
npm test
```

Server will start on `http://localhost:3000`.

---

## 8. Complete Step-by-Step cURL Flow

### Step 1: Register a new student account
```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Le Van Cuong",
    "email": "cuong.le@smartpass.edu",
    "password": "Password@123",
    "phone": "0911223344",
    "studentCode": "STU100",
    "className": "SE101"
  }'
```

### Step 2: Login as Admin to get Admin JWT
```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartpass.edu","password":"Admin@123"}' | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "Admin Token: $ADMIN_TOKEN"
```

### Step 3: Admin creates a card for the new student
```bash
# Get student ID from login or user list
STUDENT_ID=$(curl -s -X GET "http://localhost:3000/api/users?q=cuong.le@smartpass.edu" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

CREATE_CARD_RES=$(curl -s -X POST http://localhost:3000/api/cards \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"cardCode\": \"CARD-STU100\",
    \"owner\": \"$STUDENT_ID\",
    \"expiresAt\": \"2027-12-31T23:59:59.000Z\",
    \"nfcUid\": \"NFC-CUONG-100\"
  }")
CARD_ID=$(echo $CREATE_CARD_RES | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
QR_TOKEN=$(echo $CREATE_CARD_RES | grep -o '"qrToken":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Card ID: $CARD_ID, QR Token: $QR_TOKEN"
```

### Step 4: Admin issues the card (activate)
```bash
curl -s -X PATCH "http://localhost:3000/api/cards/$CARD_ID/issue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 5: Staff records attendance check-in using the card
```bash
curl -s -X POST http://localhost:3000/api/attendance/check \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardCode": "CARD-STU100",
    "classSession": "SE101-2026-11-08-AM",
    "subject": "Distributed Systems"
  }'
```

### Step 6: Top-up wallet and perform canteen payment
```bash
# 6a. Admin tops up 100,000 VND
curl -s -X POST http://localhost:3000/api/wallet/topup \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$STUDENT_ID\",
    \"amount\": 100000,
    \"note\": \"Initial top-up\"
  }"

# 6b. Canteen payment of 35,000 VND using cardCode
curl -s -X POST http://localhost:3000/api/wallet/pay \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardCode": "CARD-STU100",
    "amount": 35000
  }'
```

### Step 7: Configure Emergency Profile & Public QR Scan
```bash
# 7a. Student logs in to get Student JWT
STUDENT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cuong.le@smartpass.edu","password":"Password@123"}' | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

# 7b. Student configures emergency profile with strict visible fields and enables it
curl -s -X PUT http://localhost:3000/api/emergency/me \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Le Van Cuong",
    "emergencyContactName": "Le Van Bo (Father)",
    "emergencyContactPhone": "0988776655",
    "allergies": "Aspirin",
    "bloodType": "B+",
    "insuranceInfo": "BHYT-555666",
    "visibleFields": ["fullName", "emergencyContactPhone", "bloodType"],
    "isEnabled": true
  }'

# 7c. Public scans the card QR without ANY authentication:
curl -s -X GET "http://localhost:3000/api/emergency/public/$QR_TOKEN"
```

**Expected Response from Step 7c:**
```json
{
  "success": true,
  "data": {
    "fullName": "Le Van Cuong",
    "emergencyContactPhone": "0988776655",
    "bloodType": "B+"
  }
}
```
*(Notice: `allergies`, `insuranceInfo`, `email`, `studentCode`, and `emergencyContactName` are completely ABSENT from JSON, fulfilling Rule R1!)*

