// Firebase configuration removed - no authentication required

// Safe localStorage wrapper to prevent interference with other apps
const safeStorage = {
  // Only allow operations on keys that start with our app prefix
  _isValidKey: function(key) {
    return key && typeof key === 'string' && key.startsWith('myDNADiet_');
  },
  
  setItem: function(key, value) {
    try {
      if (this._isValidKey(key) && typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.warn("localStorage not available:", error);
    }
    return false;
  },
  
  getItem: function(key) {
    try {
      if (this._isValidKey(key) && typeof localStorage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.warn("localStorage not available:", error);
    }
    return null;
  },
  
  removeItem: function(key) {
    try {
      if (this._isValidKey(key) && typeof localStorage !== 'undefined' && localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.warn("localStorage not available:", error);
    }
    return false;
  },
  
  // Get all keys that belong to our app
  getAppKeys: function() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('myDNADiet_')) {
            keys.push(key);
          }
        }
        return keys;
      }
    } catch (error) {
      console.warn("localStorage not available:", error);
    }
    return [];
  }
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
  console.log("✅ App initialized - no authentication required");
  console.log("🔒 Using safe localStorage wrapper to prevent interference with other apps");
  
  // Load intolerance data from JSON files
  await loadIntoleranceData();
  
  // App content is already visible by default
  selectPet("Mocha"); // default pet
  
  // Setup upload modal event listeners
  setupUploadModalListeners();
  
  // Log app storage keys for debugging
  const appKeys = safeStorage.getAppKeys();
  console.log("📱 App storage keys:", appKeys);
});

// Login function removed - no authentication required

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

  // If user profile is selected and it's empty, show helpful message
  if (petName === "My Profile" && userIntolerances.length === 0) {
    document.getElementById("scanResults").innerHTML = `
      <div class="section" style="text-align: center; padding: 40px;">
        <h3>👤 My Profile</h3>
        <p style="font-size: 18px; margin: 20px 0;">Your personal intolerance profile is empty.</p>
        <p style="margin: 20px 0;">Add your intolerances to start scanning food labels!</p>
        <button onclick="openUploadModal()" style="background-color: #20c997; color: white; border: none; border-radius: 8px; padding: 15px 30px; font-size: 18px; cursor: pointer; margin-top: 20px;">
          📤 Add My Intolerances
        </button>
      </div>
    `;
    return;
  }

  renderIntolerances();
}

// Remove Profile Function
function removeProfile(profileName) {
  if (confirm(`Are you sure you want to remove ${profileName}'s profile? This will also remove their data from the app.`)) {
    // Remove from intolerances object
    delete intolerances[profileName];
    
    // Note: We don't remove from localStorage to avoid interfering with other apps
    // The profile data is only stored in memory during the session
    
    // If this was the current pet, switch to a remaining profile
    if (currentPet === profileName) {
      const remainingProfiles = Object.keys(intolerances);
      if (remainingProfiles.length > 0) {
        selectPet(remainingProfiles[0]);
      } else {
        // No profiles left, show message
        currentPet = null;
        document.getElementById("scanResults").innerHTML = 
          '<div class="section"><h3>No Profiles Available</h3><p>Please upload your personal intolerances to get started!</p></div>';
        document.getElementById("sharedIntolerances").style.display = "none";
        document.getElementById("uniqueIntolerances").style.display = "none";
      }
    }
    
    // Remove the profile element from the DOM
    const profileElements = document.querySelectorAll('.profile-item');
    profileElements.forEach(element => {
      if (element.querySelector('.pet-button').textContent.includes(profileName)) {
        element.remove();
      }
    });
    
    // If all example profiles are removed, automatically show user profile button
    const remainingExampleProfiles = document.querySelectorAll('.profile-item');
    if (remainingExampleProfiles.length === 0 && userIntolerances.length > 0) {
      showUserProfileButton();
      selectPet("My Profile");
      
      // Show celebration message
      setTimeout(() => {
        document.getElementById("scanResults").innerHTML = `
          <div class="section" style="text-align: center; padding: 40px; background: linear-gradient(135deg, #e8f5e8, #f0f8ff);">
            <h3>🎉 Congratulations!</h3>
            <p style="font-size: 18px; margin: 20px 0;">You've created a truly personalized experience!</p>
            <p style="margin: 20px 0;">The app now focuses entirely on your personal intolerance data.</p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 2px solid #4caf50;">
              <h4>🚀 Ready to Use:</h4>
              <ul style="text-align: left; max-width: 400px; margin: 10px auto;">
                <li>📸 Scan food labels with your camera</li>
                <li>🧬 Test ingredients manually</li>
                <li>📋 Analyze diet plans</li>
                <li>📁 Export your data</li>
              </ul>
            </div>
          </div>
        `;
      }, 500);
    }
    
    // Refresh the display
    renderIntolerances();
    
    console.log(`✅ Removed profile: ${profileName}`);
  }
}

