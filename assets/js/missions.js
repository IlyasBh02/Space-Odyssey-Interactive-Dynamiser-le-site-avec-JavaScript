// App state
let missions = [];
let activeTab = 'all';
let filters = { agency: 'all', year: 'all', query: '' };

// DOM elements
const missionsGrid = document.querySelector('.missions-grid');
const searchInput = document.getElementById('searchInput');
const filterAgency = document.getElementById('filterAgency');
const filterYear = document.getElementById('filterYear');
const createMissionBtn = document.querySelector('.create-mission-btn');
const missionModal = document.getElementById('missionModal');
const missionForm = document.getElementById('missionForm');
const modalCancel = document.querySelector('.modal-cancel');
const favoritesStickyBtn = document.getElementById('favoritesStickyBtn');
const favoritesSidebar = document.getElementById('favoritesSidebar');
const closeFavorites = document.getElementById('closeFavorites');
const printFavorites = document.getElementById('printFavorites');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const favoritesList = document.getElementById('favoritesList');
const favoritesCount = document.querySelector('.favorites-count');

// Load missions from JSON
async function loadMissions() {
  try {
    const response = await fetch('/data/missions.json');
    const missionsData = await response.json();
    
    missions = missionsData.map(mission => ({
      id: mission.id.toString(),
      name: mission.name,
      agency: mission.agency,
      launchDate: mission.launchDate,
      objective: mission.objective,
      img: mission.image,
      favorite: false
    }));

    // Load user missions from localStorage
    const userMissions = JSON.parse(localStorage.getItem('userMissions') || '[]');
    missions = [...missions, ...userMissions];
    
    populateFilters();
    renderMissions();
    updateFavoritesCount();
  } catch (error) {
    console.error('Error loading missions:', error);
    missionsGrid.innerHTML = '<p class="no-missions">Error loading missions.</p>';
  }
}

// Initialize
function init() {
  setupEventListeners();
  loadMissions();
}

// Simple notification
function showNotification(message) {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.className = 'form-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(90deg, #10b981, #34d399);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 1002;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Populate filter options
function populateFilters() {
  // Clear existing options first
  filterAgency.innerHTML = '<option value="all">All agencies</option>';
  filterYear.innerHTML = '<option value="all">All years</option>';

  // Agencies
  const agencies = [...new Set(missions.map(m => m.agency))];
  agencies.forEach(agency => {
    const option = document.createElement('option');
    option.value = agency;
    option.textContent = agency;
    filterAgency.appendChild(option);
  });

  // Years
  const years = [...new Set(missions.map(m => new Date(m.launchDate).getFullYear()))].sort((a, b) => b - a);
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
      renderMissions();
    });
  });

  // Filters
  filterAgency.addEventListener('change', () => {
    filters.agency = filterAgency.value;
    renderMissions();
  });

  filterYear.addEventListener('change', () => {
    filters.year = filterYear.value;
    renderMissions();
  });

  // Search
  searchInput.addEventListener('input', function() {
    filters.query = this.value.toLowerCase();
    renderMissions();
  });

  // Create mission button
  createMissionBtn.addEventListener('click', () => openModal());

  // Modal events
  modalCancel.addEventListener('click', closeModal);
  missionForm.addEventListener('submit', handleFormSubmit);
  missionModal.addEventListener('click', (e) => {
    if (e.target === missionModal) closeModal();
  });

  // Favorites
  favoritesStickyBtn.addEventListener('click', openFavoritesSidebar);
  closeFavorites.addEventListener('click', closeFavoritesSidebar);
  printFavorites.addEventListener('click', printFavoritesList);
  sidebarOverlay.addEventListener('click', closeFavoritesSidebar);
}

// Print favorites
function printFavoritesList() {
  window.print();
}

// Favorites sidebar
function openFavoritesSidebar() {
  favoritesSidebar.classList.add('open');
  sidebarOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  renderFavoritesList();
}

function closeFavoritesSidebar() {
  favoritesSidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function updateFavoritesCount() {
  const favoriteMissions = missions.filter(mission => mission.favorite);
  favoritesCount.textContent = favoriteMissions.length;
}

function renderFavoritesList() {
  const favoriteMissions = missions.filter(mission => mission.favorite);
  
  if (favoriteMissions.length === 0) {
    favoritesList.innerHTML = '<p class="no-favorites">No favorite missions yet.</p>';
    return;
  }

  favoritesList.innerHTML = favoriteMissions.map(mission => `
    <div class="favorite-card" data-id="${mission.id}">
      <div class="favorite-card-content">
        <img src="${mission.img}" alt="${mission.name}" class="favorite-card-img">
        <div class="favorite-card-info">
          <h4>${mission.name}</h4>
          <p>${mission.agency}</p>
        </div>
        <button class="remove-favorite">×</button>
      </div>
    </div>
  `).join('');

  // Add event listeners for favorites
  favoritesList.querySelectorAll('.remove-favorite').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const missionId = btn.closest('.favorite-card').dataset.id;
      const mission = missions.find(m => m.id === missionId);
      if (mission) {
        mission.favorite = false;
        updateFavoritesCount();
        renderFavoritesList();
        renderMissions();
        showNotification('Removed from favorites');
      }
    });
  });
}

