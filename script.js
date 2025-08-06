// Firebase configuration removed - no authentication required

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
  console.log("✅ App initialized - no authentication required");
  
  // Load intolerance data from JSON files
  await loadIntoleranceData();
  
  // App content is already visible by default
  selectPet("Mocha"); // default pet
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