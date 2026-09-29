# EventPro API

REST API for an event booking platform: user accounts, events, bookings and M-Pesa payments. It powers the [EventPro](https://github.com/charlesakwoyo/eventpro) web app.

## Features

- **Authentication:** registration and login with hashed passwords (bcrypt) and JWT access tokens; Google and Facebook sign-in through Passport.
- **Events:** create, list, view, update and delete events, with image uploads (Multer).
- **Bookings:** customers book events and view their bookings.
- **Payments:** M-Pesa STK Push through the Safaricom Daraja API, with a callback that records the payment result.
- **Users:** profile management and an admin view of all users.
- Protected routes through JWT middleware.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcryptjs, Passport (Google OAuth 2.0, Facebook) |
| Payments | Safaricom Daraja API (M-Pesa STK Push) |
| Uploads | Multer |

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in and receive a JWT |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/change-password` | Change password |
| GET | `/api/events` | List events |
| GET | `/api/events/:id` | Event details |
| POST / PUT / DELETE | `/api/events/:id` | Manage events |
| GET / POST | `/api/bookings` | List and create bookings |
| POST | `/api/payments/initiate` | Start an M-Pesa STK Push |
| GET | `/api/payments/:paymentId` | Payment status |
| POST | `/api/payments/mpesa/callback` | Daraja payment callback |
| GET / PATCH / DELETE | `/api/users/...` | Profiles and user management |

## Getting started

```bash
git clone https://github.com/charlesakwoyo/backend.git
cd backend
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # or: node index.js
```

The API runs on `http://localhost:5000`.

### Environment variables

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Port (default 5000) |
| `JWT_SECRET` | Secret used to sign tokens |
| `MPESA_ENV` | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` | Daraja app credentials |
| `MPESA_SHORTCODE`, `MPESA_PASSKEY` | Paybill/till short code and Lipa na M-Pesa passkey |
| `MPESA_CALLBACK_URL` | Public HTTPS URL for `/api/payments/mpesa/callback` (e.g. via ngrok in development) |

## Author

**Charles Akwoyo** · [GitHub](https://github.com/charlesakwoyo) · [Portfolio](https://akwoyo.netlify.app)