// Share functionality
function generateShareUrl(missionId) {
  return `${window.location.origin}${window.location.pathname}?share=${missionId}`;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (e) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Render missions
function renderMissions() {
  const filteredMissions = missions.filter(mission => {
    if (activeTab === 'favorites' && !mission.favorite) return false;
    if (activeTab === 'mine' && !mission.isUserMission) return false;
    if (filters.agency !== 'all' && mission.agency !== filters.agency) return false;
    if (filters.year !== 'all' && new Date(mission.launchDate).getFullYear().toString() !== filters.year) return false;
    if (filters.query) {
      const searchText = `${mission.name} ${mission.agency} ${mission.objective}`.toLowerCase();
      if (!searchText.includes(filters.query)) return false;
    }
    return true;
  });

  missionsGrid.innerHTML = '';

  if (filteredMissions.length === 0) {
    missionsGrid.innerHTML = '<p class="no-missions">No missions found.</p>';
    return;
  }

  filteredMissions.forEach(mission => {
    missionsGrid.appendChild(createMissionCard(mission));
  });
}

// Create mission card - WITH SHARE BUTTON RESTORED!
function createMissionCard(mission) {
  const card = document.createElement('div');
  card.className = 'mission-card';
  card.dataset.id = mission.id;

  const launchDate = new Date(mission.launchDate).toLocaleDateString('fr-FR');

  card.innerHTML = `
    <div class="mission-img">
      <img src="${mission.img}" alt="${mission.name}">
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
        <button class="share-btn">🔗 Share</button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    </div>
  `;

  // Add event listeners
  const favBtn = card.querySelector('.fav-btn');
  const shareBtn = card.querySelector('.share-btn');
  const editBtn = card.querySelector('.edit-btn');
  const deleteBtn = card.querySelector('.delete-btn');

  favBtn.addEventListener('click', () => {
    mission.favorite = !mission.favorite;
    favBtn.textContent = mission.favorite ? '★ Favorited' : '☆ Favorite';
    favBtn.classList.toggle('favorited', mission.favorite);
    updateFavoritesCount();
    showNotification(mission.favorite ? 'Added to favorites!' : 'Removed from favorites');
  });

  shareBtn.addEventListener('click', async () => {
    const shareUrl = generateShareUrl(mission.id);
    if (await copyToClipboard(shareUrl)) {
      showNotification('Share link copied to clipboard!');
      shareBtn.innerHTML = '✓ Copied!';
      setTimeout(() => shareBtn.innerHTML = '🔗 Share', 2000);
    }
  });

  editBtn.addEventListener('click', () => openModal(mission));
  
  deleteBtn.addEventListener('click', () => {
    if (confirm(`Delete "${mission.name}"?`)) {
      missions = missions.filter(m => m.id !== mission.id);
      
      // Update localStorage if it was a user mission
      const userMissions = missions.filter(m => m.isUserMission);
      localStorage.setItem('userMissions', JSON.stringify(userMissions));
      
      renderMissions();
      populateFilters();
      updateFavoritesCount();
      showNotification('Mission deleted successfully');
    }
  });

  return card;
}

// Modal functions
function openModal(mission = null) {
  const modalTitle = document.getElementById('modalTitle');
  
  if (mission) {
    // Edit mission
    modalTitle.textContent = 'Edit Mission';
    document.getElementById('missionId').value = mission.id;
    document.getElementById('missionName').value = mission.name;
    document.getElementById('missionAgency').value = mission.agency;
    document.getElementById('missionLaunchDate').value = mission.launchDate;
    document.getElementById('missionObjective').value = mission.objective;
    document.getElementById('missionImage').value = mission.img;
  } else {
    // New mission
    modalTitle.textContent = 'New Mission';
    missionForm.reset();
    document.getElementById('missionId').value = '';
  }
  
  missionModal.style.display = 'flex';
}

function closeModal() {
  missionModal.style.display = 'none';
}

// Form submission - SIMPLE AND WORKING
function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('missionId').value;
  const name = document.getElementById('missionName').value;
  const agency = document.getElementById('missionAgency').value;
  const launchDate = document.getElementById('missionLaunchDate').value;
  const objective = document.getElementById('missionObjective').value;
  const img = document.getElementById('missionImage').value || 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80';

  // Simple validation
  if (!name || !agency || !launchDate) {
    showNotification('Please fill all required fields');
    return;
  }

  if (id) {
    // Update mission
    const mission = missions.find(m => m.id === id);
    if (mission) {
      mission.name = name;
      mission.agency = agency;
      mission.launchDate = launchDate;
      mission.objective = objective;
      mission.img = img;
      showNotification('Mission updated successfully!');
    }
  } else {
    // Create new mission
    const newMission = {
      id: Date.now().toString(),
      name,
      agency,
      launchDate,
      objective,
      img,
      favorite: false,
      isUserMission: true
    };
    
    missions.push(newMission);
    
    // Save to localStorage
    const userMissions = missions.filter(m => m.isUserMission);
    localStorage.setItem('userMissions', JSON.stringify(userMissions));
    
    showNotification('Mission created successfully!');
  }
  
  closeModal();
  renderMissions();
  populateFilters();
}

// Initialize
document.addEventListener('DOMContentLoaded', init);