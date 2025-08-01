// JavaScript file for Pet Food Intolerances application
// This file contains all the application logic

let petData = {};
let currentPet = 'mocha';

async function loadAllPetData() {
  try {
    const petFiles = ['mocha', 'punkin', 'don', 'lora'];
    const fetches = petFiles.map(name => fetch(`${name}-data.json`));
    const results = await Promise.all(fetches);

    for (let i = 0; i < petFiles.length; i++) {
      petData[petFiles[i]] = await results[i].json();
    }

    console.log('All data loaded:', petData);
    populatePetSelector(petFiles);
    updateUI(currentPet);
  } catch (error) {
    console.error('Failed to load pet data:', error);
  }
}

function populatePetSelector(pets) {
  const selector = document.querySelector('.pet-selector');
  if (!selector) return;
  
  selector.innerHTML = '';
  pets.forEach(pet => {
    const button = document.createElement('button');
    button.className = 'pet-button';
    button.dataset.pet = pet;
    button.textContent = `🐶 ${pet.charAt(0).toUpperCase() + pet.slice(1)}`;
    button.onclick = () => {
      currentPet = pet;
      updateUI(currentPet);
      // Update active button
      document.querySelectorAll('.pet-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.pet === pet);
      });
    };
    selector.appendChild(button);
  });

  // Set initial active state
  document.querySelectorAll('.pet-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.pet === currentPet);
  });
}

function updateUI(pet) {
  const data = petData[pet];
  if (!data) return;
  
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

  // Update comparison charts
  updateComparison();
}

// Update comparison charts and lists
function updateComparison() {
  const pets = Object.keys(petData);
  if (pets.length < 2) return;

  // Prepare data for charts
  const categories = [...new Set(
    pets.flatMap(pet => petData[pet].intolerances.map(i => i.category))
  )];

  // Category Chart
  const categoryData = {
    labels: categories,
    datasets: pets.map((pet, index) => ({
      label: pet.charAt(0).toUpperCase() + pet.slice(1),
      data: categories.map(cat => 
        petData[pet].intolerances.filter(i => i.category === cat).length
      ),
      backgroundColor: `hsla(${index * 90}, 70%, 50%, 0.5)`,
      borderColor: `hsla(${index * 90}, 70%, 50%, 1)`,
      borderWidth: 1
    }))
  };

  // Level Chart
  const levelData = {
    labels: ['Level 1', 'Level 2', 'Level 3'],
    datasets: pets.map((pet, index) => ({
      label: pet.charAt(0).toUpperCase() + pet.slice(1),
      data: [1, 2, 3].map(level => 
        petData[pet].intolerances.filter(i => i.level === level).length
      ),
      backgroundColor: `hsla(${index * 90}, 70%, 50%, 0.5)`,
      borderColor: `hsla(${index * 90}, 70%, 50%, 1)`,
      borderWidth: 1
    }))
  };

  // Level 3 Chart
  const level3Categories = [...new Set(
    pets.flatMap(pet => 
      petData[pet].intolerances
        .filter(i => i.level === 3)
        .map(i => i.category)
    )
  )];

  const level3Data = {
    labels: level3Categories,
    datasets: pets.map((pet, index) => ({
      label: pet.charAt(0).toUpperCase() + pet.slice(1),
      data: level3Categories.map(cat => 
        petData[pet].intolerances.filter(i => i.category === cat && i.level === 3).length
      ),
      backgroundColor: `hsla(${index * 90}, 70%, 50%, 0.5)`,
      borderColor: `hsla(${index * 90}, 70%, 50%, 1)`,
      borderWidth: 1
    }))
  };

  // Pie Chart
  const pieData = {
    labels: pets.map(pet => pet.charAt(0).toUpperCase() + pet.slice(1)),
    datasets: [{
      data: pets.map(pet => petData[pet].intolerances.length),
      backgroundColor: pets.map((pet, index) => `hsla(${index * 90}, 70%, 50%, 0.8)`),
      borderColor: pets.map((pet, index) => `hsla(${index * 90}, 70%, 50%, 1)`),
      borderWidth: 2
    }]
  };

  // Radar Chart
  const radarData = {
    labels: categories,
    datasets: pets.map((pet, index) => ({
      label: pet.charAt(0).toUpperCase() + pet.slice(1),
      data: categories.map(cat => 
        petData[pet].intolerances.filter(i => i.category === cat).length
      ),
      backgroundColor: `hsla(${index * 90}, 70%, 50%, 0.2)`,
      borderColor: `hsla(${index * 90}, 70%, 50%, 1)`,
      borderWidth: 2,
      pointBackgroundColor: `hsla(${index * 90}, 70%, 50%, 1)`,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: `hsla(${index * 90}, 70%, 50%, 1)`
    }))
  };

  // Update charts
  updateChart('categoryChart', 'bar', categoryData);
  updateChart('levelChart', 'bar', levelData);
  updateChart('level3Chart', 'bar', level3Data);
  updateChart('pieChart', 'pie', pieData);
  updateChart('radarChart', 'radar', radarData);

  // Update comparison lists
  updateComparisonLists();
}

