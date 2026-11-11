# Sweety – Blood Glucose Tracker

Sweety is a full-stack web application that allows diabetes patients to record up to four blood glucose readings per day and view daily and monthly reports.

Built as part of the **Kenpath Junior Full Stack Developer – JavaScript & AI assignment**.

## Tech Stack

**Frontend:** React, Vite, Axios, React Testing Library, Vitest

**Backend:** Node.js, Express 5, PostgreSQL, Prisma ORM, Zod, JWT

**Authentication & Security:** bcrypt, HTTP-only cookies, SHA-256 refresh token hashing, token rotation

**Testing:** Jest, Supertest, Vitest

## Features

- **User Authentication:** Sign up and log in with securely hashed passwords using bcrypt.
- **Reading Management:** Add, view, edit, and delete blood glucose readings.
- **User Data Protection:** Every user can access only their own readings.
- **Input Validation:** Client-side and server-side validation with clear error messages.
- **Daily Reports:** View individual readings along with the highest, lowest, average, and total count.
- **Monthly Reports:** View month-to-date and previous-month statistics.
- **Empty State:** Displays appropriate messages when no readings are available.
- **Pagination:** Paginated reading retrieval through the API.
- **Automated Tests:** Backend integration tests and frontend component tests.

## Bonus Tasks Completed

- **Pagination on `GET /readings`:** supports `?page=1&limit=10` (limit is capped at 100). The response includes `page`, `limit`, `total` and `totalPages`, and the React Readings page has Previous and Next buttons. Covered by tests in `server/tests/readings.test.js`.
- **Frontend tests with React Testing Library:** `client/src/components/ReadingForm.test.jsx` tests the reading form: the error messages, the boundary values 40 and 600, the future-date rule, server error messages, and edit mode. Run them with `cd client && npm test`.

## Validation Rules

| Validation | Error Message |
|---|---|
| Value is required | Please enter a glucose value. |
| Whole number between 40 and 600 | Value must be between 40 and 600 mg/dl. |
| Duplicate time slot on the same date | You already have an After lunch reading for this date. |
| Maximum of 4 readings per day | You can add only 4 readings per day. |
| Future dates are not allowed | Date cannot be in the future. |

**Available time slots:**
1. Morning (fasting)
2. After breakfast
3. After lunch
4. After dinner

## Reports

The application provides three types of reports.

For a selected date of **15 October 2026**:

| Report | Date Range |
|---|---|
| Daily | 15 October 2026 |
| Month to Date | 1 October – 15 October 2026 |
| Previous Month | 1 September – 30 September 2026 |

Each report includes:

- Highest glucose reading
- Lowest glucose reading
- Average glucose reading (rounded to 1 decimal place)
- Total number of readings

When no readings are available, the API returns `count: 0`, `null` values for highest, lowest, and average, and `empty: true`. The frontend displays an appropriate empty state.

## Project Structure

```text
sweety/
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── config/          # Environment validation (Zod)
│   │   ├── lib/             # Prisma, tokens, dates, errors, Swagger
│   │   ├── middleware/      # Validation, authentication, error handling
│   │   └── modules/
│   │       ├── auth/        # Authentication routes, controllers, services
│   │       ├── readings/    # Reading CRUD operations
│   │       └── reports/     # Daily and monthly reports
│   │
│   ├── tests/               # Jest + Supertest integration tests
│   ├── .env.example
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── api/             # Axios client and token refresh
│   │   ├── context/         # AuthProvider and useAuth
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Login, Register, Readings, Reports
│   │   └── lib/             # Validation, date and error helpers
│   │
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── screenshots/
│
└── README.md
```

## Prerequisites

Make sure the following are installed:

- Node.js 18 or newer
- PostgreSQL 14 or newer
- npm
- Git

