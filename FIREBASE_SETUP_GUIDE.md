# 🔥 Firebase Setup Guide

## 🚨 **Current Issue**
The error `initializeFirebaseAdmin is not a function` occurs because Firebase Admin SDK is not properly configured.

## ✅ **Quick Fix (Development)**

### **Option 1: Use Firebase Emulator (Recommended for Development)**

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Emulator:**
   ```bash
   firebase init emulators
   ```

4. **Start Firebase Emulator:**
   ```bash
   firebase emulators:start
   ```

### **Option 2: Configure Firebase Admin SDK**

1. **Create `.env.local` file in project root:**
   ```env
   # Firebase Client Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Firebase Admin SDK (choose one)
   # Option A: Service Account JSON (recommended)
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id",...}
   
   # Option B: Service Account File Path
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   ```

2. **Get Firebase Service Account:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Copy the entire JSON content to `FIREBASE_SERVICE_ACCOUNT` in `.env.local`

## 🔧 **Temporary Workaround (For Testing)**

If you want to test the voting system without proper Firebase Admin setup:

1. **Use the test endpoint** (no authentication required):
   ```bash
   curl http://localhost:3001/api/test/elections
   ```

2. **Check browser console** for detailed error messages

3. **Use debug buttons** on the vote page to troubleshoot

## 🎯 **Expected Results After Setup**

After proper Firebase configuration:

1. **Admin Dashboard** (`/admin`) should work
2. **Vote Page** (`/vote`) should show active elections
3. **API endpoints** should respond correctly
4. **No more "initializeFirebaseAdmin is not a function" errors**

## 🚀 **Quick Test Commands**

```bash
# Test elections without auth
curl http://localhost:3001/api/test/elections

# Check if server is running
curl http://localhost:3001/api/health

# Test with authentication (requires proper setup)
# Go to /vote page and use debug buttons
```

## 📋 **Troubleshooting Checklist**

- [ ] Firebase project exists and is active
- [ ] `.env.local` file exists with correct configuration
- [ ] Firebase Admin SDK service account is configured
- [ ] Server is running on correct port (3001)
- [ ] No firewall blocking Firebase connections
- [ ] Environment variables are loaded correctly

## 🔍 **Debug Information**

The vote page now includes debug tools:
- **Test Elections** button - tests without authentication
- **Debug Elections** button - tests with authentication
- **Log State** button - shows current state
- **Console logs** - detailed error information

## 📞 **Need Help?**

1. Check browser console for error messages
2. Use debug buttons on vote page
3. Verify Firebase project configuration
4. Test with Firebase emulator first
5. Check network tab for API request/response details