function updateChart(canvasId, type, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart if it exists
  if (window[canvasId + 'Chart']) {
    window[canvasId + 'Chart'].destroy();
  }

  window[canvasId + 'Chart'] = new Chart(ctx, {
    type: type,
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: type === 'radar' ? {} : {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateComparisonLists() {
  const pets = Object.keys(petData);
  if (pets.length < 2) return;

  // Find shared intolerances
  const allIntolerances = pets.map(pet => 
    petData[pet].intolerances.map(i => i.item)
  );
  const shared = allIntolerances.reduce((acc, curr) => 
    acc.filter(item => curr.includes(item))
  );

  // Find unique intolerances for each pet
  const uniqueIntolerances = {};
  pets.forEach(pet => {
    const petItems = petData[pet].intolerances.map(i => i.item);
    uniqueIntolerances[pet] = petItems.filter(item => 
      !pets.filter(p => p !== pet).some(otherPet => 
        petData[otherPet].intolerances.map(i => i.item).includes(item)
      )
    );
  });

  // Update lists
  updateList('sharedList', shared);
  pets.forEach(pet => {
    updateList(pet + 'UniqueList', uniqueIntolerances[pet]);
  });
}

function updateList(listId, items) {
  const list = document.getElementById(listId);
  if (!list) return;

  list.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'intolerance-item';
    div.textContent = item;
    list.appendChild(div);
  });
}

// Scanner functionality
function scanIngredients(ingredients, petData) {
  const ingredientList = ingredients.split(',').map(i => i.trim().toLowerCase());
  const matches = [];

  petData.intolerances.forEach(intolerance => {
    const intoleranceItem = intolerance.item.toLowerCase();
    if (ingredientList.some(ingredient => 
      intoleranceItem.includes(ingredient) || ingredient.includes(intoleranceItem)
    )) {
      matches.push(intolerance);
    }
  });

  return matches;
}

function handleScan() {
  const ingredients = document.getElementById('ingredients').value;
  const data = petData[currentPet];
  
  if (!data) {
    document.getElementById('results').innerHTML = '<p style="color: red;">No pet data available</p>';
    return;
  }

  const matches = scanIngredients(ingredients, data);
  displayResults(matches, ingredients, data);
}

function displayResults(matches, ingredients, petData) {
  const resultsDiv = document.getElementById('results');
  
  if (matches.length === 0) {
    resultsDiv.innerHTML = '<p style="color: green;">✅ No intolerances found! These ingredients should be safe for ' + petData.name + '.</p>';
    return;
  }

  let html = '<p style="color: red;">⚠️ Found ' + matches.length + ' potential intolerance(s) for ' + petData.name + ':</p>';
  html += '<ul>';
  
  matches.forEach(match => {
    const levelColor = match.level === 3 ? 'red' : match.level === 2 ? 'orange' : 'yellow';
    html += `<li style="color: ${levelColor}; font-weight: bold;">${match.item} (Level ${match.level} - ${match.category})</li>`;
  });
  
  html += '</ul>';
  resultsDiv.innerHTML = html;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadAllPetData); 