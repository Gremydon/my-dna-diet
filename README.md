# My DNA Diet 🧬

A privacy-focused web application for scanning food labels and identifying potential dietary intolerances based on user profiles.

## 🌟 Features

- **📸 Camera Scanning** - Scan food labels directly with your device camera
- **🧬 Intolerance Detection** - Check ingredients against personalized intolerance lists
- **👥 Multi-Profile Support** - Manage different profiles (Don, Lora, Mocha, Punkin) or remove them for personal use
- **📤 Personal Intolerance Upload** - Upload your own intolerance data via JSON or manual entry
- **🗑️ Profile Management** - Remove example profiles to create a fully personalized experience
- **📁 CSV Export** - Export intolerance lists for offline reference
- **🔒 Privacy-First** - No login required, all processing happens locally
- **📱 Mobile-Friendly** - Responsive design works on all devices

## 🚀 Live Demo

Visit the live application: [My DNA Diet](https://gremydon.github.io/my-dna-diet/)

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **OCR**: Tesseract.js for text recognition
- **Camera API**: WebRTC getUserMedia
- **Deployment**: GitHub Pages

## 📋 How to Use

1. **Select a Profile** - Choose from Don, Lora, Mocha, or Punkin
2. **Upload Personal Intolerances** - Click "Upload Intolerances" to add your own data
3. **Scan or Input** - Use camera to scan labels or manually type ingredients
4. **Review Results** - See which ingredients match your intolerance list
5. **Export Data** - Download your intolerance list as CSV or JSON

### 📤 Adding Your Personal Intolerances

**Option 1: Upload JSON File**
- Download the sample template: `sample-intolerances-template.json`
- Edit it with your personal intolerance data
- Upload via the "Upload Intolerances" button

**Option 2: Manual Entry**
- Use the form in the upload modal to add items one by one
- Specify food item, category, and severity level (1-3)
- Save your changes to make them available in your profile

### 🗑️ Profile Management

**For Beta Testers & Personal Use:**
- **Remove Example Profiles**: Click the ❌ button next to Don, Lora, Mocha, or Punkin to remove them
- **Fully Personalized Experience**: Once all example profiles are removed, the app focuses entirely on your personal data
- **Clean Interface**: No more example data cluttering your personal intolerance scanning experience
- **Easy Restoration**: Simply refresh the page to restore example profiles if needed

**Perfect for:**
- Personal dietary management
- Beta testing with real users
- Creating family member profiles
- Professional nutrition consultations

## 🔧 Development

### Local Setup
1. Clone the repository
2. Open `index.html` in a web browser
3. No build process required - pure HTML/CSS/JS

### File Structure
```
My-DNA-Diet-LIVE/
├── index.html          # Main application
├── script.js           # Core functionality
├── style.css           # Styling
├── *.json              # Profile data files
└── README.md           # This file
```

## 📊 Data Files

- `don-data.json` - Don's intolerance profile
- `lora-data.json` - Lora's intolerance profile  
- `mocha-data.json` - Mocha's intolerance profile
- `punkin-data.json` - Punkin's intolerance profile

---

## 📜 Terms of Service & Privacy Policy

This application is provided by **Ember Worldwide Productions LLC** and is subject to the following terms:

- **Use at Your Own Risk:** This tool is not intended to diagnose, treat, or replace professional medical advice.
- **Privacy-Focused:** The app does not collect or store personal data. Camera access is used only for local ingredient scanning.
- **No Login Required:** All processing happens on the client side — no data is transmitted or stored externally.
- **Intellectual Property:** All content and code are property of Ember Worldwide Productions LLC. Unauthorized redistribution is prohibited.
- **Changes May Occur:** App features and terms are subject to change without notice.

➡️ View the full Terms of Service & Privacy Policy in the app by clicking the **"Terms & Privacy"** button in the footer.

For legal inquiries, contact: [contact@emberworldwide.com](mailto:contact@emberworldwide.com)

---

## 📄 License

© 2025 EmberWorldWide Productions LLC. All rights reserved. My DNA Diet™. 