// Render Intolerances Function
function renderIntolerances() {
  // Check if there are any profiles left
  const availableProfiles = Object.keys(intolerances);
  
  if (availableProfiles.length === 0) {
    // No profiles available, show helpful message
    document.getElementById("sharedIntolerances").style.display = "none";
    document.getElementById("uniqueIntolerances").style.display = "none";
    document.getElementById("scanResults").innerHTML = `
      <div class="section" style="text-align: center; padding: 40px;">
        <h3>🎯 Welcome to My DNA Diet!</h3>
        <p style="font-size: 18px; margin: 20px 0;">This is your personalized food intolerance scanner.</p>
        <p style="margin: 20px 0;">To get started:</p>
        <ol style="text-align: left; max-width: 400px; margin: 20px auto;">
          <li>Click <strong>"📤 Upload Intolerances"</strong> to add your personal data</li>
          <li>Use the camera scanner to check food labels</li>
          <li>Test ingredients manually for quick checks</li>
        </ol>
        <button onclick="openUploadModal()" style="background-color: #20c997; color: white; border: none; border-radius: 8px; padding: 15px 30px; font-size: 18px; cursor: pointer; margin-top: 20px;">
          🚀 Get Started - Upload Your Intolerances
        </button>
      </div>
    `;
    return;
  }
  
  // Show the intolerance sections
  document.getElementById("sharedIntolerances").style.display = "block";
  document.getElementById("uniqueIntolerances").style.display = "block";
  
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

// Dynamic intolerance data loaded from JSON files
let intolerances = {
  Don: [],
  Lora: [],
  Mocha: [],
  Punkin: []
};

// Load intolerance data from JSON files
async function loadIntoleranceData() {
  try {
    const [donData, loraData, mochaData, punkinData] = await Promise.all([
      fetch('don-data.json').then(res => res.json()),
      fetch('lora-data.json').then(res => res.json()),
      fetch('mocha-data.json').then(res => res.json()),
      fetch('punkin-data.json').then(res => res.json())
    ]);

    // Extract item names from the intolerance arrays
    intolerances.Don = donData.intolerances.map(item => item.item);
    intolerances.Lora = loraData.intolerances.map(item => item.item);
    intolerances.Mocha = mochaData.intolerances.map(item => item.item);
    intolerances.Punkin = punkinData.intolerances.map(item => item.item);

    console.log("✅ Intolerance data loaded successfully");
    console.log("Don intolerances:", intolerances.Don.length, "items");
    console.log("Lora intolerances:", intolerances.Lora.length, "items");
    console.log("Mocha intolerances:", intolerances.Mocha.length, "items");
    console.log("Punkin intolerances:", intolerances.Punkin.length, "items");
  } catch (error) {
    console.error("❌ Error loading intolerance data:", error);
    // Fallback to static data if JSON loading fails
    intolerances = {
      Don: ["Hydrochloric Acid", "Monosodium Citrate", "Whey Protein", "Sodium Benzoate"],
      Lora: ["Monopotassium Phosphate", "Whisky", "Gluten", "FD&C Red 40"],
      Mocha: ["Chicken Byproduct", "Corn", "Beef", "Soy"],
      Punkin: ["Salmon", "Lamb", "Barley", "Peanut Butter"]
    };
  }
}

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
let currentFacingMode = "environment"; // 'environment' for rear, 'user' for front
let isProcessing = false;
let capturedImageBlob = null; // Store captured image for preview

// Scanner Modal Management
function openScanModal() {
  document.getElementById("scannerModule").style.display = "flex";
  resetScannerUI();
  setupScannerEventListeners();
}

function closeScanModal() {
  stopCamera();
  document.getElementById("scannerModule").style.display = "none";
  resetScannerUI();
}

// Toggle scanner size between normal and compact
function toggleScannerSize() {
  const modalContent = document.getElementById("scannerModalContent");
  const minimizeBtn = document.getElementById("minimizeScanner");
  const isMinimized = modalContent.classList.contains("minimized");
  
  if (isMinimized) {
    // Expand to normal size
    modalContent.classList.remove("minimized");
    modalContent.style.maxWidth = "600px";
    modalContent.style.maxHeight = "80vh";
    minimizeBtn.textContent = "📱";
    minimizeBtn.title = "Minimize";
  } else {
    // Minimize to compact size
    modalContent.classList.add("minimized");
    modalContent.style.maxWidth = "400px";
    modalContent.style.maxHeight = "60vh";
    minimizeBtn.textContent = "📺";
    minimizeBtn.title = "Expand";
  }
}

function setupScannerEventListeners() {
  // Setup event listeners for the new modal structure
  document.getElementById("startCamera").addEventListener("click", () => startCamera(currentFacingMode));
  document.getElementById("flipCameraBtn").addEventListener("click", () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    startCamera(currentFacingMode); // Pass the new facing mode
  });
  document.getElementById("capturePhoto").addEventListener("click", captureImage);
  document.getElementById("retakePhoto").addEventListener("click", retakePhoto);
  document.getElementById("processPhoto").addEventListener("click", processCapturedImage);
  document.getElementById("fileInput").addEventListener("change", uploadImage);
  document.getElementById("closeScanner").addEventListener("click", closeScanModal);
  
  // Add minimize functionality
  document.getElementById("minimizeScanner").addEventListener("click", toggleScannerSize);
}

