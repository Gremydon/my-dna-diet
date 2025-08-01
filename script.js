// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAKmdmisEF2gwF5ml-O4ekqC3Z9mJHJboI",
  authDomain: "my-dna-diet.firebaseapp.com",
  databaseURL: "https://my-dna-diet.firebaseio.com",
  projectId: "my-dna-diet",
  storageBucket: "my-dna-diet.firebasestorage.app",
  messagingSenderId: "926809907771",
  appId: "1:926809907771:web:edffc26f9061274427b21e",
  measurementId: "G-TCBGR6DTNE"
};

// Global auth variable
let auth = null;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔥 Initializing Firebase...");
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  console.log("✅ Firebase initialized, auth object:", auth);

  // Auth State Listener
  console.log("👂 Setting up auth state listener...");
  auth.onAuthStateChanged((user) => {
    console.log("🔄 Auth state changed:", user ? "Logged in as " + user.email : "Not logged in");
    if (user) {
      console.log("✅ Showing app content");
      document.getElementById("loginSection").style.display = "none";
      document.getElementById("app-content").style.display = "block";
      selectPet("Mocha"); // default pet on login
    } else {
      console.log("❌ Showing login section");
      document.getElementById("loginSection").style.display = "block";
      document.getElementById("app-content").style.display = "none";
    }
  });
});

// Login Function
function login() {
  console.log("⚠️ Testing login click...");
  console.log("🔍 Firebase auth object:", auth);
  
  if (!auth) {
    console.log("❌ Auth not initialized yet");
    document.getElementById("loginError").textContent = "Please wait, authentication is initializing...";
    return;
  }
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  console.log("📧 Email:", email);
  console.log("🔑 Password length:", password.length);

  if (!email || !password) {
    console.log("❌ Missing email or password");
    document.getElementById("loginError").textContent = "Please enter both email and password";
    return;
  }

  console.log("🚀 Attempting Firebase login...");
  
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("✅ Login successful:", userCredential.user.email);
      document.getElementById("loginError").textContent = "";
    })
    .catch((error) => {
      console.log("❌ Login failed:", error.message);
      document.getElementById("loginError").textContent = error.message;
    });
}

let currentPet = "Mocha";

// Select Pet Function
function selectPet(petName) {
  currentPet = petName;

  const buttons = document.querySelectorAll(".pet-button");
  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.includes(petName)) {
      btn.classList.add("active");
    }
  });

  renderIntolerances();
}

// Render Intolerances Function
function renderIntolerances() {
  const shared = getSharedIntolerances();
  const unique = getUniqueIntolerances(currentPet);

  const sharedList = document.getElementById("sharedList");
  const uniqueList = document.getElementById("uniqueList");

  sharedList.innerHTML = "";
  uniqueList.innerHTML = "";

  shared.forEach((item) => {
    const div = document.createElement("div");
    div.className = "intolerance";
    div.textContent = item;
    sharedList.appendChild(div);
  });

  unique.forEach((item) => {
    const div = document.createElement("div");
    div.className = "intolerance";
    div.textContent = item;
    uniqueList.appendChild(div);
  });
}

// Static intolerance data for each profile (replace with dynamic later if needed)
const intolerances = {
  Don: ["Hydrochloric Acid", "Monosodium Citrate", "Whey Protein", "Sodium Benzoate"],
  Lora: ["Monopotassium Phosphate", "Whisky", "Gluten", "FD&C Red 40"],
  Mocha: ["Chicken Byproduct", "Corn", "Beef", "Soy"],
  Punkin: ["Salmon", "Lamb", "Barley", "Peanut Butter"]
};

// Get Shared Intolerances
function getSharedIntolerances() {
  const profiles = Object.keys(intolerances);
  if (profiles.length === 0) return [];

  return intolerances[profiles[0]].filter((item) =>
    profiles.every((name) => intolerances[name].includes(item))
  );
}

// Get Unique Intolerances for Current Pet
function getUniqueIntolerances(petName) {
  const shared = getSharedIntolerances();
  const all = intolerances[petName] || [];
  return all.filter((item) => !shared.includes(item));
}

// ===== SCANNER MODULE =====
let videoStream = null;
let currentCamera = 'environment'; // 'environment' for rear, 'user' for front
let isProcessing = false;

// Scanner Modal Management
function openScanModal() {
  document.getElementById("scanModal").style.display = "flex";
  resetScannerUI();
}

function closeScanModal() {
  stopCamera();
  document.getElementById("scanModal").style.display = "none";
  resetScannerUI();
}

function resetScannerUI() {
  document.getElementById("processingStatus").style.display = "none";
  document.getElementById("scanError").style.display = "none";
  document.getElementById("captureBtn").style.display = "none";
  document.getElementById("switchCameraBtn").style.display = "none";
  document.getElementById("startCameraBtn").style.display = "inline-block";
  document.getElementById("fileInput").value = "";
  isProcessing = false;
}

// Camera Management
function startCamera() {
  if (isProcessing) return;
  
  const video = document.getElementById("cameraFeed");
  const constraints = {
    video: {
      facingMode: { exact: currentCamera },
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  };

  // Try exact camera first, fallback to any camera
  navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      videoStream = stream;
      video.srcObject = stream;
      showCameraControls();
    })
    .catch(function(err) {
      console.log("Exact camera failed, trying fallback:", err);
      // Fallback to any available camera
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
          videoStream = stream;
          video.srcObject = stream;
          showCameraControls();
        })
        .catch(function(err) {
          console.error("Camera access error:", err);
          showError("Camera access denied. Please use file upload instead.");
        });
    });
}

