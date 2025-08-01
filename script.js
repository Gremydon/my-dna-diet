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

let videoStream = null;

function openScanModal() {
  document.getElementById("scanModal").style.display = "flex";
}

function closeScanModal() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }
  document.getElementById("cameraFeed").srcObject = null;
  document.getElementById("scanModal").style.display = "none";
}

function startCamera() {
  const video = document.getElementById("cameraFeed");
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      videoStream = stream;
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error("Camera error:", err);
    });
}

function captureImage() {
  const video = document.getElementById("cameraFeed");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    processImage(blob);
  }, "image/png");
}

function uploadImage(event) {
  const file = event.target.files[0];
  if (file) {
    processImage(file);
  }
}

function processImage(imageBlob) {
  Tesseract.recognize(
    imageBlob,
    'eng',
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    document.getElementById("ingredientInput").value = text;
    scanIngredients(text);
    closeScanModal();
  }).catch((err) => {
    console.error("OCR error:", err);
    alert("Could not read image. Please try again.");
    closeScanModal();
  });
}

function scanIngredients(text) {
  const resultsContainer = document.getElementById("scanResults");
  resultsContainer.innerHTML = "";

  const inputList = text.split(/[\s,.\n\r;:]+/).map(item => item.trim().toLowerCase());
  const petList = intolerances[currentPet].map(item => item.toLowerCase());

  inputList.forEach(word => {
    if (word.length < 2) return; // skip junk

    const div = document.createElement("div");
    div.className = "intolerance";

    if (petList.includes(word)) {
      div.classList.add("level-3");
      div.textContent = word + " (Level 3)";
    } else {
      div.textContent = word;
    }

    resultsContainer.appendChild(div);
  });
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