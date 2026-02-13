# Merkezi Kimlik Doğrulama Servisi - Proje Tanımı

## Genel Bakış
Tüm projelerimde kullanabileceğim, ölçeklenebilir, güvenli bir merkezi authentication/authorization servisi geliştir. Bu servis, birden fazla projenin (multi-tenant) aynı auth altyapısını kullanmasını sağlayacak.

## Teknoloji Stack

### Backend
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL 15+
- **Cache:** Redis
- **Validation:** Zod
- **API Documentation:** Swagger/OpenAPI

### Authentication & Security
- **Token Strategy:** JWT (Access Token) + Refresh Token
- **Password Hashing:** bcrypt
- **OAuth 2.0 Providers:** Google, GitHub, Apple
- **SMS Provider:** Twilio
- **Telegram:** Telegraf (Bot Framework)
- **2FA:** otplib (TOTP)
- **Rate Limiting:** express-rate-limit
- **Security Headers:** helmet
- **CORS:** cors middleware

### DevOps
- **Containerization:** Docker + Docker Compose
- **Environment Management:** dotenv
- **Process Manager:** PM2 (production)
- **Logging:** Winston + Morgan
- **Error Tracking:** (hazırlık olsun - Sentry entegrasyonu için)

## Proje Yapısı

```
auth-service/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── passport.ts
│   │   ├── swagger.ts
│   │   └── constants.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── oauth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── project.controller.ts
│   │   └── 2fa.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   └── projectKey.middleware.ts
│   ├── models/
│   │   └── (Prisma generated)
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── oauth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── project.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   ├── telegram.service.ts
│   │   ├── token.service.ts
│   │   ├── oauth.service.ts
│   │   └── 2fa.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── jwt.ts
│   │   ├── encryption.ts
│   │   └── validators.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   └── custom.types.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## Database Schema (Prisma)

```prisma
// User Management
model User {
  id                String    @id @default(uuid())
  email             String?   @unique
  emailVerified     Boolean   @default(false)
  phoneNumber       String?   @unique
  phoneVerified     Boolean   @default(false)
  passwordHash      String?
  
  firstName         String?
  lastName          String?
  avatar            String?
  locale            String    @default("en")
  timezone          String?
  
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?
  
  isActive          Boolean   @default(true)
  isBanned          Boolean   @default(false)
  banReason         String?
  
  lastLoginAt       DateTime?
  lastLoginIp       String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  oauthProviders    OAuthProvider[]
  sessions          Session[]
  emailVerifications EmailVerification[]
  phoneVerifications PhoneVerification[]
  passwordResets    PasswordReset[]
  projectMemberships ProjectMembership[]
  loginHistory      LoginHistory[]
  
  @@index([email])
  @@index([phoneNumber])
}

// OAuth Providers (Google, GitHub, Apple)
model OAuthProvider {
  id              String   @id @default(uuid())
  userId          String
  provider        String   // 'google', 'github', 'apple'
  providerId      String   // ID from OAuth provider
  accessToken     String?  @db.Text
  refreshToken    String?  @db.Text
  tokenExpiresAt  DateTime?
  
  profile         Json?    // Store provider profile data
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerId])
  @@index([userId])
}

// Session Management
model Session {
  id              String   @id @default(uuid())
  userId          String
  refreshToken    String   @unique @db.Text
  
  deviceInfo      Json?    // user agent, device type, etc.
  ipAddress       String?
  
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([refreshToken])
  @@index([expiresAt])
}

// Email Verification
model EmailVerification {
  id              String   @id @default(uuid())
  userId          String
  email           String
  token           String   @unique
  expiresAt       DateTime
  
  verified        Boolean  @default(false)
  verifiedAt      DateTime?
  
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
}

// Phone Verification (SMS & Telegram)
model PhoneVerification {
  id              String   @id @default(uuid())
  userId          String
  phoneNumber     String
  code            String
  method          String   // 'sms' or 'telegram'
  
  expiresAt       DateTime
  attempts        Int      @default(0)
  
  verified        Boolean  @default(false)
  verifiedAt      DateTime?
  
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([phoneNumber])
}

// Password Reset
model PasswordReset {
  id              String   @id @default(uuid())
  userId          String
  token           String   @unique
  expiresAt       DateTime
  
  used            Boolean  @default(false)
  usedAt          DateTime?
  
  ipAddress       String?
  
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
}