function resetScannerUI() {
  document.getElementById("scanStatus").innerHTML = "";
  document.getElementById("capturePhoto").style.display = "none";
  document.getElementById("retakePhoto").style.display = "none";
  document.getElementById("processPhoto").style.display = "none";
  document.getElementById("startCamera").style.display = "inline-block";
  document.getElementById("fileInput").value = "";
  document.getElementById("video").style.display = "block";
  document.getElementById("canvas").style.display = "none";
  document.getElementById("photoPreview").style.display = "none";
  isProcessing = false;
  capturedImageBlob = null;
}

// Camera Management
function startCamera(facingMode = currentFacingMode) {
  if (isProcessing) return;
  
  currentFacingMode = facingMode;
  const video = document.getElementById("video");
  const constraints = {
    video: {
      facingMode: { exact: facingMode },
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
  document.getElementById("startCamera").style.display = "none";
  document.getElementById("capturePhoto").style.display = "inline-block";
  updateScanStatus("📷 Camera ready - Click 'Capture Photo' to take a picture");
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  document.getElementById("video").srcObject = null;
}

// Image Capture and Processing
function captureImage() {
  if (isProcessing) return;
  
  const video = document.getElementById("video");
  if (!video.srcObject) {
    showError("Camera not started. Please start camera first.");
    return;
  }

  updateScanStatus("📸 Capturing photo...");
  
  const canvas = document.getElementById("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);
  
  // Apply image enhancement for better OCR
  const enhancedCanvas = enhanceImageForOCR(canvas);
  
  enhancedCanvas.toBlob((blob) => {
    capturedImageBlob = blob;
    showPhotoPreview(enhancedCanvas);
  }, "image/jpeg", 0.9);
}

function showPhotoPreview(canvas) {
  const video = document.getElementById("video");
  const preview = document.getElementById("photoPreview");
  
  // Hide video, show preview
  video.style.display = "none";
  preview.style.display = "block";
  
  // Convert canvas to data URL and set as image source
  const dataURL = canvas.toDataURL("image/jpeg", 0.9);
  preview.src = dataURL;
  
  // Show retake and process buttons
  document.getElementById("capturePhoto").style.display = "none";
  document.getElementById("retakePhoto").style.display = "inline-block";
  document.getElementById("processPhoto").style.display = "inline-block";
  
  updateScanStatus("📸 Photo captured! Click 'Process Photo' to analyze or 'Retake' to try again");
}

function retakePhoto() {
  const video = document.getElementById("video");
  const preview = document.getElementById("photoPreview");
  
  // Show video, hide preview
  video.style.display = "block";
  preview.style.display = "none";
  
  // Show capture button, hide retake/process
  document.getElementById("capturePhoto").style.display = "inline-block";
  document.getElementById("retakePhoto").style.display = "none";
  document.getElementById("processPhoto").style.display = "none";
  
  capturedImageBlob = null;
}

function processCapturedImage() {
  if (capturedImageBlob) {
    processImage(capturedImageBlob);
  }
}

// Image Enhancement for Better OCR
function enhanceImageForOCR(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Apply contrast enhancement
  const contrast = 1.5; // Increase contrast
  const brightness = 10; // Slight brightness boost
  
  for (let i = 0; i < data.length; i += 4) {
    // Apply contrast and brightness to each color channel
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));     // Red
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness)); // Green
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness)); // Blue
  }
  
  // Create new canvas with enhanced image
  const enhancedCanvas = document.createElement("canvas");
  enhancedCanvas.width = canvas.width;
  enhancedCanvas.height = canvas.height;
  const enhancedCtx = enhancedCanvas.getContext("2d");
  enhancedCtx.putImageData(imageData, 0, 0);
  
  return enhancedCanvas;
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
      console.log("Raw OCR Result:", text);
      
      if (!text || text.trim().length < 5) {
        throw new Error("Could not read enough text from image. Please try a clearer photo.");
      }
      
      // Clean up the text with improved filtering
      const cleanedText = cleanOCRText(text);
      console.log("Cleaned OCR Result:", cleanedText);
      
      if (cleanedText.trim().length < 5) {
        throw new Error("Text too short after cleaning. Please try a clearer photo.");
      }
      
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
    // Convert to lowercase for better matching
    .toLowerCase()
    // Replace various line breaks and separators with commas
    .replace(/[\n\r\t]+/g, ', ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove common OCR artifacts and unwanted characters (less aggressive)
    .replace(/[^\w\s.,()&-]/g, '')
    // Remove single characters that are likely OCR errors
    .replace(/\b[a-z]\b/g, '')
    // Remove multiple commas
    .replace(/,+/g, ',')
    // Remove leading/trailing commas and spaces
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    // Final trim
    .trim();
}

