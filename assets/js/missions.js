// Sample mission data
const missions = [
  {
    id: 'm-apollo11',
    name: 'Apollo 11',
    agency: 'NASA',
    launchDate: '1969-07-16',
    objective: "Premier alunissage habité et retour en sécurité de l'équipage.",
    img: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80',
    createdBy: 'system',
    favorite: false
  },
  {
    id: 'm-voyager1',
    name: 'Voyager 1',
    agency: 'NASA',
    launchDate: '1977-09-05',
    objective: 'Survol des planètes externes et étude du milieu interstellaire.',
    img: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80',
    createdBy: 'system',
    favorite: true
  },
  {
    id: 'm-hubble',
    name: 'Hubble Space Telescope',
    agency: 'NASA/ESA',
    launchDate: '1990-04-24',
    objective: 'Observations optiques et UV depuis l\'orbite terrestre.',
    img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80',
    createdBy: 'system',
    favorite: false
  },
  {
    id: 'm-curiosity',
    name: 'Curiosity Rover',
    agency: 'NASA',
    launchDate: '2011-11-26',
    objective: 'Exploration géologique de Mars et recherche de conditions favorables à la vie.',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80',
    createdBy: 'system',
    favorite: true
  },
  {
    id: 'm-artemis1',
    name: 'Artemis I',
    agency: 'NASA',
    launchDate: '2022-11-16',
    objective: 'Vol d\'essai non habité autour de la Lune pour préparer le retour des humains.',
    img: 'https://images.unsplash.com/photo-1446776899648-aa7856967a87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    createdBy: 'system',
    favorite: false
  },
  {
    id: 'm-jameswebb',
    name: 'James Webb Telescope',
    agency: 'NASA/ESA/CSA',
    launchDate: '2021-12-25',
    objective: 'Observation de l\'univers dans l\'infrarouge pour étudier les premières galaxies.',
    img: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    createdBy: 'system',
    favorite: true
  }
];

// App state
let activeTab = 'all';
let filters = { agency: 'all', year: 'all', query: '' };
let currentEditMission = null;

// DOM elements
const missionsGrid = document.querySelector('.missions-grid');
const searchInput = document.getElementById('searchInput');
const filterAgency = document.getElementById('filterAgency');
const filterYear = document.getElementById('filterYear');
const createMissionBtn = document.querySelector('.create-mission-btn');
const missionModal = document.getElementById('missionModal');
const missionForm = document.getElementById('missionForm');
const modalCancel = document.querySelector('.modal-cancel');

// Initialize
function init() {
  populateFilters();
  AddMission();
  setupEventListeners();
}

// Populate filter options
function populateFilters() {
  // Agencies
  const agencies = [...new Set(missions.map(m => m.agency))];
  agencies.forEach(agency => {
    const option = document.createElement('option');
    option.value = agency;
    option.textContent = agency;
    filterAgency.appendChild(option);
  });

  // Years
  const years = [...new Set(missions.map(m => {
    const date = new Date(m.launchDate);
    return date.getFullYear();
  }))].sort((a, b) => b - a);
  
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    filterYear.appendChild(option);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeTab = this.dataset.tab;
      AddMission();
    });
  });

  // Filter changes
  filterAgency.addEventListener('change', function() {
    filters.agency = this.value;
    AddMission();
  });

  filterYear.addEventListener('change', function() {
    filters.year = this.value;
    AddMission();
  });

  // Search
  searchInput.addEventListener('input', function() {
    filters.query = this.value.toLowerCase();
    AddMission();
  });

  // Create mission button
  createMissionBtn.addEventListener('click', openModal);

  // Modal events
  modalCancel.addEventListener('click', closeModal);
  missionForm.addEventListener('submit', handleFormSubmit);

  // Close modal when clicking outside
  missionModal.addEventListener('click', function(e) {
    if (e.target === missionModal) {
      closeModal();
    }
  });
}

