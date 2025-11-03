
(function(){
  // Local storage key
  const STORAGE_KEY = 'so_missions_v1';

  // Sample missions (used only when no data in localStorage)
  const SAMPLE_MISSIONS = [
    // {
    //   id: 'm-apollo11',
    //   name: 'Apollo 11',
    //   agency: 'NASA',
    //   launchDate: '1969-07-16',
    //   objective: "Premier alunissage habité et retour en sécurité de l’équipage.",
    //   img: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Apollo_11_insignia.png',
    //   createdBy: 'system',
    //   favorite: false
    // },
    // {
    //   id: 'm-voyager1',
    //   name: 'Voyager 1',
    //   agency: 'NASA',
    //   launchDate: '1977-09-05',
    //   objective: 'Survol des planètes externes et étude du milieu interstellaire.',
    //   img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Voyager_spacecraft.jpg/500px-Voyager_spacecraft.jpg',
    //   createdBy: 'system',
    //   favorite: false
    // },
    // {
    //   id: 'm-hubble',
    //   name: 'Hubble Space Telescope',
    //   agency: 'NASA/ESA',
    //   launchDate: '1990-04-24',
    //   objective: 'Observations optiques et UV depuis l’orbite terrestre.',
    //   img: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/HST-SM4.jpeg',
    //   createdBy: 'system',
    //   favorite: false
    // }
  ];

  // App state
  let missions = [];
  let activeTab = 'all'; // all, favorites, mine
  let filters = { agency: 'all', year: 'all', query: '' };

  // Helpers
  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  }

  async function load(){
    const raw = localStorage.getItem(STORAGE_KEY);
  // ✅ Otherwise: try load from missions.json (try multiple relative paths to support file:// and servers)
  const candidatePaths = ['/missions.json'];
  let loaded = false;
  for (const p of candidatePaths) {
    try {
      console.log(`📂 Attempting to load missions.json from: ${p}`);
      const response = await fetch(p);
      if (!response.ok) {
        console.warn(`Fetch to ${p} returned status ${response.status}`);
        continue;
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn(`Invalid JSON from ${p} - expected array`);
        continue;
      }

      // Map JSON data to our mission structure
      missions = data.map(m => ({
        id: 'm-' + m.id,
        name: m.name,
        agency: m.agency,
        launchDate: m.launchDate,
        objective: m.objective,
        img: m.image || m.img || '', // accept either field
        createdBy: 'system',
        favorite: false
      }));

      console.log(`✅ Successfully loaded ${missions.length} missions from ${p}`);
      save();
      loaded = true;
      break;
    } catch (e) {
      console.warn(`Error fetching/parsing ${p}:`, e && e.message ? e.message : e);
      // try next path
    }
  }
  if (!loaded) {
    console.error("❌ Could not load missions.json from any known path. Falling back to empty list.");
    missions = [];
  }
  }

  function formatDisplayDate(iso){
    if(!iso) return '';
    try{
      const d = new Date(iso);
      if(isNaN(d)) return iso;
      return d.toLocaleDateString();
    }catch(e){
      return iso;
    }
  }

  // Render controls (tabs, filters, new mission button)
  function renderControls(){
    const container = document.querySelector('.missions-section');
    if(!container) return;

    // toolbar wrapper
    let toolbar = document.querySelector('.missions-toolbar');
    if(!toolbar){
      toolbar = document.createElement('div');
      toolbar.className = 'missions-toolbar';
      container.insertBefore(toolbar, container.querySelector('.missions-grid'));
    }

    toolbar.innerHTML = '';

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'missions-tabs';
    tabs.innerHTML = `
      <button data-tab="all" class="tab-btn">All Missions</button>
      <button data-tab="favorites" class="tab-btn">Favorites</button>
      <button data-tab="mine" class="tab-btn">My Missions</button>
    `;
    toolbar.appendChild(tabs);

    // Filters
    const filterWrap = document.createElement('div');
    filterWrap.style.display = 'flex';
    filterWrap.style.gap = '8px';
    filterWrap.style.alignItems = 'center';

    // Agency select
    const agencySelect = document.createElement('select');
    agencySelect.id = 'filterAgency';
    agencySelect.innerHTML = '<option value="all">All agencies</option>';
    filterWrap.appendChild(agencySelect);

    // Year select
    const yearSelect = document.createElement('select');
    yearSelect.id = 'filterYear';
    yearSelect.innerHTML = '<option value="all">All years</option>';
    filterWrap.appendChild(yearSelect);

    // New mission button
    const newBtn = document.createElement('button');
    newBtn.textContent = 'New Mission';
    newBtn.className = 'create-mission-btn';
    newBtn.addEventListener('click', ()=>openModal());
    filterWrap.appendChild(newBtn);

    toolbar.appendChild(filterWrap);

    // Wire tab clicks
    tabs.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-tab]');
      if(!btn) return;
      activeTab = btn.dataset.tab;
      Array.from(tabs.querySelectorAll('.tab-btn')).forEach(b=>b.classList.toggle('active', b===btn));
      renderMissions();
    });

    // populate agency/year options
    populateFilterOptions();

    document.getElementById('filterAgency').addEventListener('change', (e)=>{ filters.agency = e.target.value; renderMissions(); });
    document.getElementById('filterYear').addEventListener('change', (e)=>{ filters.year = e.target.value; renderMissions(); });
  }

  function populateFilterOptions(){
    const agencies = new Set(missions.map(m=>m.agency));
    const agencySelect = document.getElementById('filterAgency');
    agencySelect.innerHTML = '<option value="all">All agencies</option>';
    agencies.forEach(a=>{
      const opt = document.createElement('option'); opt.value = a; opt.textContent = a; agencySelect.appendChild(opt);
    });

    const years = new Set(missions.map(m=>{ try{ return new Date(m.launchDate).getFullYear(); }catch(e){ return 'unknown'; }}));
    const yearSelect = document.getElementById('filterYear');
    yearSelect.innerHTML = '<option value="all">All years</option>';
    Array.from(years).sort().forEach(y=>{ const opt = document.createElement('option'); opt.value = y; opt.textContent = y; yearSelect.appendChild(opt); });
  }

  // Core render function
  function renderMissions(){
    const grid = document.querySelector('.missions-grid');
    if(!grid) return;
    grid.innerHTML = '';

    const q = filters.query.trim().toLowerCase();

    const list = missions.filter(m=>{
      // Tab filtering
      if(activeTab === 'favorites' && !m.favorite) return false;
      if(activeTab === 'mine' && m.createdBy !== 'user') return false;

      // Agency filter
      if(filters.agency !== 'all' && m.agency !== filters.agency) return false;
      // Year filter
      if(filters.year !== 'all'){
        const y = (m.launchDate && !isNaN(new Date(m.launchDate))) ? new Date(m.launchDate).getFullYear().toString() : '';
        if(y !== filters.year) return false;
      }

      // Search query across name, agency, objective, date
      if(q){
        const hay = (m.name + ' ' + m.agency + ' ' + m.objective + ' ' + (m.launchDate||'')).toLowerCase();
        return hay.includes(q);
      }

      return true;
    });

    if(list.length === 0){
      const empty = document.createElement('div');
      empty.textContent = 'No missions found.';
      grid.appendChild(empty);
      return;
    }

    list.forEach(m=>{
      const art = document.createElement('article'); art.className = 'mission-card';
      art.dataset.id = m.id;

      art.innerHTML = `
        <div class="mission-img"><img loading="lazy" src="${m.img||''}" alt="${m.name}"></div>
        <div class="mission-info">
          <h2>${m.name}</h2>
          <div class="mission-meta"><strong>Agence:</strong> ${m.agency} • <strong>Lancement:</strong> ${formatDisplayDate(m.launchDate)}</div>
          <p class="mission-obj">${m.objective}</p>
          <div class="mission-actions" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="fav-btn">${m.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn" style="color:#900">Delete</button>
          </div>
        </div>
      `;

      // events
      art.querySelector('.fav-btn').addEventListener('click', ()=>{
        m.favorite = !m.favorite; save(); renderMissions();
      });
      art.querySelector('.edit-btn').addEventListener('click', ()=>openModal(m));
      art.querySelector('.delete-btn').addEventListener('click', ()=>{
        if(confirm('Delete mission "' + m.name + '"?')){
          missions = missions.filter(x=>x.id !== m.id); save(); populateFilterOptions(); renderMissions();
        }
      });

      grid.appendChild(art);
    });
  }

  // Search wiring
  function setupSearch(){
    const searchInput = document.getElementById('searchInput');
    if(!searchInput) return;
    searchInput.addEventListener('input', (e)=>{
      filters.query = e.target.value;
      renderMissions();
    });
  }

  // Modal: create/edit mission
  let modalEl = null;

  function openModal(mission){
    // Create modal if needed
    if(!modalEl){
      modalEl = document.createElement('div');
      modalEl.className = 'missions-modal';
      modalEl.style.position = 'fixed';
      modalEl.style.left = 0; modalEl.style.top = 0; modalEl.style.right = 0; modalEl.style.bottom = 0;
      modalEl.style.display = 'flex'; modalEl.style.alignItems = 'center'; modalEl.style.justifyContent = 'center';
      modalEl.style.background = 'rgba(0,0,0,0.5)';
      modalEl.innerHTML = `
        <div class="modal-card" style="background:white;padding:18px;border-radius:8px;max-width:600px;width:100%">
          <h3 class="modal-title">Mission</h3>
          <form id="missionForm" novalidate>
            <input type="hidden" name="id" />
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <div style="flex:1;min-width:200px">
                <label>Name<span style="color:#900">*</span></label>
                <input name="name" type="text" class="modal-input" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px" />
                <div class="error" style="color:#900;font-size:0.9em;height:16px"></div>
              </div>
              <div style="flex:1;min-width:160px">
                <label>Agency<span style="color:#900">*</span></label>
                <input name="agency" type="text" class="modal-input" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px" />
                <div class="error" style="color:#900;font-size:0.9em;height:16px"></div>
              </div>
            </div>
            <div style="margin-top:8px">
              <label>Launch Date<span style="color:#900">*</span></label>
              <input name="launchDate" type="date" class="modal-input" style="width:200px;padding:8px;border:1px solid #ccc;border-radius:6px" />
              <div class="error" style="color:#900;font-size:0.9em;height:16px"></div>
            </div>
            <div style="margin-top:8px">
              <label>Objective</label>
              <textarea name="objective" rows="3" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px"></textarea>
            </div>
            <div style="margin-top:8px">
              <label>Image URL</label>
              <input name="img" type="text" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px" />
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
              <button type="button" id="modalCancel">Cancel</button>
              <button type="submit" id="modalSave">Save</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modalEl);

      // events
      modalEl.addEventListener('click', (e)=>{ if(e.target === modalEl) closeModal(); });
      modalEl.querySelector('#modalCancel').addEventListener('click', closeModal);
      modalEl.querySelector('#missionForm').addEventListener('submit', onModalSubmit);
    }

    // populate form
    const form = modalEl.querySelector('#missionForm');
    form.reset();
    form.querySelector('input[name="id"]').value = mission ? mission.id : '';
    form.querySelector('input[name="name"]').value = mission ? mission.name : '';
    form.querySelector('input[name="agency"]').value = mission ? mission.agency : '';
    form.querySelector('input[name="launchDate"]').value = mission ? mission.launchDate : '';
    form.querySelector('textarea[name="objective"]').value = mission ? mission.objective : '';
    form.querySelector('input[name="img"]').value = mission ? mission.img : '';

    // clear errors
    Array.from(form.querySelectorAll('.error')).forEach(e=>e.textContent='');
    modalEl.style.display = 'flex';
  }

  function closeModal(){ if(modalEl) modalEl.style.display = 'none'; }

  function onModalSubmit(e){
    e.preventDefault();
    const form = e.target;
    const id = form.querySelector('input[name="id"]').value;
    const name = form.querySelector('input[name="name"]').value.trim();
    const agency = form.querySelector('input[name="agency"]').value.trim();
    const launchDate = form.querySelector('input[name="launchDate"]').value;
    const objective = form.querySelector('textarea[name="objective"]').value.trim();
    const img = form.querySelector('input[name="img"]').value.trim();

    // simple validation
    let valid = true;
    // clear errors
    const errorEls = form.querySelectorAll('.error'); Array.from(errorEls).forEach(e=>e.textContent='');

    if(!name){ form.querySelector('input[name="name"]').style.borderColor='#900'; form.querySelector('input[name="name"]').nextElementSibling.textContent = 'Required'; valid = false; } else { form.querySelector('input[name="name"]').style.borderColor='#0a0'; }
    if(!agency){ form.querySelector('input[name="agency"]').style.borderColor='#900'; form.querySelector('input[name="agency"]').nextElementSibling.textContent = 'Required'; valid = false; } else { form.querySelector('input[name="agency"]').style.borderColor='#0a0'; }
    if(!launchDate){ form.querySelector('input[name="launchDate"]').style.borderColor='#900'; form.querySelector('input[name="launchDate"]').nextElementSibling.textContent = 'Required'; valid = false; } else { form.querySelector('input[name="launchDate"]').style.borderColor='#0a0'; }

    if(!valid) return;

    if(id){
      // update
      const m = missions.find(x=>x.id === id);
      if(m){ m.name = name; m.agency = agency; m.launchDate = launchDate; m.objective = objective; m.img = img; }
    } else {
      // create
      const newMission = { id: 'm-' + Date.now(), name, agency, launchDate, objective, img, favorite:false, createdBy:'user' };
      missions.unshift(newMission);
    }

    save(); populateFilterOptions(); renderMissions(); closeModal();
  }

  // Init
  async function init(){
    await load();
    renderControls();
    setupSearch();
    renderMissions();
  }

  // Run on DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
