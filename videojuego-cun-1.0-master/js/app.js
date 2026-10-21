const state = {
  dashboard: null
};

const showToast = (message) => {
  const toastEl = document.getElementById('appToast');
  if (!toastEl) return;
  document.getElementById('toastMessage').textContent = message;
  bootstrap.Toast.getOrCreateInstance(toastEl).show();
};

function renderHistory(items) {
  const container = document.getElementById('historyList');
  if (!container) return;
  container.innerHTML = items.map(item => `
    <div class="history-item">
      <div class="game-badge"><i class="fa-solid ${item.icon}"></i></div>
      <div class="history-main">
        <strong class="${item.result === 'Victoria' ? 'result-win' : 'result-loss'}">${item.result}</strong>
        <small>${item.game} · ${item.opponent}</small>
      </div>
      <div class="text-end"><span class="score">${item.score}</span><span class="date">${item.date}</span></div>
    </div>`).join('');
}

function renderRanking(items) {
  const container = document.getElementById('rankingList');
  if (!container) return;
  container.innerHTML = items.map(item => `
    <div class="rank-row ${item.name === 'Storm Warriors' ? 'active' : ''}">
      <span class="rank-num">#${item.rank}</span>
      <span class="rank-team-logo">${item.short}</span>
      <span class="rank-team">${item.name}</span>
      <span class="rank-points">${item.points.toLocaleString('es-CO')} PTS</span>
    </div>`).join('');
}

function renderTournaments(items) {
  const container = document.getElementById('tournamentGrid');
  if (!container) return;
  container.innerHTML = items.map(item => `
    <div class="col-12 col-md-6 col-xl-4 tournament-entry" data-search="${(item.name + ' ' + item.game).toLowerCase()}">
      <article class="tournament-card">
        <div class="d-flex justify-content-between align-items-start gap-2"><h3>${item.name}</h3><span class="tag">${item.status}</span></div>
        <p><i class="fa-solid fa-gamepad me-1"></i>${item.game} · <i class="fa-solid fa-users me-1"></i>${item.teams} equipos</p>
        <div><span class="tag">Premio ${item.prize}</span><span class="tag">${item.date}</span></div>
        <button class="btn btn-sm btn-primary-glow tournament-btn">Participar</button>
      </article>
    </div>`).join('');

  document.querySelectorAll('.tournament-btn').forEach(btn => btn.addEventListener('click', () => showToast('Módulo de inscripción preparado.')));
}

async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error('No se pudo cargar la API');
    state.dashboard = await response.json();
  } catch (error) {
    state.dashboard = {
      stats: { wins: 28, losses: 12, played: 40, winRate: 70 },
      history: [
        {result:'Victoria', game:'Valorant', opponent:'vs Black Dragons', score:'13 - 7', date:'01/10/2026', icon:'fa-crosshairs'},
        {result:'Derrota', game:'CS:GO', opponent:'vs Night Owls', score:'8 - 16', date:'29/09/2026', icon:'fa-bomb'},
        {result:'Victoria', game:'League of Legends', opponent:'vs Steel Soldiers', score:'2 - 1', date:'27/09/2026', icon:'fa-shield-halved'}
      ],
      ranking: [
        {rank:1,name:'Shadow Reapers',short:'SR',points:1560},
        {rank:2,name:'Storm Warriors',short:'SW',points:1250},
        {rank:3,name:'Red Phoenix',short:'RP',points:1180},
        {rank:4,name:'Black Dragons',short:'BD',points:1050},
        {rank:5,name:'Night Owls',short:'NO',points:980}
      ],
      tournaments: [
        {name:'Valorant Night Cup',game:'Valorant',teams:16,prize:'$500',date:'10 Oct 2026',status:'Abierto'},
        {name:'Clash Masters',game:'CS:GO',teams:8,prize:'$300',date:'18 Oct 2026',status:'Próximo'},
        {name:'Legends Arena',game:'League of Legends',teams:12,prize:'$750',date:'25 Oct 2026',status:'Inscripciones'}
      ]
    };
  }

  document.getElementById('wins').textContent = state.dashboard.stats.wins;
  document.getElementById('losses').textContent = state.dashboard.stats.losses;
  document.getElementById('played').textContent = state.dashboard.stats.played;
  document.getElementById('winRate').textContent = state.dashboard.stats.winRate + '%';
  document.getElementById('donutRate').textContent = state.dashboard.stats.winRate + '%';
  renderHistory(state.dashboard.history);
  renderRanking(state.dashboard.ranking);
  renderTournaments(state.dashboard.tournaments);
}

document.getElementById('searchInput')?.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase().trim();
  document.querySelectorAll('.tournament-entry').forEach(card => {
    card.style.display = card.dataset.search.includes(query) ? '' : 'none';
  });
});

document.getElementById('refreshBtn')?.addEventListener('click', async () => {
  await loadDashboard();
  showToast('Datos actualizados.');
});

document.getElementById('menuBtn')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => document.getElementById('sidebar').classList.remove('open')));

document.getElementById('gameFilter')?.addEventListener('change', (event) => {
  showToast('Filtro seleccionado: ' + event.target.value);
});

loadDashboard();