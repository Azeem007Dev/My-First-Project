# Vote Ledger Setup Guide

## Environment Variables Setup

### 1. Create `.env.local` file

Copy the example environment file and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

### 2. Configure Firebase

Update `.env.local` with your Firebase project details:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id",...}

# Admin Credentials (Customize these)
ADMIN_CNIC=12345-1234567-1
ADMIN_EMAIL=admin@voteledger.com
ADMIN_PASSWORD=SecureAdmin123!
ADMIN_NAME=System Administrator
```

### 3. Setup Admin User

After configuring your environment variables, create the admin user:

```bash
npm run setup-admin
```

This will:
- ✅ Create an admin user in Firebase Auth
- ✅ Create admin profile in Firestore
- ✅ Set admin privileges

### 4. Start Development Server

```bash
npm run dev
```

## Security Notes

### 🔒 **Removed Demo Credentials**
- No more hardcoded demo credentials in the frontend
- All admin credentials are now environment-based
- Users must be properly registered through signup

### 🛡️ **Production Setup**
For production deployment:

1. **Remove admin credentials** from environment variables after setup
2. **Use strong passwords** (minimum 12 characters with special characters)
3. **Enable Firebase Security Rules** for Firestore
4. **Set up proper CI/CD** environment variable management

### 📝 **Creating Regular Users**
- Regular users must sign up through the `/signup` page
- No demo user credentials are provided
- All users are authenticated through Firebase Auth

## Troubleshooting

### Firebase Admin SDK Issues
If you see "Firebase Admin SDK not configured":
1. Check your `FIREBASE_SERVICE_ACCOUNT` JSON in `.env.local`
2. Ensure the JSON is properly formatted (no line breaks)
3. Verify your Firebase project has Admin SDK enabled

### Admin Setup Issues
If admin setup fails:
1. Check all required environment variables are set
2. Ensure Firebase Admin SDK is working: `npm run test:firebase`
3. Verify your Firebase project has Authentication enabled

### Login Issues
If you can't log in:
1. Make sure you ran `npm run setup-admin` first
2. Check your admin credentials in `.env.local`
3. Verify Firebase Authentication is enabled in your project
