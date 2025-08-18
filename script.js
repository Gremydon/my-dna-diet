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
  
  // Check if this is the user's first visit
  if (!safeStorage.getItem("myDNADiet_onboardingComplete")) {
    // Show onboarding for first-time users
    setTimeout(() => {
      showOnboarding();
    }, 1000); // Small delay to let the app load first
  } else {
    // App content is already visible by default
    selectPet("Mocha"); // default pet
  }
  
  // Setup upload modal event listeners
  setupUploadModalListeners();
  
  // Log app storage keys for debugging
  const appKeys = safeStorage.getAppKeys();
  console.log("📱 App storage keys:", appKeys);
});

// ===== ONBOARDING SYSTEM =====
let currentOnboardingStep = 1;
let selectedOnboardingOption = null;
let onboardingIntolerances = [];

// Show onboarding modal
function showOnboarding() {
  document.getElementById("onboardingModal").style.display = "flex";
  currentOnboardingStep = 1;
  selectedOnboardingOption = null;
  onboardingIntolerances = [];
  updateOnboardingProgress();
  
  // Setup onboarding event listeners
  document.getElementById("closeOnboarding").addEventListener("click", closeOnboarding);
  
  // Clear any previous form data
  document.getElementById("profileName").value = "";
  document.getElementById("onboardingFileInput").value = "";
  document.getElementById("onboardingItemInput").value = "";
  
  // Reset file upload and manual entry displays
  document.getElementById("onboardingFileUpload").style.display = "none";
  document.getElementById("onboardingManualEntry").style.display = "none";
}

// Close onboarding modal
function closeOnboarding() {
  document.getElementById("onboardingModal").style.display = "none";
  // Mark onboarding as complete
  safeStorage.setItem("myDNADiet_onboardingComplete", "true");
  
  // Show the main app content
  selectPet("Mocha");
}

// Next onboarding step
function nextOnboardingStep() {
  if (currentOnboardingStep < 4) {
    currentOnboardingStep++;
    updateOnboardingProgress();
  }
}

// Previous onboarding step
function previousOnboardingStep() {
  if (currentOnboardingStep > 1) {
    currentOnboardingStep--;
    updateOnboardingProgress();
  }
}