// Multi-Tenant: Projects
model Project {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  description     String?
  
  apiKey          String   @unique // Her proje için unique API key
  apiSecret       String   // Hashed secret
  
  isActive        Boolean  @default(true)
  
  allowedOrigins  String[] // CORS için
  webhookUrl      String?  // Auth events için webhook
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  memberships     ProjectMembership[]
  
  @@index([apiKey])
}

// User-Project Relationship
model ProjectMembership {
  id              String   @id @default(uuid())
  userId          String
  projectId       String
  
  role            String   @default("user") // 'admin', 'user', 'guest'
  permissions     Json?    // Custom permissions per project
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([userId, projectId])
  @@index([userId])
  @@index([projectId])
}

// Login History & Audit
model LoginHistory {
  id              String   @id @default(uuid())
  userId          String
  
  method          String   // 'password', 'google', 'github', 'apple'
  success         Boolean
  failureReason   String?
  
  ipAddress       String?
  userAgent       String?  @db.Text
  location        Json?    // country, city, etc.
  
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
}
```

## API Endpoints

### 1. Authentication (Local)

#### POST /api/auth/register
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "projectApiKey": "project_api_key_here"
}

Response: 201
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST /api/auth/verify-email
```json
Request:
{
  "token": "verification_token_from_email"
}

Response: 200
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### POST /api/auth/resend-verification
```json
Request:
{
  "email": "user@example.com",
  "projectApiKey": "project_api_key_here"
}

Response: 200
{
  "success": true,
  "message": "Verification email sent"
}
```

#### POST /api/auth/login
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "projectApiKey": "project_api_key_here"
}

Response: 200
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": null,
      "emailVerified": true
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 900
    }
  }
}
```

#### POST /api/auth/refresh
```json
Request:
{
  "refreshToken": "jwt_refresh_token"
}

Response: 200
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": 900
  }
}
```

#### POST /api/auth/logout
```json
Headers:
Authorization: Bearer {accessToken}

Request:
{
  "refreshToken": "jwt_refresh_token"
}

Response: 200
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/logout-all
```json
Headers:
Authorization: Bearer {accessToken}

Response: 200
{
  "success": true,
  "message": "All sessions terminated"
}
```

### 2. Password Management

#### POST /api/auth/forgot-password
```json
Request:
{
  "email": "user@example.com",
  "projectApiKey": "project_api_key_here"
}

Response: 200
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /api/auth/reset-password
```json
Request:
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}

Response: 200
{
  "success": true,
  "message": "Password reset successful"
}
```

#### POST /api/auth/change-password
```json
Headers:
Authorization: Bearer {accessToken}

Request:
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}

Response: 200
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 3. OAuth Authentication

#### GET /api/oauth/google
```
Redirects to Google OAuth consent screen
Query params: projectApiKey, redirect_uri (optional)
```

#### GET /api/oauth/google/callback
```
Handles Google OAuth callback
Returns: Redirect to frontend with tokens in URL/cookies
```

#### GET /api/oauth/github
```
Redirects to GitHub OAuth consent screen
Query params: projectApiKey, redirect_uri (optional)
```

#### GET /api/oauth/github/callback
```
Handles GitHub OAuth callback
Returns: Redirect to frontend with tokens in URL/cookies
```

#### GET /api/oauth/apple
```
Redirects to Apple Sign In
Query params: projectApiKey, redirect_uri (optional)
```

#### POST /api/oauth/apple/callback
```
Handles Apple Sign In callback (POST request)
Returns: Redirect to frontend with tokens
```

#### DELETE /api/oauth/:provider
```
Headers:
Authorization: Bearer {accessToken}

Response: 200
{
  "success": true,
  "message": "OAuth provider disconnected"
}
```

### 4. Phone Verification (SMS & Telegram)

#### POST /api/auth/phone/send-code
```json
Headers:
Authorization: Bearer {accessToken}

Request:
{
  "phoneNumber": "+905551234567",
  "method": "sms" // or "telegram"
}

Response: 200
{
  "success": true,
  "message": "Verification code sent",
  "data": {
    "expiresIn": 300,
    "method": "sms"
  }
}
```

