// App state
let missions = []; // Empty array that will be populated from JSON
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
const favoritesStickyBtn = document.getElementById('favoritesStickyBtn');
const favoritesSidebar = document.getElementById('favoritesSidebar');
const closeFavorites = document.getElementById('closeFavorites');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const favoritesList = document.getElementById('favoritesList');
const favoritesCount = document.querySelector('.favorites-count');

// Load missions from JSON
async function loadMissions() {
  try {
    const response = await fetch('/data/missions.json'); // Adjust path as needed
    const missionsData = await response.json();
    
    // Transform JSON data to match our app structure
    missions = missionsData.map(mission => ({
      id: 'm-' + mission.id,
      name: mission.name,
      agency: mission.agency,
      launchDate: mission.launchDate,
      objective: mission.objective,
      img: mission.image,
      createdBy: 'system',
      favorite: false
    }));
    
    // Initialize the app after loading missions
    populateFilters();
    renderMissions();
    updateFavoritesCount();
  } catch (error) {
    console.error('Error loading missions:', error);
    missions = []; // Fallback to empty array
    missionsGrid.innerHTML = '<p class="no-missions">Error loading missions. Please try again later.</p>';
  }
}

// Check URL parameters on load for share functionality
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedMissionId = urlParams.get('share');
  
  if (sharedMissionId) {
    // Add blur effect to the whole page temporarily
    document.body.classList.add('blur-effect');
    
    // Scroll to and highlight the shared mission
    setTimeout(() => {
      const missionCard = document.querySelector(`[data-id="${sharedMissionId}"]`);
      if (missionCard) {
        missionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        missionCard.classList.add('card-highlight');
        
        // Remove classes after animation
        setTimeout(() => {
          missionCard.classList.remove('card-highlight');
          document.body.classList.remove('blur-effect');
        }, 2000);
      }
    }, 500);
  }
}

// Initialize
function init() {
  setupEventListeners();
  loadMissions(); // Load missions from JSON instead of hardcoded data
  checkUrlParams(); // Check for shared mission on page load
}

// Populate filter options
function populateFilters() {
  // Clear existing options (keep "all" option)
  while (filterAgency.children.length > 1) {
    filterAgency.removeChild(filterAgency.lastChild);
  }
  while (filterYear.children.length > 1) {
    filterYear.removeChild(filterYear.lastChild);
  }

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
      renderMissions();
    });
  });

  // Filter changes
  filterAgency.addEventListener('change', function() {
    filters.agency = this.value;
    renderMissions();
  });

  filterYear.addEventListener('change', function() {
    filters.year = this.value;
    renderMissions();
  });

  // Search
  searchInput.addEventListener('input', function() {
    filters.query = this.value.toLowerCase();
    renderMissions();
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

  // Favorites sidebar
  favoritesStickyBtn.addEventListener('click', openFavoritesSidebar);
  closeFavorites.addEventListener('click', closeFavoritesSidebar);
  sidebarOverlay.addEventListener('click', closeFavoritesSidebar);
}

// Favorites sidebar functions
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
        <img src="${mission.img}" alt="${mission.name}" class="favorite-card-img" onerror="this.src='https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80'">
        <div class="favorite-card-info">
          <h4>${mission.name}</h4>
          <p>${mission.agency}</p>
        </div>
        <button class="remove-favorite" title="Remove from favorites">×</button>
      </div>
    </div>
  `).join('');

  // Add event listeners to favorite cards
  favoritesList.querySelectorAll('.favorite-card').forEach(card => {
    const missionId = card.dataset.id;
    const mission = missions.find(m => m.id === missionId);
    
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-favorite')) {
        closeFavoritesSidebar();
        // Scroll to mission in main grid
        const missionCard = document.querySelector(`.mission-card[data-id="${missionId}"]`);
        if (missionCard) {
          missionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          missionCard.classList.add('card-highlight');
          setTimeout(() => missionCard.classList.remove('card-highlight'), 2000);
        }
      }
    });

    const removeBtn = card.querySelector('.remove-favorite');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mission.favorite = false;
      updateFavoritesCount();
      renderFavoritesList();
      renderMissions(); // Update main grid to reflect favorite status change
    });
  });
}

// Generate shareable URL
function generateShareUrl(missionId) {
  const currentUrl = window.location.origin + window.location.pathname;
  return `${currentUrl}?share=${missionId}`;
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (fallbackErr) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Render missions based on current filters
function renderMissions() {
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
        <button class="share-btn">🔗 Share</button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    </div>
  `;

  // Add event listeners to buttons
  const favBtn = card.querySelector('.fav-btn');
  const shareBtn = card.querySelector('.share-btn');
  const editBtn = card.querySelector('.edit-btn');
  const deleteBtn = card.querySelector('.delete-btn');

  favBtn.addEventListener('click', () => {
    mission.favorite = !mission.favorite;
    favBtn.textContent = mission.favorite ? '★ Favorited' : '☆ Favorite';
    favBtn.classList.toggle('favorited', mission.favorite);
    updateFavoritesCount();
    
    // If we're on favorites tab and unfavoriting, re-render
    if (activeTab === 'favorites' && !mission.favorite) {
      renderMissions();
    }
  });

  shareBtn.addEventListener('click', async () => {
    const shareUrl = generateShareUrl(mission.id);
    const copied = await copyToClipboard(shareUrl);
    
    if (copied) {
      // Visual feedback
      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = '✓ Copied!';
      shareBtn.style.background = 'rgba(34, 197, 94, 0.25)';
      shareBtn.style.color = '#16a34a';
      
      setTimeout(() => {
        shareBtn.innerHTML = originalText;
        shareBtn.style.background = '';
        shareBtn.style.color = '';
      }, 2000);
    } else {
      // Fallback: open in new window if copy fails
      window.open(shareUrl, '_blank');
    }
  });

  editBtn.addEventListener('click', () => openModal(mission));

  deleteBtn.addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete "${mission.name}"?`)) {
      const index = missions.findIndex(m => m.id === mission.id);
      if (index !== -1) {
        missions.splice(index, 1);
        renderMissions();
        populateFilters(); // Refresh filters in case we deleted the last mission of an agency/year
        updateFavoritesCount();
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

// Handle form submission - FIXED VERSION
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
    alert('Please fill in all required fields (Name, Agency, and Launch Date are required)');
    return;
  }
  
  // Validate date format
  if (!isValidDate(launchDate)) {
    alert('Please enter a valid launch date');
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
      mission.img = img || 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80';
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
    missions.unshift(newMission); // Add to beginning of array
  }
  
  closeModal();
  renderMissions();
  populateFilters(); // Update filters with new agency/year if needed
  updateFavoritesCount();
  
  // Show success message
  showNotification(id ? 'Mission updated successfully!' : 'Mission created successfully!');
}

// Helper function to validate date
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Show notification
function showNotification(message) {
  // Create notification element
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
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1002;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);