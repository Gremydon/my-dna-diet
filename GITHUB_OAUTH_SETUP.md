# Firebase Authentication with GitHub Setup Guide

## 🔧 Step-by-Step Setup Instructions

### ⚠️ Important Note
**This app uses Firebase Authentication with GitHub as the OAuth provider.**  
You need to set up both a Firebase project AND a GitHub OAuth App, then connect them together.

---

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Add project" or "Create a project"
   - Enter project name: `My DNA Diet` (or your preferred name)
   - Click "Continue"
   - Disable Google Analytics (optional) or enable it if you want
   - Click "Create project"

3. **Wait for project creation** (takes a few seconds)

4. **Add a Web App**
   - Click the web icon (`</>`) or "Add app" → Web
   - Register app nickname: `My DNA Diet Web`
   - **Do NOT check "Also set up Firebase Hosting"** (unless you want to use it)
   - Click "Register app"

5. **Copy Your Firebase Configuration**
   - You'll see a code block with your Firebase config
   - It looks like this:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIza...",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123"
     };
     ```
   - **Copy this entire config** - you'll paste it in `script.js` next

---

## Step 2: Enable GitHub Authentication in Firebase

1. **Go to Authentication**
   - In Firebase Console, click "Authentication" in the left menu
   - Click "Get started" if you see it

2. **Enable GitHub Provider**
   - Click the "Sign-in method" tab
   - Find "GitHub" in the list and click it
   - Toggle "Enable" to ON
   - **Leave the fields empty for now** - we'll fill them in Step 3
   - Click "Save"

---

## Step 3: Create a GitHub OAuth App

1. **Go to GitHub Developer Settings**
   - Open: https://github.com/settings/developers
   - Or: GitHub → Your Profile → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"** button (top right)

3. **Fill in the application details:**
   - **Application name**: `My DNA Diet`
   - **Homepage URL**: `https://gremydon.github.io/My-DNA-Diet-LIVE/`
     - (Replace `gremydon` with your GitHub username if different)
     - (Replace `My-DNA-Diet-LIVE` with your repository name if different)
   - **Authorization callback URL**: 
     ```
     https://your-project-id.firebaseapp.com/__/auth/handler
     ```
     - ⚠️ **Important**: Replace `your-project-id` with your actual Firebase project ID
     - You can find your project ID in Firebase Console → Project Settings → General
     - Example: `https://my-dna-diet-12345.firebaseapp.com/__/auth/handler`

4. **Click "Register application"**

5. **Copy Your Credentials**
   - After registration, you'll see:
     - **Client ID** - Copy this
     - **Client Secret** - Click "Generate a new client secret" if needed, then copy it
   - ⚠️ **Important**: Keep these safe - you'll paste them in Firebase next

---

## Step 4: Add GitHub Credentials to Firebase

1. **Go back to Firebase Console**
   - Navigate to: Authentication → Sign-in method → GitHub

2. **Paste Your GitHub Credentials**
   - **Client ID**: Paste your GitHub OAuth App Client ID
   - **Client Secret**: Paste your GitHub OAuth App Client Secret
   - Click "Save"

3. **Verify it's enabled**
   - You should see a green checkmark or "Enabled" status

---

## Step 5: Add Firebase Config to Your Code

1. **Open `script.js`** in your project