function showProcessingStatus() {
  document.getElementById("scanStatus").innerHTML = `<div style="color: #4b0082; font-weight: bold;">🔄 Processing image...</div><div style="font-size: 12px; color: #666;">This may take a few seconds</div>`;
}

function hideProcessingStatus() {
  document.getElementById("scanStatus").innerHTML = "";
}

function updateProcessingStatus(message) {
  const statusDiv = document.getElementById("scanStatus");
  statusDiv.innerHTML = `<div style="color: #4b0082; font-weight: bold;">🔄 ${message}</div>`;
}

function updateScanStatus(message) {
  const statusDiv = document.getElementById("scanStatus");
  statusDiv.innerHTML = `<div style="color: #333; font-weight: bold;">${message}</div>`;
}

function showError(message) {
  const statusDiv = document.getElementById("scanStatus");
  statusDiv.innerHTML = `<div style="color: red; margin: 10px 0; padding: 10px; background-color: #ffe6e6; border-radius: 8px;">${message}</div>`;
}

function hideError() {
  document.getElementById("scanStatus").innerHTML = "";
}

function scanIngredients(text) {
  const resultsContainer = document.getElementById("scanResults");
  resultsContainer.innerHTML = "";

  if (!text || text.trim().length === 0) {
    resultsContainer.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">No ingredients found to scan</div>';
    return;
  }

  // Improved ingredient parsing for OCR results (text is already lowercase)
  const inputList = text
    .split(/[,.\n\r;:()\[\]]+/) // Split on common separators
    .map(item => item.trim())
    .filter(item => item.length > 2) // Remove very short items (likely OCR errors)
    .filter(item => /^[a-z\s]+$/.test(item)); // Only allow letters and spaces
  
  const petList = intolerances[currentPet].map(item => item.toLowerCase());
  const foundIntolerances = [];
  const otherIngredients = [];

  // Limit results to prevent UI overflow
  const maxResults = 50;
  let resultCount = 0;

  inputList.forEach(word => {
    if (resultCount >= maxResults) return;
    if (word.length < 3) return; // skip very short words

    const div = document.createElement("div");
    div.className = "intolerance";
    div.style.cssText = "margin: 2px 0; padding: 4px 8px; border-radius: 4px; font-size: 14px;";

    if (petList.includes(word)) {
      div.style.backgroundColor = "#ffcccc";
      div.style.color = "red";
      div.style.fontWeight = "bold";
      div.textContent = `⚠️ ${word} (Level 3)`;
      foundIntolerances.push(word);
    } else {
      div.style.backgroundColor = "#f8f9fa";
      div.style.color = "#666";
      div.textContent = word;
      otherIngredients.push(word);
    }

    resultsContainer.appendChild(div);
    resultCount++;
  });

  // Add summary with better layout
  if (foundIntolerances.length > 0) {
    const summaryDiv = document.createElement("div");
    summaryDiv.style.cssText = "background-color: #ffcccc; color: red; padding: 15px; border-radius: 8px; margin: 15px 0; font-weight: bold; border-left: 4px solid #dc3545;";
    summaryDiv.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 5px;">⚠️ Found ${foundIntolerances.length} intolerance(s)</div>
      <div style="font-size: 14px; font-weight: normal;">${foundIntolerances.join(', ')}</div>
    `;
    resultsContainer.insertBefore(summaryDiv, resultsContainer.firstChild);
  } else {
    const summaryDiv = document.createElement("div");
    summaryDiv.style.cssText = "background-color: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 15px 0; font-weight: bold; border-left: 4px solid #28a745;";
    summaryDiv.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 5px;">✅ No intolerances found</div>
      <div style="font-size: 14px; font-weight: normal;">Scanned ${otherIngredients.length} ingredients</div>
    `;
    resultsContainer.insertBefore(summaryDiv, resultsContainer.firstChild);
  }

  // Add overflow warning if needed
  if (inputList.length > maxResults) {
    const overflowDiv = document.createElement("div");
    overflowDiv.style.cssText = "color: #666; font-size: 12px; text-align: center; padding: 10px; font-style: italic;";
    overflowDiv.textContent = `Showing first ${maxResults} results (${inputList.length} total found)`;
    resultsContainer.appendChild(overflowDiv);
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
  const input = document.getElementById("testFoodInput").value;
  const resultDiv = document.getElementById("testFoodResults");

  if (!input.trim()) {
    resultDiv.innerHTML = "<p>Please enter some ingredients first.</p>";
    return;
  }

  const ingredients = input
    .toLowerCase()
    .split(/[\n,]+/) // split on newlines or commas
    .map(i => i.trim());

  // Get the intolerance list for the current pet
  const intoleranceList = intolerances[currentPet] || [];
  
  // Normalize the intolerance list
  const lowerCaseIntolerances = intoleranceList.map(i => i.toLowerCase());

  const flagged = ingredients.filter(ingredient =>
    lowerCaseIntolerances.some(intolerantItem => ingredient.includes(intolerantItem))
  );

  if (flagged.length > 0) {
    resultDiv.innerHTML = `
      <p>⚠️ The following ingredients may be problematic for <strong>${currentPet}</strong>:</p>
      <ul>${flagged.map(i => `<li style="color: red;">${i}</li>`).join("")}</ul>
    `;
  } else {
    resultDiv.innerHTML = `<p style="color: green;">✅ No known intolerances found for <strong>${currentPet}</strong>.</p>`;
  }
}

function viewDiet() {
  const fileInput = document.getElementById("dietPlanUpload");
  const resultDiv = document.getElementById("dietPlanResults");

  const file = fileInput.files[0];
  if (!file) {
    resultDiv.innerHTML = "<p>Please select a text file first.</p>";
    return;
  }

  // Lock in current profile immediately
  const currentProfile = currentPet;
  const intoleranceList = intolerances[currentProfile] || [];
  const lowerCaseIntolerances = intoleranceList.map(i => i.toLowerCase());

  const reader = new FileReader();
  reader.onload = function (e) {
    const contents = e.target.result.toLowerCase();
    const ingredients = contents.split(/[\n,]+/).map(line => line.trim()).filter(Boolean);

    const flagged = ingredients.filter(ingredient =>
      lowerCaseIntolerances.some(intolerantItem => ingredient.includes(intolerantItem))
    );

    if (flagged.length > 0) {
      resultDiv.innerHTML = `
        <p>⚠️ The following ingredients in the uploaded diet plan may be problematic for <strong>${currentProfile}</strong>:</p>
        <ul>${flagged.map(i => `<li style="color: red;">${i}</li>`).join("")}</ul>
      `;
    } else {
      resultDiv.innerHTML = `<p style="color: green;">✅ No known intolerances found for <strong>${currentProfile}</strong>.</p>`;
    }
  };

  reader.readAsText(file);
}

function viewTerms() {
  document.getElementById("termsModal").style.display = "flex";
}

function closeTermsModal() {
  document.getElementById("termsModal").style.display = "none";
}

// ===== UPLOAD INTOLERANCES MODULE =====

let userIntolerances = [];
let currentProfileName = "My Profile";

// Setup upload modal event listeners
function setupUploadModalListeners() {
  document.getElementById("closeUpload").addEventListener("click", closeUploadModal);
}

// Open upload modal
function openUploadModal() {
  document.getElementById("uploadModal").style.display = "flex";
  loadCurrentIntolerances();
}

// Close upload modal
function closeUploadModal() {
  document.getElementById("uploadModal").style.display = "none";
}

// Load current intolerances into the modal
function loadCurrentIntolerances() {
  const container = document.getElementById("currentIntolerances");
  container.innerHTML = "";
  
  if (userIntolerances.length === 0) {
    container.innerHTML = "<p style='text-align: center; color: #666;'>No intolerances added yet. Use the form above to add items.</p>";
    return;
  }
  
  userIntolerances.forEach((item, index) => {
    const div = document.createElement("div");
    div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: white; border-radius: 4px; border: 1px solid #ddd;";
    
    const levelColor = item.level === 3 ? "#ffcccc" : item.level === 2 ? "#fff3cd" : "#d4edda";
    const levelText = item.level === 3 ? "Severe" : item.level === 2 ? "Moderate" : "Mild";
    
    div.innerHTML = `
      <span style="font-weight: bold;">${item.item}</span>
      <span style="color: #666;">${item.category}</span>
      <span style="background: ${levelColor}; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${levelText}</span>
      <button onclick="removeIntoleranceItem(${index})" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">❌</button>
    `;
    
    container.appendChild(div);
  });
}

// Add intolerance item from form
function addIntoleranceItem() {
  const item = document.getElementById("itemInput").value.trim();
  const category = document.getElementById("categoryInput").value;
  const level = parseInt(document.getElementById("levelInput").value);
  
  if (!item) {
    alert("Please enter a food item name");
    return;
  }
  
  // Check if item already exists
  if (userIntolerances.some(existing => existing.item.toLowerCase() === item.toLowerCase())) {
    alert("This item is already in your list");
    return;
  }
  
  userIntolerances.push({ item, category, level });
  
  // Clear form
  document.getElementById("itemInput").value = "";
  document.getElementById("categoryInput").value = "Protein";
  document.getElementById("levelInput").value = "1";
  
  // Refresh display
  loadCurrentIntolerances();
  
  // Auto-save to localStorage
  autoSaveIntolerances();
}

// Remove intolerance item
function removeIntoleranceItem(index) {
  userIntolerances.splice(index, 1);
  loadCurrentIntolerances();
}

// Process uploaded file based on type
function processUploadedFile() {
  const fileInput = document.getElementById("fileUpload");
  const file = fileInput.files[0];
  const statusDiv = document.getElementById("uploadStatus");
  
  if (!file) {
    showUploadStatus("Please select a file", "error");
    return;
  }
  
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  showUploadStatus("Processing file...", "info");
  
  // Determine file type and process accordingly
  if (fileName.endsWith('.json')) {
    processJSONFile(file);
  } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    processTextFile(file);
  } else if (fileName.endsWith('.docx')) {
    processDocxFile(file);
  } else if (fileName.endsWith('.pdf')) {
    processPdfFile(file);
  } else if (fileType.startsWith('image/')) {
    processImageFile(file);
  } else {
    showUploadStatus("Sorry! That file type isn't supported yet — try using a text, JSON, or image file.", "error");
  }
}

