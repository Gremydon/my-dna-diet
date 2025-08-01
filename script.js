// JavaScript file for Pet Food Intolerances application
// This file contains all the application logic

let mochaData = null;
let punkinData = null;
let currentPet = 'mocha';

// Load all pet data
async function loadAllPetData() {
  try {
    const [mochaRes, punkinRes] = await Promise.all([
      fetch('mocha-data.json'),
      fetch('punkin-data.json')
    ]);
    
    mochaData = await mochaRes.json();
    punkinData = await punkinRes.json();
    
    console.log('All pet data loaded successfully');
    console.log('Mocha data:', mochaData);
    console.log('Punkin data:', punkinData);
    
    // Initialize the view after data is loaded
    updateComparison();
    loadPetData('mocha');
  } catch (error) {
    console.error('Error loading pet data:', error);
  }
}

// Load and display pet data
function loadPetData(petName) {
  currentPet = petName;
  const data = petName === 'mocha' ? mochaData : punkinData;
  
  if (!data) {
    console.error('No data available for pet:', petName);
    return;
  }
  
  document.getElementById('name').textContent = data.name + "'s Intolerances";
  const content = document.getElementById('content');
  content.innerHTML = '';
  
  const categories = {};
  data.intolerances.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  for (const [category, items] of Object.entries(categories)) {
    const catDiv = document.createElement('div');
    catDiv.className = 'category-card';
    const catTitle = document.createElement('h2');
    catTitle.textContent = category;
    catDiv.appendChild(catTitle);
    items.forEach(item => {
      const p = document.createElement('p');
      p.className = 'intolerance-item level-' + item.level;
      p.textContent = `${item.item} (Level ${item.level})`;
      catDiv.appendChild(p);
    });
    content.appendChild(catDiv);
  }

  // Update active button
  document.querySelectorAll('.pet-button').forEach(button => {
    button.classList.toggle('active', button.dataset.pet === petName);
  });
}