#### POST /api/auth/phone/verify-code
```json
Headers:
Authorization: Bearer {accessToken}

Request:
{
  "phoneNumber": "+905551234567",
  "code": "123456"
}

Response: 200
{
  "success": true,
  "message": "Phone number verified"
}
```

### 5. Two-Factor Authentication (2FA)

#### POST /api/auth/2fa/enable
```json
Headers:
Authorization: Bearer {accessToken}

Response: 200
{
  "success": true,
  "data": {
    "secret": "base32_secret",
    "qrCode": "data:image/png;base64,...",
    "backupCodes": ["code1", "code2", ...]
  }
}
```

#### POST /api/auth/2fa/verify
```json
Headers:
Authorization: Bearer {accessToken}

Request:
{
  "code": "123456"
}

Response: 200
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

#### POST /api/auth/2fa/disable
```json
Headers:
Authorization: Bearer {accessToken}

Request:
{
  "password": "current_password",
  "code": "123456"
}

Response: 200
{
  "success": true,
  "message": "2FA disabled"
}
```

#### POST /api/auth/login/2fa
```json
Request:
{
  "email": "user@example.com",
  "password": "password",
  "code": "123456",
  "projectApiKey": "project_api_key_here"
}

Response: 200
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {...}
  }
}
```

### 6. User Management

#### GET /api/users/me
```json
Headers:
Authorization: Bearer {accessToken}

Response: 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null,
    "emailVerified": true,
    "phoneNumber": "+905551234567",
    "phoneVerified": true,
    "twoFactorEnabled": false,
    "locale": "en",
    "timezone": "UTC",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PATCH /api/users/me
```json
Headers:
Authorization: Bearer {accessToken}

Request:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "locale": "tr",
  "timezone": "Europe/Istanbul"
}

Response: 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    ...
  }
}
```

#### POST /api/users/me/avatar
```
Headers:
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Body: FormData with 'avatar' file

Response: 200
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.example.com/avatars/uuid.jpg"
  }
}
```

#### DELETE /api/users/me
```json
Headers:
Authorization: Bearer {accessToken}

Request:
{
  "password": "current_password",
  "confirmation": "DELETE MY ACCOUNT"
}

Response: 200
{
  "success": true,
  "message": "Account deleted successfully"
}
```

#### GET /api/users/me/sessions
```json
Headers:
Authorization: Bearer {accessToken}

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "deviceInfo": {...},
      "ipAddress": "192.168.1.1",
      "lastUsedAt": "2024-01-01T00:00:00Z",
      "current": true
    }
  ]
}
```

#### DELETE /api/users/me/sessions/:sessionId
```json
Headers:
Authorization: Bearer {accessToken}

Response: 200
{
  "success": true,
  "message": "Session terminated"
}
```

### 7. Project Management (Admin Endpoints)

#### POST /api/projects
```json
Headers:
Authorization: Bearer {admin_access_token}

Request:
{
  "name": "My Awesome App",
  "slug": "my-awesome-app",
  "description": "App description",
  "allowedOrigins": ["https://myapp.com", "https://app.myapp.com"]
}

Response: 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Awesome App",
    "slug": "my-awesome-app",
    "apiKey": "proj_xxxxxxxxxxxxxx",
    "apiSecret": "secret_xxxxxxxxxxxxxx",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/projects
```json
Headers:
Authorization: Bearer {admin_access_token}

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Awesome App",
      "slug": "my-awesome-app",
      "isActive": true,
      "memberCount": 1250,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/projects/:projectId
```json
Headers:
Authorization: Bearer {admin_access_token}

Response: 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Awesome App",
    "slug": "my-awesome-app",
    "apiKey": "proj_xxxxxxxxxxxxxx",
    "allowedOrigins": [...],
    "webhookUrl": "https://myapp.com/webhook",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PATCH /api/projects/:projectId
```json
Headers:
Authorization: Bearer {admin_access_token}

Request:
{
  "name": "Updated App Name",
  "allowedOrigins": ["https://newdomain.com"],
  "webhookUrl": "https://myapp.com/new-webhook"
}

Response: 200
{
  "success": true,
  "data": {...}
}
```

#### POST /api/projects/:projectId/rotate-secret
```json
Headers:
Authorization: Bearer {admin_access_token}