// Render missions based on current filters
function AddMission() {
  const filteredMissions = missions.filter(mission => {
    // Tab filtering
    if (activeTab === 'favorites' && !mission.favorite) return false;
    if (activeTab === 'mine' && mission.createdBy !== 'user') return false;

    // Agency filter
    if (filters.agency !== 'all' && mission.agency !== filters.agency) return false;

    // Year filter
    if (filters.year !== 'all') {
      const missionYear = new Date(mission.launchDate).getFullYear().toString();
      if (missionYear !== filters.year) return false;
    }

    // Search query
    if (filters.query) {
      const searchText = `${mission.name} ${mission.agency} ${mission.objective}`.toLowerCase();
      if (!searchText.includes(filters.query)) return false;
    }

    return true;
  });

  missionsGrid.innerHTML = '';

  if (filteredMissions.length === 0) {
    missionsGrid.innerHTML = '<p class="no-missions">No missions found matching your criteria.</p>';
    return;
  }

  filteredMissions.forEach(mission => {
    const missionCard = createMissionCard(mission);
    missionsGrid.appendChild(missionCard);
  });
}

// Create a mission card element
function createMissionCard(mission) {
  const card = document.createElement('div');
  card.className = 'mission-card';
  card.dataset.id = mission.id;

  const launchDate = new Date(mission.launchDate).toLocaleDateString('fr-FR');

  card.innerHTML = `
    <div class="mission-img">
      <img src="${mission.img}" alt="${mission.name}" onerror="this.src='https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80'">
    </div>
    <div class="mission-info">
      <h2>${mission.name}</h2>
      <div class="mission-meta">
        <span><strong>Agence:</strong> ${mission.agency}</span>
        <span><strong>Lancement:</strong> ${launchDate}</span>
      </div>
      <p class="mission-obj">${mission.objective}</p>
      <div class="mission-actions">
        <button class="fav-btn ${mission.favorite ? 'favorited' : ''}">
          ${mission.favorite ? '★ Favorited' : '☆ Favorite'}
        </button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    </div>
  `;

  // Add event listeners to buttons
  const favBtn = card.querySelector('.fav-btn');
  const editBtn = card.querySelector('.edit-btn');
  const deleteBtn = card.querySelector('.delete-btn');

  favBtn.addEventListener('click', () => {
    mission.favorite = !mission.favorite;
    favBtn.textContent = mission.favorite ? '★ Favorited' : '☆ Favorite';
    favBtn.classList.toggle('favorited', mission.favorite);
  });

  editBtn.addEventListener('click', () => openModal(mission));

  deleteBtn.addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete "${mission.name}"?`)) {
      const index = missions.findIndex(m => m.id === mission.id);
      if (index !== -1) {
        missions.splice(index, 1);
        AddMission();
        populateFilters(); // Refresh filters in case we deleted the last mission of an agency/year
      }
    }
  });

  return card;
}

// Open modal for creating/editing missions
function openModal(mission = null) {
  currentEditMission = mission;
  const form = document.getElementById('missionForm');
  
  if (mission) {
    // Editing existing mission
    document.getElementById('missionId').value = mission.id;
    document.getElementById('missionName').value = mission.name;
    document.getElementById('missionAgency').value = mission.agency;
    document.getElementById('missionLaunchDate').value = mission.launchDate;
    document.getElementById('missionObjective').value = mission.objective;
    document.getElementById('missionImage').value = mission.img;
  } else {
    // Creating new mission
    form.reset();
    document.getElementById('missionId').value = '';
  }
  
  missionModal.style.display = 'flex';
}

// Close modal
function closeModal() {
  missionModal.style.display = 'none';
  currentEditMission = null;
}

// Handle form submission
function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('missionId').value;
  const name = document.getElementById('missionName').value.trim();
  const agency = document.getElementById('missionAgency').value.trim();
  const launchDate = document.getElementById('missionLaunchDate').value;
  const objective = document.getElementById('missionObjective').value.trim();
  const img = document.getElementById('missionImage').value.trim();
  
  // Validation
  if (!name || !agency || !launchDate) {
    alert('Please fill in all required fields');
    return;
  }
  
  if (id) {
    // Update existing mission
    const mission = missions.find(m => m.id === id);
    if (mission) {
      mission.name = name;
      mission.agency = agency;
      mission.launchDate = launchDate;
      mission.objective = objective;
      mission.img = img;
    }
  } else {
    // Create new mission
    const newMission = {
      id: 'm-' + Date.now(),
      name,
      agency,
      launchDate,
      objective,
      img: img || 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80',
      createdBy: 'user',
      favorite: false
    };
    missions.unshift(newMission);
  }
  
  closeModal();
  AddMission();
  populateFilters();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);