// Show upload status with styling
function showUploadStatus(message, type = "info") {
  const statusDiv = document.getElementById("uploadStatus");
  const colors = {
    info: "#17a2b8",
    success: "#28a745", 
    error: "#dc3545",
    warning: "#ffc107"
  };
  
  statusDiv.style.display = "block";
  statusDiv.style.backgroundColor = colors[type];
  statusDiv.style.color = "white";
  statusDiv.style.padding = "10px";
  statusDiv.style.borderRadius = "6px";
  statusDiv.textContent = message;
  
  // Auto-hide success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 5000);
  }
}

// Process JSON files
function processJSONFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.intolerances || !Array.isArray(data.intolerances)) {
        showUploadStatus("Invalid JSON format. Please use the format shown in the example.", "error");
        return;
      }
      
      // Validate each intolerance item
      const validIntolerances = data.intolerances.filter(item => 
        item.item && item.category && item.level && 
        [1, 2, 3].includes(item.level)
      );
      
      if (validIntolerances.length === 0) {
        showUploadStatus("No valid intolerance items found in the JSON file.", "error");
        return;
      }
      
      // Replace current intolerances
      userIntolerances = validIntolerances;
      currentProfileName = data.name || "Uploaded Profile";
      
      // Refresh display
      loadCurrentIntolerances();
      
      // Clear file input
      document.getElementById("fileUpload").value = "";
      
      showUploadStatus(`Successfully loaded ${validIntolerances.length} intolerance items from ${currentProfileName}`, "success");
      
    } catch (error) {
      showUploadStatus("Error reading JSON file: " + error.message, "error");
    }
  };
  
  reader.readAsText(file);
}