// Update comparison charts and lists
function updateComparison() {
  if (!mochaData || !punkinData) return;

  // Prepare data for charts
  const categories = [...new Set([
    ...mochaData.intolerances.map(i => i.category),
    ...punkinData.intolerances.map(i => i.category)
  ])];

  // Category Chart
  const categoryData = {
    labels: categories,
    datasets: [
      {
        label: 'Mocha',
        data: categories.map(cat => 
          mochaData.intolerances.filter(i => i.category === cat).length
        ),
        backgroundColor: 'rgba(102, 51, 153, 0.5)',
        borderColor: 'rgba(102, 51, 153, 1)',
        borderWidth: 1
      },
      {
        label: 'Punkin',
        data: categories.map(cat => 
          punkinData.intolerances.filter(i => i.category === cat).length
        ),
        backgroundColor: 'rgba(255, 165, 0, 0.5)',
        borderColor: 'rgba(255, 165, 0, 1)',
        borderWidth: 1
      }
    ]
  };

  // Level Chart
  const levelData = {
    labels: ['Level 1', 'Level 2', 'Level 3'],
    datasets: [
      {
        label: 'Mocha',
        data: [1, 2, 3].map(level => 
          mochaData.intolerances.filter(i => i.level === level).length
        ),
        backgroundColor: 'rgba(102, 51, 153, 0.5)',
        borderColor: 'rgba(102, 51, 153, 1)',
        borderWidth: 1
      },
      {
        label: 'Punkin',
        data: [1, 2, 3].map(level => 
          punkinData.intolerances.filter(i => i.level === level).length
        ),
        backgroundColor: 'rgba(255, 165, 0, 0.5)',
        borderColor: 'rgba(255, 165, 0, 1)',
        borderWidth: 1
      }
    ]
  };

  // Level 3 Chart
  const level3Data = {
    labels: categories,
    datasets: [
      {
        label: 'Mocha',
        data: categories.map(cat => 
          mochaData.intolerances.filter(i => i.category === cat && i.level === 3).length
        ),
        backgroundColor: 'rgba(102, 51, 153, 0.5)',
        borderColor: 'rgba(102, 51, 153, 1)',
        borderWidth: 1
      },
      {
        label: 'Punkin',
        data: categories.map(cat => 
          punkinData.intolerances.filter(i => i.category === cat && i.level === 3).length
        ),
        backgroundColor: 'rgba(255, 165, 0, 0.5)',
        borderColor: 'rgba(255, 165, 0, 1)',
        borderWidth: 1
      }
    ]
  };

  // Pie Chart (Category Distribution)
  const pieData = {
    labels: categories,
    datasets: [
      {
        label: 'Mocha',
        data: categories.map(cat => 
          (mochaData.intolerances.filter(i => i.category === cat).length / mochaData.intolerances.length * 100).toFixed(1)
        ),
        backgroundColor: [
          'rgba(102, 51, 153, 0.5)',
          'rgba(255, 165, 0, 0.5)',
          'rgba(0, 128, 0, 0.5)',
          'rgba(255, 0, 0, 0.5)',
          'rgba(0, 0, 255, 0.5)',
          'rgba(128, 0, 128, 0.5)',
          'rgba(0, 128, 128, 0.5)'
        ]
      }
    ]
  };

  // Radar Chart
  const radarData = {
    labels: categories,
    datasets: [
      {
        label: 'Mocha',
        data: categories.map(cat => {
          const items = mochaData.intolerances.filter(i => i.category === cat);
          return items.reduce((sum, item) => sum + item.level, 0) / items.length;
        }),
        backgroundColor: 'rgba(102, 51, 153, 0.2)',
        borderColor: 'rgba(102, 51, 153, 1)',
        borderWidth: 1
      },
      {
        label: 'Punkin',
        data: categories.map(cat => {
          const items = punkinData.intolerances.filter(i => i.category === cat);
          return items.reduce((sum, item) => sum + item.level, 0) / items.length;
        }),
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        borderColor: 'rgba(255, 165, 0, 1)',
        borderWidth: 1
      }
    ]
  };

  // Create/update charts
  new Chart(document.getElementById('categoryChart'), {
    type: 'bar',
    data: categoryData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Intolerances by Category'
        }
      }
    }
  });

  new Chart(document.getElementById('levelChart'), {
    type: 'bar',
    data: levelData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Intolerances by Level'
        }
      }
    }
  });

  new Chart(document.getElementById('level3Chart'), {
    type: 'bar',
    data: level3Data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Level 3 Intolerances by Category'
        }
      }
    }
  });

  new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: pieData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Category Distribution (%)'
        }
      }
    }
  });

  new Chart(document.getElementById('radarChart'), {
    type: 'radar',
    data: radarData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Average Sensitivity by Category'
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 3
        }
      }
    }
  });

  // Update comparison lists
  const mochaItems = new Set(mochaData.intolerances.map(i => i.item));
  const punkinItems = new Set(punkinData.intolerances.map(i => i.item));

  const shared = [...mochaItems].filter(item => punkinItems.has(item));
  const mochaUnique = [...mochaItems].filter(item => !punkinItems.has(item));
  const punkinUnique = [...punkinItems].filter(item => !mochaItems.has(item));

  document.getElementById('sharedList').innerHTML = shared
    .map(item => `<p>${item}</p>`)
    .join('');
  document.getElementById('mochaUniqueList').innerHTML = mochaUnique
    .map(item => `<p>${item}</p>`)
    .join('');
  document.getElementById('punkinUniqueList').innerHTML = punkinUnique
    .map(item => `<p>${item}</p>`)
    .join('');
}

// Improved ingredient scanner function
function scanIngredients(ingredients, petData) {
  if (!petData || !petData.intolerances) {
    console.error('No pet data available');
    return [];
  }

  const matched = [];
  const ingredientsLower = ingredients.map(i => i.trim().toLowerCase());
  
  petData.intolerances.forEach(intolerance => {
    const intoleranceLower = intolerance.item.toLowerCase();
    
    // Check for exact matches
    if (ingredientsLower.includes(intoleranceLower)) {
      matched.push({
        ingredient: intolerance.item,
        category: intolerance.category,
        level: intolerance.level,
        matchType: 'exact'
      });
    } else {
      // Check for partial matches (ingredient contains intolerance or vice versa)
      for (let ingredient of ingredientsLower) {
        if (intoleranceLower.includes(ingredient) || ingredient.includes(intoleranceLower)) {
          matched.push({
            ingredient: intolerance.item,
            category: intolerance.category,
            level: intolerance.level,
            matchType: 'partial',
            matchedWith: ingredient
          });
          break;
        }
      }
    }
  });
  
  console.log("Matches found:", matched);
  return matched;
}

// Handle the scan button click
function handleScan() {
  const ingredientsInput = document.getElementById("ingredients").value;
  if (!ingredientsInput.trim()) {
    alert("Please enter ingredients to scan!");
    return;
  }

  const ingredients = ingredientsInput.split(",").map(i => i.trim());
  const currentPetData = getCurrentPetData();
  
  if (!currentPetData) {
    alert("Pet data not loaded. Please refresh the page.");
    return;
  }

  console.log("Scanning ingredients:", ingredients);
  console.log("Current pet:", currentPet);
  console.log("Current pet data:", currentPetData);

  const matches = scanIngredients(ingredients, currentPetData);
  displayResults(matches, ingredients, currentPetData);
}