// Update onboarding progress indicators
function updateOnboardingProgress() {
  // Hide all steps
  document.querySelectorAll('.onboarding-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Show current step
  document.getElementById(`step${currentOnboardingStep}`).style.display = 'block';
  
  // Update progress dots
  document.querySelectorAll('.onboarding-dot').forEach((dot, index) => {
    if (index + 1 <= currentOnboardingStep) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
  
  // Handle step-specific logic
  if (currentOnboardingStep === 3) {
    // Step 3: Show appropriate input method based on selection
    if (selectedOnboardingOption === 'manual') {
      document.getElementById('onboardingManualEntry').style.display = 'block';
      document.getElementById('onboardingFileUpload').style.display = 'none';
    } else {
      document.getElementById('onboardingFileUpload').style.display = 'block';
      document.getElementById('onboardingManualEntry').style.display = 'none';
    }
  }
}

// Select onboarding option
function selectOnboardingOption(option) {
  selectedOnboardingOption = option;
  
  // Remove selection from all options
  document.querySelectorAll('.onboarding-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  // Add selection to clicked option
  event.currentTarget.classList.add('selected');
  
  // Enable next step
  setTimeout(() => {
    nextOnboardingStep();
  }, 300);
}

// Add intolerance during onboarding
function addOnboardingIntolerance() {
  const item = document.getElementById('onboardingItemInput').value.trim();
  const category = document.getElementById('onboardingCategoryInput').value;
  const level = parseInt(document.getElementById('onboardingLevelInput').value);
  
  if (!item) {
    alert("Please enter a food item name");
    return;
  }
  
  // Check if item already exists
  if (onboardingIntolerances.some(existing => existing.item.toLowerCase() === item.toLowerCase())) {
    alert("This item is already in your list");
    return;
  }
  
  onboardingIntolerances.push({ item, category, level });
  
  // Clear form
  document.getElementById('onboardingItemInput').value = '';
  
  // Refresh display
  displayOnboardingIntolerances();
}

// Display onboarding intolerances
function displayOnboardingIntolerances() {
  const container = document.getElementById('onboardingIntolerancesList');
  container.innerHTML = '';
  
  if (onboardingIntolerances.length === 0) {
    container.innerHTML = "<p style='text-align: center; color: #666;'>No intolerances added yet.</p>";
    return;
  }
  
  onboardingIntolerances.forEach((item, index) => {
    const div = document.createElement('div');
    div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: white; border-radius: 4px; border: 1px solid #ddd;";
    
    const levelColor = item.level === 3 ? "#ffcccc" : item.level === 2 ? "#fff3cd" : "#d4edda";
    const levelText = item.level === 3 ? "Severe" : item.level === 2 ? "Moderate" : "Mild";
    
    div.innerHTML = `
      <span style="font-weight: bold;">${item.item}</span>
      <span style="color: #666;">${item.category}</span>
      <span style="background: ${levelColor}; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${levelText}</span>
      <button onclick="removeOnboardingIntolerance(${index})" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">❌</button>
    `;
    
    container.appendChild(div);
  });
}

// Remove onboarding intolerance
function removeOnboardingIntolerance(index) {
  onboardingIntolerances.splice(index, 1);
  displayOnboardingIntolerances();
}

// Create onboarding profile
function createOnboardingProfile() {
  const profileName = document.getElementById('profileName').value.trim();
  
  if (!profileName) {
    alert("Please enter a profile name");
    return;
  }
  
  if (selectedOnboardingOption === 'manual' && onboardingIntolerances.length === 0) {
    alert("Please add at least one intolerance item");
    return;
  }
  
  // Set the profile name immediately
  currentProfileName = profileName;
  console.log("Setting profile name to:", currentProfileName);
  
  // Handle file upload if selected
  if (selectedOnboardingOption !== 'manual') {
    const fileInput = document.getElementById('onboardingFileInput');
    if (fileInput.files.length === 0) {
      alert("Please select a file to upload");
      return;
    }
    
    // Process the file (this will be handled by the existing file processing logic)
    const file = fileInput.files[0];
    if (file.name.toLowerCase().endsWith('.json')) {
      // Process JSON file
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          if (data.intolerances && Array.isArray(data.intolerances)) {
            userIntolerances = data.intolerances;
            // Profile name is already set above
            completeOnboardingProfile();
          } else {
            alert("Invalid file format. Please use a valid intolerance data file.");
          }
        } catch (error) {
          alert("Error reading file: " + error.message);
        }
      };
      reader.readAsText(file);
    } else {
      // For other file types, we'll use the manual intolerances as a fallback
      userIntolerances = onboardingIntolerances;
      // Profile name is already set above
      completeOnboardingProfile();
    }
  } else {
    // Manual entry
    userIntolerances = onboardingIntolerances;
    // Profile name is already set above
    completeOnboardingProfile();
  }
}

// Complete onboarding profile creation
function completeOnboardingProfile() {
  // Save to localStorage
  autoSaveIntolerances();
  
  // Add to main intolerances object with proper profile name
  intolerances[currentProfileName] = userIntolerances.map(item => item.item);
  
  // Show user profile button
  showUserProfileButton();
  
  // Move to success step
  nextOnboardingStep();
}

// Complete onboarding
function completeOnboarding() {
  closeOnboarding();
  
  // Show success message in main app
  document.getElementById("scanResults").innerHTML = `
    <div class="section" style="text-align: center; padding: 40px; background: linear-gradient(135deg, #e8f5e8, #f0f8ff);">
      <h3>🎉 Welcome to My DNA Diet!</h3>
      <p style="font-size: 18px; margin: 20px 0;">Your profile "${currentProfileName}" is now active!</p>
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
  
  // Refresh the main display
  renderIntolerances();
}

// Login function removed - no authentication required

let currentPet = "Mocha";

// Select Pet Function
function selectPet(petName) {
  currentPet = petName;
  
  // If this is a user profile, update the currentProfileName to match
  if (petName === "My Profile" && userIntolerances.length > 0) {
    // Try to get the actual profile name from localStorage
    try {
      const stored = safeStorage.getItem("myDNADiet_userIntolerances");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.name && data.name !== "My Profile") {
          currentProfileName = data.name;
          console.log("Updated currentProfileName to:", currentProfileName);
          
          // Update the intolerances object with the correct profile name
          intolerances[currentProfileName] = userIntolerances.map(item => item.item);
        }
      }
    } catch (error) {
      console.error("Error updating profile name:", error);
    }
  }

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
  
  // Add profile name display at the top of scan results
  if (currentPet && currentPet !== "My Profile") {
    const profileNameDiv = document.createElement("div");
    profileNameDiv.style.cssText = "background: linear-gradient(135deg, #e8f5e8, #f0f8ff); padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; border-left: 4px solid #4b0082;";
    profileNameDiv.innerHTML = `<h4 style="margin: 0; color: #4b0082;">👤 Active Profile: ${currentPet}</h4>`;
    
    const scanResults = document.getElementById("scanResults");
    if (scanResults.firstChild) {
      scanResults.insertBefore(profileNameDiv, scanResults.firstChild);
    } else {
      scanResults.appendChild(profileNameDiv);
    }
  }
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
    resultDiv.innerHTML = "<p>Please select a file first.</p>";
    return;
  }

  // Lock in current profile immediately
  const currentProfile = currentPet;
  const intoleranceList = intolerances[currentProfile] || [];
  const lowerCaseIntolerances = intoleranceList.map(i => i.toLowerCase());

  // Show processing status
  resultDiv.innerHTML = `<p>🔄 Processing ${file.name}... This may take a few seconds.</p>`;

  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  try {
    // Handle different file types
    if (fileName.endsWith('.json')) {
      processDietJsonFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else if (fileName.endsWith('.pdf')) {
      processDietPdfFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else if (fileName.endsWith('.docx')) {
      processDietDocxFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else if (fileName.endsWith('.csv')) {
      processDietCsvFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else if (fileName.endsWith('.txt')) {
      processDietTextFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else {
      resultDiv.innerHTML = `<p style="color: red;">❌ Unsupported file type. Please use TXT, PDF, DOCX, CSV, or JSON files.</p>`;
    }
  } catch (error) {
    console.error("Error processing diet plan file:", error);
    resultDiv.innerHTML = `<p style="color: red;">❌ Error processing file: ${error.message}</p>`;
  }
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
  
  // Add file input change listener for debugging
  const fileInput = document.getElementById("fileUpload");
  if (fileInput) {
    fileInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        console.log("File input change event triggered");
        console.log("Selected file:", file.name);
        console.log("File type:", file.type);
        console.log("File size:", file.size);
        console.log("File extension:", file.name.split('.').pop().toLowerCase());
        
        // Show immediate feedback only for JSON files
        const statusDiv = document.getElementById("uploadStatus");
        if (statusDiv) {
          if (file.name.toLowerCase().endsWith('.json')) {
            statusDiv.style.display = "block";
            statusDiv.style.backgroundColor = "#17a2b8";
            statusDiv.style.color = "white";
            statusDiv.style.padding = "10px";
            statusDiv.style.borderRadius = "6px";
            statusDiv.textContent = `JSON file selected: ${file.name}`;
          } else {
            statusDiv.style.display = "block";
            statusDiv.style.backgroundColor = "#ffc107";
            statusDiv.style.color = "black";
            statusDiv.style.padding = "10px";
            statusDiv.style.borderRadius = "6px";
            statusDiv.textContent = `Only JSON files are currently supported. Please select a .json file.`;
            // Clear the file input for non-JSON files
            fileInput.value = "";
          }
        }
      }
    });
  }
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
  
  // Debug information
  console.log("File selected:", file.name);
  console.log("File type:", fileType);
  console.log("File size:", file.size);
  
  showUploadStatus("Processing file...", "info");
  
  // Determine file type and process accordingly
  if (fileName.endsWith('.json')) {
    processJSONFile(file);
  } else {
    showUploadStatus("Currently only JSON files are supported. Other file types will be re-enabled soon!", "warning");
    // Clear the file input
    fileInput.value = "";
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
      
      // Save to localStorage and refresh the UI
      autoSaveIntolerances(); // Save to localStorage
      loadCurrentIntolerances(); // Refresh the UI
      
      // Auto-select the uploaded profile to display its data
      selectPet(currentProfileName); // Make sure we show the right profile's data
      
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
      
      // Add to main intolerances object with proper profile name
      intolerances[currentProfileName] = userIntolerances.map(item => item.item);
      
      // Show user profile button
      showUserProfileButton();
      
      console.log("✅ Auto-saved intolerances to localStorage for profile:", currentProfileName);
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
      
      // Add to main intolerances object with proper profile name
      intolerances[currentProfileName] = userIntolerances.map(item => item.item);
      
      // Show user profile button
      showUserProfileButton();
      
      console.log("✅ Loaded user intolerances from storage:", userIntolerances.length, "items for profile:", currentProfileName);
      
      // If this is the first load and we have a user profile, select it by default
      if (userIntolerances.length > 0 && !safeStorage.getItem("myDNADiet_profileSelected")) {
        selectPet(currentProfileName);
        safeStorage.setItem("myDNADiet_profileSelected", "true");
      }
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
    
    // Update the button text to show the actual profile name
    const displayName = currentProfileName !== "My Profile" ? currentProfileName : "My Profile";
    userProfileBtn.textContent = `👤 ${displayName}`;
    userProfileBtn.onclick = () => selectPet(displayName);
    
    console.log("Updated user profile button to show:", displayName);
  }
}

// Call this function when the app loads
loadUserIntolerancesFromStorage();

// Ensure profile name consistency on page load
function ensureProfileNameConsistency() {
  try {
    const stored = safeStorage.getItem("myDNADiet_userIntolerances");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.name && data.name !== currentProfileName) {
        currentProfileName = data.name;
        console.log("Ensured profile name consistency:", currentProfileName);
        
        // Update the intolerances object with the correct profile name
        if (userIntolerances.length > 0) {
          intolerances[currentProfileName] = userIntolerances.map(item => item.item);
          console.log("Updated intolerances object for profile:", currentProfileName);
        }
      }
    }
  } catch (error) {
    console.error("Error ensuring profile name consistency:", error);
  }
}

// Call this after loading user intolerances
setTimeout(ensureProfileNameConsistency, 100);

// Debug function to log current state
function logCurrentState() {
  console.log("=== Current App State ===");
  console.log("currentPet:", currentPet);
  console.log("currentProfileName:", currentProfileName);
  console.log("userIntolerances.length:", userIntolerances.length);
  console.log("Available profiles:", Object.keys(intolerances));
  console.log("localStorage keys:", safeStorage.getAppKeys());
  
  try {
    const stored = safeStorage.getItem("myDNADiet_userIntolerances");
    if (stored) {
      const data = JSON.parse(stored);
      console.log("Stored profile data:", data);
    }
  } catch (error) {
    console.error("Error reading stored data:", error);
  }
  console.log("========================");
}

// Log state after a delay to help with debugging
setTimeout(logCurrentState, 500);

// Function to refresh profile data from localStorage
function refreshProfileData() {
  try {
    console.log("🔄 Refreshing profile data...");
    
    // Reload user intolerances from storage
    const stored = safeStorage.getItem("myDNADiet_userIntolerances");
    if (stored) {
      const data = JSON.parse(stored);
      userIntolerances = data.intolerances || [];
      currentProfileName = data.name || "My Profile";
      
      // Update the intolerances object with the correct profile name
      intolerances[currentProfileName] = userIntolerances.map(item => item.item);
      
      // Show user profile button
      showUserProfileButton();
      
      // Refresh the display
      loadCurrentIntolerances();
      
      // Update the main app display
      if (currentPet === "My Profile" || currentPet === currentProfileName) {
        renderIntolerances();
      }
      
      console.log("✅ Profile data refreshed successfully");
      console.log("Profile name:", currentProfileName);
      console.log("Intolerances count:", userIntolerances.length);
      
      // Show success message
      const statusDiv = document.getElementById("uploadStatus");
      if (statusDiv) {
        showUploadStatus(`Profile refreshed: ${currentProfileName} (${userIntolerances.length} intolerances)`, "success");
      }
    } else {
      console.log("No stored profile data found");
      if (document.getElementById("uploadStatus")) {
        showUploadStatus("No stored profile data found", "warning");
      }
    }
  } catch (error) {
    console.error("❌ Error refreshing profile data:", error);
    if (document.getElementById("uploadStatus")) {
      showUploadStatus("Error refreshing profile data: " + error.message, "error");
    }
  }
}

// Function to show debug information
function showDebugInfo() {
  const debugDiv = document.getElementById("debugInfo");
  if (!debugDiv) return;
  
  try {
    const stored = safeStorage.getItem("myDNADiet_userIntolerances");
    let debugHTML = "<strong>Current App State:</strong><br>";
    debugHTML += `• Current Pet: ${currentPet}<br>`;
    debugHTML += `• Current Profile Name: ${currentProfileName}<br>`;
    debugHTML += `• User Intolerances Count: ${userIntolerances.length}<br>`;
    debugHTML += `• Available Profiles: ${Object.keys(intolerances).join(", ")}<br>`;
    debugHTML += `• localStorage Keys: ${safeStorage.getAppKeys().join(", ")}<br><br>`;
    
    if (stored) {
      const data = JSON.parse(stored);
      debugHTML += "<strong>Stored Profile Data:</strong><br>";
      debugHTML += `• Profile Name: ${data.name || "Not set"}<br>`;
      debugHTML += `• Intolerances Count: ${data.intolerances ? data.intolerances.length : 0}<br>`;
      debugHTML += `• Last Updated: ${data.lastUpdated || "Not set"}<br>`;
      debugHTML += `• Type: ${data.type || "Not set"}`;
    } else {
      debugHTML += "<strong>No stored profile data found</strong>";
    }
    
    debugDiv.innerHTML = debugHTML;
    debugDiv.style.display = "block";
  } catch (error) {
    debugDiv.innerHTML = `<strong>Error getting debug info:</strong> ${error.message}`;
    debugDiv.style.display = "block";
  }
}

// Diet plan file processing functions
function processDietTextFile(file, currentProfile, lowerCaseIntolerances, resultDiv) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const contents = e.target.result.toLowerCase();
      const ingredients = contents.split(/[\n,]+/).map(line => line.trim()).filter(Boolean);
      analyzeDietIngredients(ingredients, currentProfile, lowerCaseIntolerances, resultDiv);
    } catch (error) {
      resultDiv.innerHTML = `<p style="color: red;">❌ Error reading text file: ${error.message}</p>`;
    }
  };
  reader.readAsText(file);
}

function processDietJsonFile(file, currentProfile, lowerCaseIntolerances, resultDiv) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      let ingredients = [];
      
      // Handle different JSON structures
      if (data.ingredients && Array.isArray(data.ingredients)) {
        ingredients = data.ingredients;
      } else if (data.diet && data.diet.ingredients) {
        ingredients = data.diet.ingredients;
      } else if (data.foods && Array.isArray(data.foods)) {
        ingredients = data.foods;
      } else if (data.items && Array.isArray(data.items)) {
        ingredients = data.items;
      } else {
        // Try to extract any array of strings
        const allKeys = Object.keys(data);
        for (const key of allKeys) {
          if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === 'string') {
            ingredients = data[key];
            break;
          }
        }
      }
      
      if (ingredients.length === 0) {
        resultDiv.innerHTML = `<p style="color: orange;">⚠️ No ingredients found in JSON file. Please check the file format.</p>`;
        return;
      }
      
      // Convert to lowercase for analysis
      const lowerCaseIngredients = ingredients.map(item => item.toLowerCase());
      analyzeDietIngredients(lowerCaseIngredients, currentProfile, lowerCaseIntolerances, resultDiv);
    } catch (error) {
      resultDiv.innerHTML = `<p style="color: red;">❌ Error reading JSON file: ${error.message}</p>`;
    }
  };
  reader.readAsText(file);
}

function processDietCsvFile(file, currentProfile, lowerCaseIntolerances, resultDiv) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const content = e.target.result;
      Papa.parse(content, {
        complete: function(results) {
          if (results.errors.length > 0) {
            resultDiv.innerHTML = `<p style="color: red;">❌ Error parsing CSV: ${results.errors[0].message}</p>`;
            return;
          }
          
          const ingredients = extractIngredientsFromCSV(results.data);
          if (ingredients.length > 0) {
            const lowerCaseIngredients = ingredients.map(item => item.toLowerCase());
            analyzeDietIngredients(lowerCaseIngredients, currentProfile, lowerCaseIntolerances, resultDiv);
          } else {
            resultDiv.innerHTML = `<p style="color: orange;">⚠️ No ingredients found in CSV file.</p>`;
          }
        }
      });
    } catch (error) {
      resultDiv.innerHTML = `<p style="color: red;">❌ Error reading CSV file: ${error.message}</p>`;
    }
  };
  reader.readAsText(file);
}

function processDietDocxFile(file, currentProfile, lowerCaseIntolerances, resultDiv) {
  const reader = new FileReader();
  reader.onload = function (e) {
    mammoth.extractRawText({arrayBuffer: e.target.result})
      .then(function(result) {
        try {
          const text = result.value;
          const ingredients = extractIngredientsFromText(text);
          
          if (ingredients.length > 0) {
            const lowerCaseIngredients = ingredients.map(item => item.toLowerCase());
            analyzeDietIngredients(lowerCaseIngredients, currentProfile, lowerCaseIntolerances, resultDiv);
          } else {
            resultDiv.innerHTML = `<p style="color: orange;">⚠️ No ingredients found in DOCX file.</p>`;
          }
        } catch (error) {
          resultDiv.innerHTML = `<p style="color: red;">❌ Error processing DOCX content: ${error.message}</p>`;
        }
      })
      .catch(function(error) {
        resultDiv.innerHTML = `<p style="color: red;">❌ Error reading DOCX file: ${error.message}</p>`;
      });
  };
  reader.readAsArrayBuffer(file);
}

function processDietPdfFile(file, currentProfile, lowerCaseIntolerances, resultDiv) {
  const reader = new FileReader();
  reader.onload = function (e) {
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
        try {
          fullText = pages.join(' ');
          const ingredients = extractIngredientsFromText(fullText);
          
          if (ingredients.length > 0) {
            const lowerCaseIngredients = ingredients.map(item => item.toLowerCase());
            analyzeDietIngredients(lowerCaseIngredients, currentProfile, lowerCaseIntolerances, resultDiv);
          } else {
            resultDiv.innerHTML = `<p style="color: orange;">⚠️ No ingredients found in PDF file.</p>`;
          }
        } catch (error) {
          resultDiv.innerHTML = `<p style="color: red;">❌ Error processing PDF content: ${error.message}</p>`;
        }
      });
    }).catch(function(error) {
      resultDiv.innerHTML = `<p style="color: red;">❌ Error reading PDF file: ${error.message}</p>`;
    });
  };
  reader.readAsArrayBuffer(file);
}

// Common function to analyze diet ingredients
function analyzeDietIngredients(ingredients, currentProfile, lowerCaseIntolerances, resultDiv) {
  const flagged = ingredients.filter(ingredient =>
    lowerCaseIntolerances.some(intolerantItem => ingredient.includes(intolerantItem))
  );

  if (flagged.length > 0) {
    resultDiv.innerHTML = `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 10px 0;">
        <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Diet Plan Analysis Results</h4>
        <p style="margin: 0 0 15px 0; color: #856404;"><strong>Profile:</strong> ${currentProfile}</p>
        <p style="margin: 0 0 15px 0; color: #856404;"><strong>Total Ingredients Analyzed:</strong> ${ingredients.length}</p>
        <p style="margin: 0 0 15px 0; color: #856404;"><strong>Potential Issues Found:</strong> ${flagged.length}</p>
        
        <div style="background: #ffcccc; border: 1px solid #ffb3b3; border-radius: 6px; padding: 10px; margin: 10px 0;">
          <p style="margin: 0 0 10px 0; color: #721c24; font-weight: bold;">🚨 Problematic Ingredients:</p>
          <ul style="margin: 0; padding-left: 20px; color: #721c24;">
            ${flagged.map(i => `<li>${i}</li>`).join("")}
          </ul>
        </div>
        
        <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">
          💡 <strong>Recommendation:</strong> Consider alternatives for the flagged ingredients or consult with a healthcare provider.
        </p>
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 10px 0;">
        <h4 style="margin: 0 0 10px 0; color: #155724;">✅ Diet Plan Analysis Complete</h4>
        <p style="margin: 0 0 15px 0; color: #155724;"><strong>Profile:</strong> ${currentProfile}</p>
        <p style="margin: 0 0 15px 0; color: #155724;"><strong>Total Ingredients Analyzed:</strong> ${ingredients.length}</p>
        <p style="margin: 0 0 15px 0; color: #155724;"><strong>Issues Found:</strong> None! 🎉</p>
        
        <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">
          💡 <strong>Great news!</strong> This diet plan appears to be safe for your current intolerance profile.
        </p>
      </div>
    `;
  }
}

// Section toggle functions
function openTestIngredientModal() {
  document.getElementById("testIngredientModal").style.display = "flex";
  // Clear any previous results
  document.getElementById("testIngredientResults").innerHTML = "";
  // Focus on the input
  setTimeout(() => {
    document.getElementById("testIngredientInput").focus();
  }, 100);
}

function closeTestIngredientModal() {
  document.getElementById("testIngredientModal").style.display = "none";
  // Clear the input and results
  document.getElementById("testIngredientInput").value = "";
  document.getElementById("testIngredientResults").innerHTML = "";
}

function openDietPlanModal() {
  document.getElementById("dietPlanModal").style.display = "flex";
  // Clear any previous results
  document.getElementById("dietPlanResultsModal").innerHTML = "";
  // Clear the file input
  document.getElementById("dietPlanUploadModal").value = "";
}

function closeDietPlanModal() {
  document.getElementById("dietPlanModal").style.display = "none";
  // Clear the file input and results
  document.getElementById("dietPlanUploadModal").value = "";
  document.getElementById("dietPlanResultsModal").innerHTML = "";
}

// Test food ingredients function for the modal
function testFoodIngredients() {
  const input = document.getElementById("testIngredientInput").value.trim();
  const resultDiv = document.getElementById("testIngredientResults");

  if (!input) {
    resultDiv.innerHTML = "<p style='color: #dc3545; text-align: center; padding: 10px; background-color: #f8d7da; border-radius: 6px;'>Please enter some ingredients first.</p>";
    return;
  }

  const ingredients = input
    .toLowerCase()
    .split(/[\n,]+/) // split on newlines or commas
    .map(i => i.trim())
    .filter(i => i.length > 0);

  // Get the intolerance list for the current pet
  const intoleranceList = intolerances[currentPet] || [];
  
  // Normalize the intolerance list
  const lowerCaseIntolerances = intoleranceList.map(i => i.toLowerCase());

  const flagged = ingredients.filter(ingredient =>
    lowerCaseIntolerances.some(intolerantItem => ingredient.includes(intolerantItem))
  );

  if (flagged.length > 0) {
    resultDiv.innerHTML = `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 10px 0;">
        <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Potential Issues Found</h4>
        <p style="margin: 0 0 15px 0; color: #856404;"><strong>Profile:</strong> ${currentPet}</p>
        <p style="margin: 0 0 15px 0; color: #856404;"><strong>Ingredients Analyzed:</strong> ${ingredients.length}</p>
        <p style="margin: 0 0 15px 0; color: #856404;"><strong>Issues Found:</strong> ${flagged.length}</p>
        
        <div style="background: #ffcccc; border: 1px solid #ffb3b3; border-radius: 6px; padding: 10px; margin: 10px 0;">
          <p style="margin: 0 0 10px 0; color: #721c24; font-weight: bold;">🚨 Problematic Ingredients:</p>
          <ul style="margin: 0; padding-left: 20px; color: #721c24;">
            ${flagged.map(i => `<li>${i}</li>`).join("")}
          </ul>
        </div>
        
        <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">
          💡 <strong>Recommendation:</strong> Consider alternatives for the flagged ingredients or consult with a healthcare provider.
        </p>
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 10px 0;">
        <h4 style="margin: 0 0 10px 0; color: #155724;">✅ Analysis Complete</h4>
        <p style="margin: 0 0 15px 0; color: #155724;"><strong>Profile:</strong> ${currentPet}</p>
        <p style="margin: 0 0 15px 0; color: #155724;"><strong>Ingredients Analyzed:</strong> ${ingredients.length}</p>
        <p style="margin: 0 0 15px 0; color: #155724;"><strong>Issues Found:</strong> None! 🎉</p>
        
        <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">
          💡 <strong>Great news!</strong> These ingredients appear to be safe for your current intolerance profile.
        </p>
      </div>
    `;
  }
}

// Clear test ingredients function
function clearTestIngredients() {
  document.getElementById("testIngredientInput").value = "";
  document.getElementById("testIngredientResults").innerHTML = "";
}

// Analyze diet plan function for the modal
function analyzeDietPlan() {
  const fileInput = document.getElementById("dietPlanUploadModal");
  const resultDiv = document.getElementById("dietPlanResultsModal");

  const file = fileInput.files[0];
  if (!file) {
    resultDiv.innerHTML = "<p style='color: #dc3545; text-align: center; padding: 10px; background-color: #f8d7da; border-radius: 6px;'>Please select a file first.</p>";
    return;
  }

  // Lock in current profile immediately
  const currentProfile = currentPet;
  const intoleranceList = intolerances[currentProfile] || [];
  const lowerCaseIntolerances = intoleranceList.map(i => i.toLowerCase());

  // Show processing status
  resultDiv.innerHTML = `<p style='text-align: center; padding: 10px; background-color: #e3f2fd; border-radius: 6px; color: #1976d2;'>🔄 Processing ${file.name}... This may take a few seconds.</p>`;

  const fileName = file.name.toLowerCase();

  try {
    // Handle different file types
    if (fileName.endsWith('.json')) {
      processDietJsonFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else if (fileName.endsWith('.pdf')) {
      processDietPdfFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else if (fileName.endsWith('.docx')) {
      processDietDocxFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else if (fileName.endsWith('.csv')) {
      processDietCsvFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else if (fileName.endsWith('.txt')) {
      processDietTextFile(file, currentProfile, lowerCaseIntolerances, resultDiv);
    } else {
      resultDiv.innerHTML = `<p style="color: red;">❌ Unsupported file type. Please use TXT, PDF, DOCX, CSV, or JSON files.</p>`;
    }
  } catch (error) {
    console.error("Error processing diet plan file:", error);
    resultDiv.innerHTML = `<p style="color: red;">❌ Error processing file: ${error.message}</p>`;
  }
} 