// Process CSV and TXT files
function processTextFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const content = e.target.result;
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Parse CSV
        Papa.parse(content, {
          complete: function(results) {
            if (results.errors.length > 0) {
              showUploadStatus("Error parsing CSV: " + results.errors[0].message, "error");
              return;
            }
            
            const ingredients = extractIngredientsFromCSV(results.data);
            if (ingredients.length > 0) {
              showUploadStatus(`Found ${ingredients.length} potential ingredients. Please review and add intolerances manually.`, "success");
              displayExtractedIngredients(ingredients);
            } else {
              showUploadStatus("No ingredients found in the CSV file.", "warning");
            }
          }
        });
      } else {
        // Parse TXT
        const ingredients = extractIngredientsFromText(content);
        if (ingredients.length > 0) {
          showUploadStatus(`Found ${ingredients.length} potential ingredients. Please review and add intolerances manually.`, "success");
          displayExtractedIngredients(ingredients);
        } else {
          showUploadStatus("No ingredients found in the text file.", "warning");
        }
      }
      
    } catch (error) {
      showUploadStatus("Error reading text file: " + error.message, "error");
    }
  };
  
  reader.readAsText(file);
}

// Process DOCX files
function processDocxFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    mammoth.extractRawText({arrayBuffer: e.target.result})
      .then(function(result) {
        const text = result.value;
        const ingredients = extractIngredientsFromText(text);
        
        if (ingredients.length > 0) {
          showUploadStatus(`Found ${ingredients.length} potential ingredients from DOCX. Please review and add intolerances manually.`, "success");
          displayExtractedIngredients(ingredients);
        } else {
          showUploadStatus("No ingredients found in the DOCX file.", "warning");
        }
      })
      .catch(function(error) {
        showUploadStatus("Error reading DOCX file: " + error.message, "error");
      });
  };
  
  reader.readAsArrayBuffer(file);
}