// Get current pet data based on selected pet
function getCurrentPetData() {
  switch (currentPet) {
    case 'mocha': return mochaData;
    case 'punkin': return punkinData;
    default: return mochaData;
  }
}

// Display scan results
function displayResults(matches, ingredients, petData) {
  const resultsDiv = document.getElementById("results");
  
  if (matches.length === 0) {
    resultsDiv.innerHTML = `
      <div style="color: green; font-weight: bold; padding: 10px; background: #e8f5e8; border-radius: 5px;">
        ✅ No intolerances detected for ${petData.name}!
      </div>
      <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
        Scanned ingredients: ${ingredients.join(", ")}
      </div>
    `;
  } else {
    const level3Matches = matches.filter(m => m.level === 3);
    const level2Matches = matches.filter(m => m.level === 2);
    const level1Matches = matches.filter(m => m.level === 1);
    
    let resultHTML = `
      <div style="color: red; font-weight: bold; padding: 10px; background: #ffe8e8; border-radius: 5px; margin-bottom: 10px;">
        ⚠️ ${matches.length} intolerance(s) found for ${petData.name}!
      </div>
    `;
    
    if (level3Matches.length > 0) {
      resultHTML += `
        <div style="margin-bottom: 10px;">
          <h4 style="color: #d32f2f; margin: 5px 0;">🚨 Level 3 (Severe) Intolerances:</h4>
          ${level3Matches.map(m => `
            <div style="background: #ffebee; padding: 5px; margin: 2px 0; border-left: 3px solid #d32f2f;">
              <strong>${m.ingredient}</strong> (${m.category}) - ${m.matchType} match
            </div>
          `).join('')}
        </div>
      `;
    }
    
    if (level2Matches.length > 0) {
      resultHTML += `
        <div style="margin-bottom: 10px;">
          <h4 style="color: #f57c00; margin: 5px 0;">⚠️ Level 2 (Moderate) Intolerances:</h4>
          ${level2Matches.map(m => `
            <div style="background: #fff3e0; padding: 5px; margin: 2px 0; border-left: 3px solid #f57c00;">
              <strong>${m.ingredient}</strong> (${m.category}) - ${m.matchType} match
            </div>
          `).join('')}
        </div>
      `;
    }
    
    if (level1Matches.length > 0) {
      resultHTML += `
        <div style="margin-bottom: 10px;">
          <h4 style="color: #388e3c; margin: 5px 0;">⚠️ Level 1 (Mild) Intolerances:</h4>
          ${level1Matches.map(m => `
            <div style="background: #e8f5e8; padding: 5px; margin: 2px 0; border-left: 3px solid #388e3c;">
              <strong>${m.ingredient}</strong> (${m.category}) - ${m.matchType} match
            </div>
          `).join('')}
        </div>
      `;
    }
    
    resultHTML += `
      <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
        Scanned ingredients: ${ingredients.join(", ")}
      </div>
    `;
    
    resultsDiv.innerHTML = resultHTML;
  }
}

// Set current pet (called from HTML)
function setCurrentPet(petName) {
  currentPet = petName;
  console.log(`Switched to pet: ${petName}`);
}

// Initialize the application when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing application...");
  
  // Load all pet data
  loadAllPetData();
  
  // Add event listeners for pet buttons
  document.querySelectorAll('.pet-button').forEach(button => {
    button.addEventListener('click', (e) => {
      loadPetData(e.target.dataset.pet);
      setCurrentPet(e.target.dataset.pet);
    });
  });
  
  // Run a test scan after data is loaded
  setTimeout(testScanner, 2000);
});

// Test function to verify scanner is working
function testScanner() {
  console.log("Testing scanner with known triggers...");
  
  // Test with Mocha's data
  if (mochaData) {
    const testIngredients = ["Chicken", "Corn Gluten Meal", "Beef", "Carrots"];
    console.log("Testing with ingredients:", testIngredients);
    const matches = scanIngredients(testIngredients, mochaData);
    console.log("Test results:", matches);
    
    if (matches.length > 0) {
      console.log("✅ Scanner is working! Found matches:", matches);
    } else {
      console.log("❌ Scanner test failed - no matches found");
    }
  } else {
    console.log("❌ No pet data available for testing");
  }
} 