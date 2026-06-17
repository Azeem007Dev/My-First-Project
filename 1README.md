# Vote Ledger - Blockchain Voting System

A secure, transparent voting system built with Next.js, Firebase, and blockchain technology.

## 🚀 Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd vote-ledger
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

3. **Setup admin user:**
   ```bash
   npm run setup-admin
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📖 Detailed Setup

See [SETUP.md](./SETUP.md) for comprehensive setup instructions including:
- Firebase configuration
- Environment variables
- Admin user creation
- Security considerations

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup-admin` - Create admin user from environment variables
- `npm run test:firebase` - Test Firebase connection

## 🛡️ Security Features

- ✅ **No Demo Credentials** - All credentials are environment-based
- ✅ **Firebase Authentication** - Secure user authentication
- ✅ **Admin Privileges** - Role-based access control
- ✅ **Blockchain Integration** - Immutable voting records
- ✅ **Real-time Updates** - Live profile and voting data

## 🏗️ Architecture

- **Frontend**: Next.js 13 with TypeScript
- **Authentication**: Firebase Auth with custom tokens
- **Database**: Firestore with real-time updates
- **Admin SDK**: Server-side Firebase operations
- **UI**: Tailwind CSS with Radix UI components

## 📱 Features

- User registration and authentication
- Profile management with real-time updates
- Secure password change functionality
- Admin panel for election management
- Voting system with blockchain integration
- Results dashboard

## 🔒 Security Notes

- Admin credentials are stored in environment variables
- No hardcoded credentials in the frontend
- Firebase Security Rules protect data access
- All API routes use Firebase Admin SDK for verification

---

For detailed setup instructions, see [SETUP.md](./SETUP.md)