// Process PDF files
function processPdfFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const typedarray = new Uint8Array(e.target.result);
    
    pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
      let fullText = '';
      const promises = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        promises.push(
          pdf.getPage(i).then(function(page) {
            return page.getTextContent();
          }).then(function(textContent) {
            let pageText = '';
            for (let j = 0; j < textContent.items.length; j++) {
              pageText += textContent.items[j].str + ' ';
            }
            return pageText;
          })
        );
      }
      
      Promise.all(promises).then(function(pages) {
        fullText = pages.join(' ');
        const ingredients = extractIngredientsFromText(fullText);
        
        if (ingredients.length > 0) {
          showUploadStatus(`Found ${ingredients.length} potential ingredients from PDF. Please review and add intolerances manually.`, "success");
          displayExtractedIngredients(ingredients);
        } else {
          showUploadStatus("No ingredients found in the PDF file.", "warning");
        }
      });
    }).catch(function(error) {
      showUploadStatus("Error reading PDF file: " + error.message, "error");
    });
  };
  
  reader.readAsArrayBuffer(file);
}

// Process image files with OCR
function processImageFile(file) {
  showUploadStatus("Processing image with OCR...", "info");
  
  const reader = new FileReader();
  reader.onload = function(e) {
    Tesseract.recognize(e.target.result, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          showUploadStatus(`OCR Progress: ${Math.round(m.progress * 100)}%`, "info");
        }
      }
    }).then(function(result) {
      const text = result.data.text;
      const ingredients = extractIngredientsFromText(text);
      
      if (ingredients.length > 0) {
        showUploadStatus(`Found ${ingredients.length} potential ingredients from image. Please review and add intolerances manually.`, "success");
        displayExtractedIngredients(ingredients);
      } else {
        showUploadStatus("No ingredients found in the image.", "warning");
      }
    }).catch(function(error) {
      showUploadStatus("Error processing image: " + error.message, "error");
    });
  };
  
  reader.readAsDataURL(file);
}

// Extract ingredients from CSV data
function extractIngredientsFromCSV(csvData) {
  const ingredients = [];
  
  csvData.forEach(row => {
    if (Array.isArray(row)) {
      row.forEach(cell => {
        if (cell && typeof cell === 'string') {
          const extracted = extractIngredientsFromText(cell);
          ingredients.push(...extracted);
        }
      });
    }
  });
  
  return [...new Set(ingredients)]; // Remove duplicates
}

// Extract ingredients from text
function extractIngredientsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  
  // Common ingredient patterns
  const ingredientPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // Capitalized words
    /([a-z]+(?:\s+[a-z]+)*)/g, // Lowercase words
    /([A-Z]+(?:\s+[A-Z]+)*)/g  // ALL CAPS words
  ];
  
  const ingredients = [];
  
  ingredientPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.trim();
        if (cleanMatch.length > 2 && cleanMatch.length < 50) {
          // Filter out common non-ingredient words
          const excludeWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
          if (!excludeWords.includes(cleanMatch.toLowerCase())) {
            ingredients.push(cleanMatch);
          }
        }
      });
    }
  });
  
  return [...new Set(ingredients)]; // Remove duplicates
}

// Display extracted ingredients for user review
function displayExtractedIngredients(ingredients) {
  const statusDiv = document.getElementById("uploadStatus");
  
  statusDiv.innerHTML = `
    <div style="margin-bottom: 15px;">
      <h4 style="margin: 0 0 10px 0;">📋 Extracted Ingredients (${ingredients.length})</h4>
      <p style="margin: 0 0 10px 0; font-size: 14px;">Review the ingredients below and add intolerances manually:</p>
      <div style="max-height: 200px; overflow-y: auto; background: white; border-radius: 6px; padding: 10px; border: 1px solid #ddd;">
        ${ingredients.map(ingredient => 
          `<div style="padding: 5px; margin: 2px 0; background: #f8f9fa; border-radius: 4px; font-size: 14px;">${ingredient}</div>`
        ).join('')}
      </div>
      <button onclick="addExtractedIngredients('${ingredients.join('|')}')" style="background-color: #28a745; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer; margin-top: 10px;">
        📝 Add All as Intolerances
      </button>
    </div>
  `;
  
  statusDiv.style.display = "block";
  statusDiv.style.backgroundColor = "#17a2b8";
  statusDiv.style.color = "white";
}