function showCameraControls() {
  document.getElementById("startCameraBtn").style.display = "none";
  document.getElementById("captureBtn").style.display = "inline-block";
  document.getElementById("switchCameraBtn").style.display = "inline-block";
}

function switchCamera() {
  if (isProcessing) return;
  
  stopCamera();
  currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
  startCamera();
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  document.getElementById("cameraFeed").srcObject = null;
}

// Image Capture and Processing
function captureImage() {
  if (isProcessing) return;
  
  const video = document.getElementById("cameraFeed");
  if (!video.srcObject) {
    showError("Camera not started. Please start camera first.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);
  
  canvas.toBlob((blob) => {
    processImage(blob);
  }, "image/jpeg", 0.9);
}

function uploadImage(event) {
  if (isProcessing) return;
  
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError("Please select an image file.");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError("File too large. Please select an image under 10MB.");
      return;
    }
    
    processImage(file);
  }
}

// Modern Tesseract.js Processing
function processImage(imageBlob) {
  if (isProcessing) return;
  
  isProcessing = true;
  showProcessingStatus();
  hideError();

  // Configure Tesseract for better food label recognition
  const tesseractConfig = {
    logger: m => {
      console.log("Tesseract:", m);
      if (m.status === 'recognizing text') {
        updateProcessingStatus(`Processing... ${Math.round(m.progress * 100)}%`);
      }
    },
    lang: 'eng',
    oem: 3, // Default OCR Engine Mode
    psm: 6, // Assume uniform block of text
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.-()[]{}:;%' // Common food label characters
  };

  Tesseract.recognize(imageBlob, tesseractConfig)
    .then(({ data: { text } }) => {
      console.log("OCR Result:", text);
      
      if (!text || text.trim().length < 10) {
        throw new Error("Could not read enough text from image. Please try a clearer photo.");
      }
      
      // Clean up the text
      const cleanedText = cleanOCRText(text);
      document.getElementById("ingredientInput").value = cleanedText;
      scanIngredients(cleanedText);
      closeScanModal();
    })
    .catch((err) => {
      console.error("OCR error:", err);
      showError(err.message || "Could not read image. Please try again with a clearer photo.");
      isProcessing = false;
      hideProcessingStatus();
    });
}

// Text Processing Utilities
function cleanOCRText(text) {
  return text
    .replace(/\n+/g, ', ') // Replace newlines with commas
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s,.-]/g, '') // Remove special characters except common food label ones
    .trim();
}

function showProcessingStatus() {
  document.getElementById("processingStatus").style.display = "block";
}

function hideProcessingStatus() {
  document.getElementById("processingStatus").style.display = "none";
}

function updateProcessingStatus(message) {
  const statusDiv = document.getElementById("processingStatus");
  statusDiv.innerHTML = `<div style="color: #4b0082; font-weight: bold;">🔄 ${message}</div>`;
}

function showError(message) {
  const errorDiv = document.getElementById("scanError");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

function hideError() {
  document.getElementById("scanError").style.display = "none";
}

function scanIngredients(text) {
  const resultsContainer = document.getElementById("scanResults");
  resultsContainer.innerHTML = "";

  if (!text || text.trim().length === 0) {
    resultsContainer.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">No ingredients found to scan</div>';
    return;
  }

  // Improved ingredient parsing for OCR results
  const inputList = text
    .split(/[,.\n\r;:()\[\]]+/) // Split on common separators
    .map(item => item.trim())
    .filter(item => item.length > 1) // Remove single characters
    .map(item => item.toLowerCase());
  
  const petList = intolerances[currentPet].map(item => item.toLowerCase());
  const foundIntolerances = [];
  const otherIngredients = [];

  inputList.forEach(word => {
    if (word.length < 2) return; // skip junk

    const div = document.createElement("div");
    div.className = "intolerance";

    if (petList.includes(word)) {
      div.classList.add("level-3");
      div.textContent = word + " (Level 3)";
      foundIntolerances.push(word);
    } else {
      div.textContent = word;
      otherIngredients.push(word);
    }

    resultsContainer.appendChild(div);
  });

  // Add summary
  if (foundIntolerances.length > 0) {
    const summaryDiv = document.createElement("div");
    summaryDiv.style.cssText = "background-color: #ffcccc; color: red; padding: 10px; border-radius: 8px; margin-top: 10px; font-weight: bold;";
    summaryDiv.textContent = `⚠️ Found ${foundIntolerances.length} intolerance(s): ${foundIntolerances.join(', ')}`;
    resultsContainer.insertBefore(summaryDiv, resultsContainer.firstChild);
  } else {
    const summaryDiv = document.createElement("div");
    summaryDiv.style.cssText = "background-color: #d4edda; color: #155724; padding: 10px; border-radius: 8px; margin-top: 10px; font-weight: bold;";
    summaryDiv.textContent = "✅ No intolerances found in scanned ingredients";
    resultsContainer.insertBefore(summaryDiv, resultsContainer.firstChild);
  }
}

function clearInput() {
  document.getElementById("ingredientInput").value = "";
  document.getElementById("scanResults").innerHTML = "";
}

function exportCSV() {
  const items = intolerances[currentPet];
  const csvContent = "data:text/csv;charset=utf-8," + items.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", currentPet + "_intolerances.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function testFood() {
  alert("Food testing is coming soon! 🚧 This feature is under construction.");
}

function viewDiet() {
  alert("Diet recommendations coming soon! 🥦 This section is still in progress.");
}

function viewTerms() {
  document.getElementById("termsModal").style.display = "flex";
}

function closeTermsModal() {
  document.getElementById("termsModal").style.display = "none";
} 