2. **Find the Firebase configuration section** (around line 2-10):
   ```javascript
   const FIREBASE_CONFIG = {
     apiKey: "your-api-key-here",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

3. **Replace the placeholder values** with your actual Firebase config:
   ```javascript
   const FIREBASE_CONFIG = {
     apiKey: "AIzaSyC...",  // ← Your actual API key
     authDomain: "my-dna-diet-12345.firebaseapp.com",  // ← Your actual domain
     projectId: "my-dna-diet-12345",  // ← Your actual project ID
     storageBucket: "my-dna-diet-12345.appspot.com",  // ← Your actual storage bucket
     messagingSenderId: "123456789012",  // ← Your actual sender ID
     appId: "1:123456789012:web:abc123def456"  // ← Your actual app ID
   };
   ```

4. **Save the file**

---

## Step 6: Verify the Setup

1. **Check your configuration**
   - ✅ Firebase project created
   - ✅ GitHub provider enabled in Firebase
   - ✅ GitHub OAuth App created with Firebase callback URL
   - ✅ Client ID and Secret added to Firebase
   - ✅ Firebase config added to `script.js`

2. **Test the login**
   - Open your app in a browser (or refresh if already open)
   - Click "Login with GitHub" button
   - A popup should appear asking you to authorize the app
   - Click "Authorize" on GitHub
   - The popup should close and you should see your GitHub username/avatar in the app

---

## 📍 Where to Paste What

### In Firebase Console:
- **GitHub Client ID** → Authentication → Sign-in method → GitHub → Client ID field
- **GitHub Client Secret** → Authentication → Sign-in method → GitHub → Client Secret field

### In script.js:
- **Firebase Config** → Replace the `FIREBASE_CONFIG` object (lines 2-10) with your actual Firebase config

### NOT in script.js:
- ❌ Do NOT paste GitHub Client ID in script.js
- ❌ Do NOT paste GitHub Client Secret in script.js
- ✅ These go in Firebase Console only!

---

## 🛠️ Troubleshooting

### Common Issues:

1. **"Firebase is not configured"**
   - ✅ Check that you replaced all placeholder values in `FIREBASE_CONFIG`
   - ✅ Make sure you copied the entire config from Firebase Console
   - ✅ Verify there are no typos in the config values

2. **"Login failed: Invalid client"**
   - ✅ Verify your GitHub Client ID is correct in Firebase Console
   - ✅ Check that GitHub provider is enabled in Firebase
   - ✅ Make sure you saved the credentials in Firebase after pasting them

3. **"Login failed: Redirect URI mismatch"**
   - ✅ Check that your GitHub OAuth App callback URL matches exactly:
     ```
     https://your-project-id.firebaseapp.com/__/auth/handler
     ```
   - ✅ Make sure you're using your actual Firebase project ID
   - ✅ The URL must start with `https://` and end with `/__/auth/handler`

4. **"Popup was blocked"**
   - ✅ Allow popups for your site in browser settings
   - ✅ Try clicking "Login with GitHub" again

5. **"Login works but can't access GitHub API"**
   - ✅ Check that you added the `gist` scope in Firebase (it should be automatic)
   - ✅ Verify the access token is being stored (check browser console)

6. **"Firebase initialization error"**
   - ✅ Check browser console for specific error messages
   - ✅ Verify all Firebase config values are correct
   - ✅ Make sure Firebase scripts are loaded in `index.html` (they should be)

### Debug Mode:

Open browser console (F12) to see detailed logs:
- Firebase initialization status
- Authentication flow
- Error messages
- API calls

---

## 🔒 Security Notes

- ✅ **Client Secret is stored in Firebase** - Never put it in your code
- ✅ **Firebase handles OAuth securely** - No need to manage tokens manually
- ✅ **Access tokens are stored in sessionStorage** - Cleared when browser closes
- ✅ **GitHub scopes are minimal** - Only `gist` and `read:user` permissions

---

## 📝 Summary Checklist

- [ ] Created Firebase project
- [ ] Added web app to Firebase project
- [ ] Copied Firebase config
- [ ] Enabled GitHub provider in Firebase
- [ ] Created GitHub OAuth App
- [ ] Set GitHub callback URL to Firebase auth handler
- [ ] Copied GitHub Client ID and Secret
- [ ] Pasted Client ID and Secret in Firebase Console
- [ ] Pasted Firebase config in `script.js`
- [ ] Tested login flow
- [ ] Verified user can access app after login

---

**Need Help?** 
- Check browser console (F12) for detailed error messages
- Verify all URLs match exactly (no trailing slashes unless specified)
- Make sure popups are allowed for your site