// Add extracted ingredients as intolerances
function addExtractedIngredients(ingredientsString) {
  const ingredients = ingredientsString.split('|');
  
  ingredients.forEach(ingredient => {
    if (ingredient.trim()) {
      // Check if already exists
      if (!userIntolerances.some(existing => existing.item.toLowerCase() === ingredient.toLowerCase())) {
        userIntolerances.push({
          item: ingredient.trim(),
          category: "Other",
          level: 1
        });
      }
    }
  });
  
  // Refresh display
  loadCurrentIntolerances();
  
  // Auto-save
  autoSaveIntolerances();
  
  showUploadStatus(`Added ${ingredients.length} ingredients as intolerances!`, "success");
  
  // Clear file input
  document.getElementById("fileUpload").value = "";
}

// Save intolerances to localStorage
function saveIntolerances() {
  if (userIntolerances.length === 0) {
    alert("Please add some items first.");
    return;
  }
  
  try {
    const data = {
      name: currentProfileName,
      type: "user",
      intolerances: userIntolerances,
      lastUpdated: new Date().toISOString()
    };
    
    // Use safe storage wrapper to avoid conflicts with other apps
    safeStorage.setItem("myDNADiet_userIntolerances", JSON.stringify(data));
    alert("Intolerances saved successfully! They will be available in your profile.");
    
    // Add to the main intolerances object
    intolerances[currentProfileName] = userIntolerances.map(item => item.item);
    
    // Show user profile button
    showUserProfileButton();
    
    // Refresh the main display
    renderIntolerances();
    
  } catch (error) {
    alert("Error saving intolerances: " + error.message);
  }
}

// Export current intolerances as JSON
function exportCurrentIntolerances() {
  if (userIntolerances.length === 0) {
    alert("No intolerances to export. Please add some items first.");
    return;
  }
  
  const data = {
    name: currentProfileName,
    type: "user",
    intolerances: userIntolerances,
    lastUpdated: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentProfileName.replace(/\s+/g, "_")}_intolerances.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Clear all intolerances
function clearAllIntolerances() {
  if (confirm("Are you sure you want to clear all intolerances? This cannot be undone.")) {
    userIntolerances = [];
    loadCurrentIntolerances();
    autoSaveIntolerances();
  }
}

// Safely clear only our app's data (never touches other apps)
function clearAppData() {
  if (confirm("This will clear only My DNA Diet app data. Other apps will not be affected. Continue?")) {
    try {
      const appKeys = safeStorage.getAppKeys();
      appKeys.forEach(key => {
        safeStorage.removeItem(key);
      });
      console.log("✅ Cleared app data safely");
      
      // Reset app state
      userIntolerances = [];
      currentProfileName = "My Profile";
      loadCurrentIntolerances();
      
      alert("App data cleared successfully. Other apps were not affected.");
    } catch (error) {
      console.error("❌ Error clearing app data:", error);
      alert("Error clearing app data. Please try again.");
    }
  }
}

// Auto-save intolerances to localStorage
function autoSaveIntolerances() {
  if (userIntolerances.length > 0) {
    try {
      const data = {
        name: currentProfileName,
        type: "user",
        intolerances: userIntolerances,
        lastUpdated: new Date().toISOString()
      };
      
      // Use safe storage wrapper to avoid conflicts with other apps
      safeStorage.setItem("myDNADiet_userIntolerances", JSON.stringify(data));
      
      // Add to main intolerances object
      intolerances[currentProfileName] = userIntolerances.map(item => item.item);
      
      // Show user profile button
      showUserProfileButton();
      
      console.log("✅ Auto-saved intolerances to localStorage");
    } catch (error) {
      console.error("❌ Error auto-saving intolerances:", error);
    }
  }
}

// Load user intolerances from localStorage on app start
function loadUserIntolerancesFromStorage() {
  try {
    // Use safe storage wrapper to avoid conflicts with other apps
    const stored = safeStorage.getItem("myDNADiet_userIntolerances");
    if (stored) {
      const data = JSON.parse(stored);
      userIntolerances = data.intolerances || [];
      currentProfileName = data.name || "My Profile";
      
      // Add to main intolerances object
      intolerances[currentProfileName] = userIntolerances.map(item => item.item);
      
      // Show user profile button
      showUserProfileButton();
      
      console.log("✅ Loaded user intolerances from storage:", userIntolerances.length, "items");
    }
  } catch (error) {
    console.error("❌ Error loading user intolerances from storage:", error);
  }
}

// Show user profile button if user has intolerances
function showUserProfileButton() {
  const userProfileBtn = document.getElementById("userProfileBtn");
  if (userIntolerances.length > 0) {
    userProfileBtn.style.display = "inline-block";
  }
}

// Call this function when the app loads
loadUserIntolerancesFromStorage(); 