# GitHub OAuth Setup Guide for My DNA Diet

## 🔧 Setup Instructions

### Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `My DNA Diet`
   - **Homepage URL**: `https://gremydon.github.io/my-dna-diet/` (or your domain)
   - **Authorization callback URL**: `https://gremydon.github.io/my-dna-diet/` (same as homepage)
4. Click "Register application"
5. Copy the **Client ID** (you'll need this)

### Step 2: Update Configuration

1. Open `script.js`
2. Find this line:
   ```javascript
   const GITHUB_CLIENT_ID = 'your_github_client_id_here';
   ```
3. Replace `your_github_client_id_here` with your actual Client ID

### Step 3: Security Note

⚠️ **Important**: The current implementation includes the client secret in the frontend code, which is not secure for production. For a production app, you should:

1. Create a backend server to handle the OAuth flow
2. Store the client secret on the server
3. Use the server to exchange the authorization code for an access token

### Step 4: Test the Integration

1. Open your app in a browser
2. Click "Login with GitHub"
3. Authorize the app on GitHub
4. You should be redirected back to your app with authentication

## 🔒 Privacy & Security

- **Data Storage**: User profiles are stored in private GitHub Gists
- **No Personal Data**: Only username, name, and avatar are collected
- **Local Fallback**: App works without login using localStorage
- **User Control**: Users can logout and delete their data anytime

## 🚀 Features Added

- ✅ GitHub OAuth authentication
- ✅ Cloud data synchronization
- ✅ Cross-device profile access
- ✅ Automatic data backup
- ✅ Privacy-first design (optional login)
- ✅ Local storage fallback

## 🛠️ Troubleshooting

### Common Issues:

1. **"Login failed"**: Check that your Client ID is correct
2. **"CORS error"**: Make sure your callback URL matches exactly
3. **"Data not syncing"**: Check browser console for API errors

### Debug Mode:

Open browser console (F12) to see detailed logs of the authentication and sync process.

## 📝 Next Steps

1. Set up your GitHub OAuth App
2. Update the Client ID in `script.js`
3. Test the login flow
4. Deploy to GitHub Pages
5. Testers can now save their intolerances with cloud sync!

---

**Need Help?** Check the browser console for detailed error messages and logs.