Response: 200
{
  "success": true,
  "data": {
    "apiSecret": "new_secret_xxxxxxxxxxxxxx"
  }
}
```

#### DELETE /api/projects/:projectId
```json
Headers:
Authorization: Bearer {admin_access_token}

Response: 200
{
  "success": true,
  "message": "Project deleted"
}
```

### 8. Analytics & Monitoring

#### GET /api/projects/:projectId/stats
```json
Headers:
Authorization: Bearer {admin_access_token}

Query params: ?startDate=2024-01-01&endDate=2024-01-31

Response: 200
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "newUsersThisPeriod": 150,
    "loginCount": 5600,
    "failedLoginCount": 45,
    "oauthBreakdown": {
      "google": 750,
      "github": 300,
      "apple": 200
    }
  }
}
```

## Security Features

### 1. Rate Limiting
```typescript
// IP-based rate limiting
- Registration: 5 requests / 15 minutes
- Login: 10 requests / 15 minutes
- Password reset: 3 requests / 15 minutes
- Email verification resend: 3 requests / hour
- Phone code send: 3 requests / 15 minutes
- Phone code verify: 5 requests / 15 minutes

// User-based rate limiting (after auth)
- API calls: 100 requests / minute
- Password change: 3 requests / hour
```

### 2. Password Policy
```typescript
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Not in common password list (top 10k)
- Not same as email
```

### 3. Token Strategy
```typescript
Access Token:
- Type: JWT
- Expiry: 15 minutes
- Stored: Memory/LocalStorage (client)
- Contains: userId, projectId, role

Refresh Token:
- Type: Random secure string (UUID)
- Expiry: 30 days
- Stored: Database + HttpOnly Cookie
- Contains: sessionId reference

Token Rotation:
- New refresh token on each refresh request
- Old token invalidated immediately
```

### 4. Security Headers
```typescript
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: default-src 'self'
```

### 5. CORS Configuration
```typescript
- Origin: Dynamic based on project's allowedOrigins
- Methods: GET, POST, PUT, PATCH, DELETE
- Credentials: true
- Max Age: 86400
```

### 6. Input Validation
```typescript
- All inputs validated with Zod schemas
- SQL injection prevention (Prisma ORM)
- XSS prevention (sanitize inputs)
- Email validation (RFC 5322)
- Phone validation (libphonenumber-js)
```

## Email Templates

### 1. Welcome Email (Email Verification)
```
Subject: Welcome to [Project Name] - Verify Your Email

Hi [First Name],

Welcome to [Project Name]! Please verify your email address to complete your registration.

[Verify Email Button] → Links to: /api/auth/verify-email?token=xxx

This link expires in 24 hours.

If you didn't create this account, you can safely ignore this email.

Best regards,
The [Project Name] Team
```

### 2. Password Reset Email
```
Subject: Reset Your Password - [Project Name]

Hi [First Name],

We received a request to reset your password. Click the button below to create a new password:

[Reset Password Button] → Links to: https://[frontend]/reset-password?token=xxx

This link expires in 1 hour.

If you didn't request this, please ignore this email. Your password won't be changed.

Best regards,
The [Project Name] Team
```

### 3. Password Changed Confirmation
```
Subject: Your Password Has Been Changed

Hi [First Name],

Your password was successfully changed on [Date] at [Time] from IP: [IP Address].

If you didn't make this change, please contact us immediately.

Best regards,
The [Project Name] Team
```

### 4. New Login Alert
```
Subject: New Login to Your Account

Hi [First Name],

A new login to your account was detected:

- Date: [Date]
- Time: [Time]
- Location: [City, Country]
- Device: [Browser] on [OS]
- IP: [IP Address]

If this wasn't you, please change your password immediately.

[Change Password Button]

Best regards,
The [Project Name] Team
```

## Environment Variables (.env.example)

```env
# Application
NODE_ENV=development
PORT=3000
APP_NAME=Auth Service
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/auth_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Bcrypt
BCRYPT_ROUNDS=12

# Email (NodeMailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/oauth/github/callback

# OAuth - Apple
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY_PATH=./certs/apple-private-key.p8
APPLE_CALLBACK_URL=http://localhost:3000/api/oauth/apple/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Admin
ADMIN_EMAIL=admin@yourapp.com
ADMIN_PASSWORD=change-this-secure-password