## Getting Started

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Prakruthi276/sweety.git
cd sweety
```

### 2. Install Dependencies

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

### 3. Create PostgreSQL Databases

Create the development and test databases:

```bash
psql -U postgres -c "CREATE DATABASE sweety;" -c "CREATE DATABASE sweety_test;"
```

### 4. Configure Environment Variables

Navigate to the server directory:

```bash
cd ../server
```

Create the environment file:

```bash
cp .env.example .env
```

**For Windows:**

```cmd
copy .env.example .env
```

Update `server/.env` with your PostgreSQL credentials and security secrets.

Generate a secure secret using:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Generate two different secrets and configure them as `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.

#### Server Environment Variables

| Variable | Description |
|---|---|
| `NODE_ENV` | Application environment: development, test, or production |
| `PORT` | API port (default: 5000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | Secret used to sign access tokens (minimum 32 characters) |
| `REFRESH_TOKEN_SECRET` | Separate secret used to sign refresh tokens |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token expiration (default: 15m) |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token expiration (default: 7 days) |
| `CLIENT_URL` | Frontend URL allowed by CORS (default: http://localhost:5173) |
| `APP_TIMEZONE` | Application timezone (default: Asia/Kolkata) |

#### Client Environment Variables

Navigate to the client directory:

```bash
cd ../client
```

Create the environment file:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (default: http://localhost:5000/api) |

### 5. Configure the Test Environment

Create `server/.env.test` by copying `server/.env`.

Update the following:

```env
NODE_ENV=test
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety_test"
```

Use your actual PostgreSQL credentials.

### 6. Run Database Migrations and Seed Data

Navigate to the server directory:

```bash
cd ../server
```

Apply database migrations:

```bash
npx prisma migrate deploy
```

Seed the database with sample data:

```bash
npx prisma db seed
```

The seed script creates a demo user with 60 days of sample glucose readings. Some days contain only two readings to demonstrate realistic reporting scenarios.

**Demo Credentials**

```text
Email: demo@sweety.app
Password: Demo1234
```

## Running the Application

Start the backend and frontend in separate terminals.

### Terminal 1 – Backend

```bash
cd server
npm run dev
```

Backend API:

```text
http://localhost:5000
```

Swagger API Documentation:

```text
http://localhost:5000/api-docs
```

### Terminal 2 – Frontend

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

**Important:** Use `localhost` instead of `127.0.0.1`, because the configured CORS origin is `http://localhost:5173`.

## Running Tests

### Backend Tests

```bash
cd server
npm test
```

Backend tests use Jest and Supertest with a real PostgreSQL test database.

Coverage includes:

- User registration and login
- Access token and refresh token handling
- Refresh token rotation and reuse detection
- Logout
- Reading CRUD operations
- All validation rules
- User data ownership
- Pagination
- Daily and monthly reports
- Boundary dates and leap years
- Year changes
- Empty report states

### Frontend Tests

```bash
cd client
npm test
```

Frontend tests use Vitest and React Testing Library to test the reading form and its interactions.

## API Endpoints

Base URL:

```text
http://localhost:5000/api
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Log in and receive an access token |
| POST | `/auth/refresh` | Rotate refresh token and generate a new access token |
| POST | `/auth/logout` | Revoke the refresh token |
| GET | `/auth/me` | Get the currently authenticated user |

### Readings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/readings?date=&page=&limit=` | Get paginated readings with an optional date filter |
| POST | `/readings` | Create a new glucose reading |
| GET | `/readings/:id` | Get a specific reading |
| PUT | `/readings/:id` | Update a reading |
| DELETE | `/readings/:id` | Delete a reading |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/daily?date=` | Get daily glucose report |
| GET | `/reports/month-to-date?date=` | Get month-to-date report |
| GET | `/reports/monthly?date=` | Get previous-month report |

## Authentication Flow

The application uses JWT-based authentication with access and refresh tokens.

1. **Login:** The user submits their email and password. The backend verifies the password using bcrypt.
2. **Access Token:** A short-lived access token (15 minutes) is returned in the response body.
3. **Refresh Token:** A refresh token (7 days) is sent through an HTTP-only cookie. Only its SHA-256 hash is stored in the database.
4. **Client Storage:** The React application stores the access token in memory, not in localStorage.
5. **Token Refresh:** When the access token expires, Axios calls `/api/auth/refresh` and retries the original request.
6. **Session Restoration:** After a page reload, the client attempts to restore the session using the refresh token cookie.
7. **Token Rotation:** Every successful refresh generates a new refresh token and invalidates the previous one.
8. **Reuse Detection:** If an already-used refresh token is presented again, all sessions belonging to that user are revoked.
9. **Separate Secrets:** Different secrets are used to sign access tokens and refresh tokens.

## Screenshots and Demo

### Application Screenshots

Screenshots are available in the directory.

### Screen Recording

**Demo Video:** https://drive.google.com/file/d/1sdNVcDFpyT46J8OBhEIxGMKaFbo_PdLv/view?usp=sharing
## Notes

## Assumptions and Design Decisions

- Dates are calendar dates (`YYYY-MM-DD`) stored in PostgreSQL using the `DATE` column type.
- The application uses `APP_TIMEZONE` (default: `Asia/Kolkata`) to determine today's date and validate future dates.
- The maximum of four readings per day is checked before the duplicate-slot validation.
- A database unique constraint on user, date, and time slot prevents duplicate readings, including simultaneous requests.
- Updating a reading replaces its date, slot, and value, and all validation rules are checked again.
- Requests for another user's reading return `404 Not Found` instead of `403 Forbidden` to avoid revealing whether the record exists.
- Reports reject future selected dates. If no date is provided, the application uses today's date.
- The previous-month report always covers the complete month before the selected date's month.
- Average values are calculated using integer arithmetic and rounded half up to one decimal place.
- Passwords must contain at least eight characters, including one letter and one number.
- Access tokens are stateless. After logout, an existing access token remains valid until it expires (maximum 15 minutes), while the refresh token is revoked immediately.
- The frontend uses the browser's local date, while the backend uses `APP_TIMEZONE`. Users in significantly different timezones may encounter a future-date validation message.

## Future Improvements

With additional development time, the following improvements could be implemented:

- Include a session ID in access tokens and validate it on every request to make logout immediately invalidate access tokens.
- Handle duplicate registration errors by returning `409 Conflict` instead of `500 Internal Server Error`.
- Use a dummy password hash when an email address is not found to reduce login timing differences.
- Implement rate limiting for authentication endpoints.
- Add security headers using Helmet.
- Implement password reset functionality through email.
- Add a database CHECK constraint to enforce the glucose value range of 40–600 mg/dl.
- Support timezone preferences per user.
- Handle simultaneous refresh requests from multiple browser tabs using a grace period or the Web Locks API.
- Cache report results using Redis and invalidate the cache whenever a reading changes.
- Add a line chart to visualize glucose readings over time.
- Use Docker Compose for PostgreSQL and application setup.
- Add end-to-end testing using Playwright.
- Generate Swagger documentation directly from Zod schemas.
- Add a daily wellness tip written by an LLM on the server. It would be generated once a day and cached in the database. The model would receive no patient data, follow a fixed prompt that forbids medical advice, have its output validated, and fall back to a static list of tips if the call fails.
- Show festival greetings from a maintained list of dates, not from an AI model, because language models can get dates wrong. Keep the wording neutral and inclusive.
- Add a "readings logged today" progress line with streaks, a CSV or PDF export of reports for doctors, a daily reminder job (BullMQ), and a doctor role.

---

## Author

**Prakruthi M V**

- GitHub: [Prakruthi276](https://github.com/Prakruthi276)
- LinkedIn: [Prakruthi M V](https://linkedin.com/in/prakruthi-m-v-230542347)

---

**Built with Node.js, Express, PostgreSQL, Prisma, and React.**