# Logging
LOG_LEVEL=info
```

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: auth_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: auth_service
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: auth_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: ./docker/Dockerfile
    container_name: auth_service
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/auth_service
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 authuser

COPY --from=deps --chown=authuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=authuser:nodejs /app/dist ./dist
COPY --from=builder --chown=authuser:nodejs /app/prisma ./prisma
COPY --chown=authuser:nodejs package*.json ./

USER authuser
EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

## Testing Requirements

### Unit Tests
- Auth service methods
- Token generation/validation
- Password hashing/verification
- Input validation schemas
- Utility functions

### Integration Tests
- Registration flow
- Login flow
- OAuth flows
- Password reset flow
- Email verification flow
- Phone verification flow
- 2FA flow
- Token refresh flow

### E2E Tests
- Complete user journey (signup → verify → login → use app)
- Multi-project user flow
- Security scenarios (rate limiting, invalid tokens, etc.)

### Test Coverage Target
- Minimum 80% code coverage
- 100% coverage for security-critical functions

## Monitoring & Logging

### Logging Strategy
```typescript
Winston Logger with levels:
- error: Errors that need attention
- warn: Warning conditions
- info: Informational messages
- http: HTTP requests
- debug: Debug information

Log Format:
{
  timestamp: "2024-01-01T00:00:00Z",
  level: "info",
  message: "User logged in",
  userId: "uuid",
  projectId: "uuid",
  ip: "192.168.1.1",
  userAgent: "...",
  requestId: "uuid"
}
```

### Metrics to Track
- Request count per endpoint
- Response times
- Error rates
- Active users per project
- Login success/failure rates
- OAuth provider usage
- Token refresh rates
- Rate limit hits

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] CORS origins configured
- [ ] OAuth credentials configured
- [ ] Twilio account configured
- [ ] Telegram bot configured
- [ ] Email service configured
- [ ] Admin account created

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] Database connection working
- [ ] Redis connection working
- [ ] Email sending working
- [ ] SMS sending working
- [ ] OAuth flows working
- [ ] Monitoring active
- [ ] Logs being collected
- [ ] Backup strategy in place

## Documentation Requirements

### API Documentation
- Auto-generated Swagger/OpenAPI docs
- Available at /api/docs
- Include example requests/responses
- Authentication requirements clearly marked

### README.md
- Project overview
- Quick start guide
- Installation instructions
- Configuration guide
- API overview
- Contributing guidelines
- License information

### Additional Docs
- DEPLOYMENT.md: Deployment instructions
- SECURITY.md: Security best practices
- CONTRIBUTING.md: Contribution guidelines
- CHANGELOG.md: Version history

## Success Criteria

The project is complete when:

1. ✅ All authentication methods work (email/password, OAuth)
2. ✅ Email verification system functional
3. ✅ Phone verification (SMS + Telegram) functional
4. ✅ Password reset flow working
5. ✅ 2FA implementation working
6. ✅ Multi-tenant (project-based) system working
7. ✅ All security measures implemented
8. ✅ Rate limiting active
9. ✅ Comprehensive logging in place
10. ✅ API documentation complete
11. ✅ Docker setup working
12. ✅ Tests passing (80%+ coverage)
13. ✅ Production-ready deployment guide

## Additional Features (Nice to Have)

- [ ] Account linking (merge OAuth accounts)
- [ ] Session management UI
- [ ] IP whitelisting per project
- [ ] Webhook system for auth events
- [ ] Admin dashboard for project management
- [ ] Analytics dashboard
- [ ] Email templates customization per project
- [ ] Passwordless login (magic link)
- [ ] Biometric authentication support
- [ ] SAML/SSO support for enterprise
- [ ] User import/export tools
- [ ] GDPR compliance tools (data export, right to be forgotten)

## Notes

- Tüm response'lar tutarlı format kullanmalı (success, data, message)
- Error handling comprehensive olmalı (detaylı error codes)
- Logging her critical action için olmalı
- Security-first approach: her endpoint güvenli olmalı
- Performance: Database queries optimize edilmeli (indexler, caching)
- Scalability: Mikroservis mimarisine geçiş için hazır olmalı
- Code quality: ESLint + Prettier + TypeScript strict mode
- Git hooks: pre-commit linting, pre-push testing

---

Bu proje ile tüm gelecek projeleriniz için sağlam bir auth altyapısına sahip olacaksınız. Başarılar! 🚀
