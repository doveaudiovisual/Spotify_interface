const samplePlaylists = [
  {
    id: crypto.randomUUID(),
    name: 'Morning Run 2024',
    description: 'Upbeat and consistent tempo for 5–10k sessions.',
    tags: ['running', '2024', 'tempo'],
    lastUpdated: '2024-12-02',
    tracks: [
      { name: 'Skyline', artist: 'ODESZA', album: 'The Last Goodbye', duration: 227, energy: 0.82 },
      { name: 'Hypersonic Missiles', artist: 'Sam Fender', album: 'Hypersonic Missiles', duration: 255, energy: 0.79 },
      { name: 'Waiting All Night', artist: 'Rudimental', album: 'Home', duration: 285, energy: 0.86 },
      { name: 'Two Vines', artist: 'Empire of the Sun', album: 'Two Vines', duration: 232, energy: 0.64 },
      { name: 'Walking on a Dream', artist: 'Empire of the Sun', album: 'Walking on a Dream', duration: 228, energy: 0.61 },
      { name: 'Skyline', artist: 'ODESZA', album: 'The Last Goodbye', duration: 227, energy: 0.82 },
    ],
  },
  {
    id: crypto.randomUUID(),
    name: 'Deep Focus',
    description: 'Instrumental and low-distraction electronica.',
    tags: ['focus', 'work', 'calm'],
    lastUpdated: '2024-11-18',
    tracks: [
      { name: 'Amber Road', artist: 'Yotto', album: 'Erased Dreams', duration: 313, energy: 0.41 },
      { name: 'Nova', artist: 'Rival Consoles', album: 'Night Melody', duration: 260, energy: 0.35 },
      { name: 'Forest Hymn', artist: 'Slow Meadow', album: 'Upstream Dream', duration: 244, energy: 0.29 },
      { name: 'Reworks', artist: 'Jon Hopkins', album: 'Music for Psychedelic Therapy', duration: 301, energy: 0.38 },
      { name: 'Emeralds', artist: 'Kiasmos', album: 'Sworn', duration: 268, energy: 0.44 },
    ],
  },
  {
    id: crypto.randomUUID(),
    name: 'Sunday Cooks',
    description: 'Warm indie with a few throwback hits.',
    tags: ['home', 'family'],
    lastUpdated: '2024-12-11',
    tracks: [
      { name: 'Dog Days Are Over', artist: 'Florence + The Machine', album: 'Lungs', duration: 252, energy: 0.7 },
      { name: 'Cadillac', artist: 'Megan Moroney', album: 'Am I Okay?', duration: 187, energy: 0.63 },
      { name: 'Clearest Blue', artist: 'CHVRCHES', album: 'Every Open Eye', duration: 259, energy: 0.77 },
      { name: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', duration: 178, energy: 0.78 },
      { name: 'Dog Days Are Over', artist: 'Florence + The Machine', album: 'Lungs', duration: 252, energy: 0.7 },
    ],
  },
];

const state = {
  playlists: [...samplePlaylists],
  selectedPlaylistId: samplePlaylists[0]?.id,
  filters: {
    tag: null,
    search: '',
    sort: 'recent',
  },
  dedupeMode: false,
  queue: [],
};

const els = {
  playlistCount: document.getElementById('playlist-count'),
  playlistList: document.getElementById('playlist-list'),
  playlistSearch: document.getElementById('playlist-search'),
  playlistSort: document.getElementById('playlist-sort'),
  tagFilters: document.getElementById('tag-filters'),
  detailTitle: document.getElementById('detail-title'),
  detailSubtitle: document.getElementById('detail-subtitle'),
  detailTags: document.getElementById('detail-tags'),
  detailStats: document.getElementById('detail-stats'),
  trackTable: document.getElementById('track-table').querySelector('tbody'),
  trackCount: document.getElementById('track-count'),
  insights: document.getElementById('insights'),
  actionQueue: document.getElementById('action-queue'),
  importForm: document.getElementById('import-form'),
  importText: document.getElementById('import-text'),
  importStatus: document.getElementById('import-status'),
  useSample: document.getElementById('use-sample'),
  actionDedupe: document.getElementById('action-dedupe'),
  actionSort: document.getElementById('action-sort'),
  actionMerge: document.getElementById('action-merge'),
  actionExport: document.getElementById('action-export'),
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function plural(value, word) {
  return `${value} ${value === 1 ? word : `${word}s`}`;
}

function renderTags() {
  const tags = new Set();
  state.playlists.forEach((p) => p.tags.forEach((t) => tags.add(t)));
  els.tagFilters.innerHTML = '';
  tags.forEach((tag) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `#${tag}`;
    btn.className = `chip ${state.filters.tag === tag ? 'active' : ''}`;
    btn.addEventListener('click', () => {
      state.filters.tag = state.filters.tag === tag ? null : tag;
      renderPlaylists();
    });
    els.tagFilters.appendChild(btn);
  });
}

function sortPlaylists(list) {
  const sorted = [...list];
  switch (state.filters.sort) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'tracks-desc':
      return sorted.sort((a, b) => b.tracks.length - a.tracks.length);
    case 'tracks-asc':
      return sorted.sort((a, b) => a.tracks.length - b.tracks.length);
    default:
      return sorted.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }
}

function matchesFilter(playlist) {
  const search = state.filters.search.trim().toLowerCase();
  if (state.filters.tag && !playlist.tags.includes(state.filters.tag)) return false;
  if (!search) return true;
  return (
    playlist.name.toLowerCase().includes(search) ||
    playlist.description.toLowerCase().includes(search) ||
    playlist.tags.some((t) => t.toLowerCase().includes(search))
  );
}

function renderPlaylists() {
  els.playlistList.innerHTML = '';
  const filtered = state.playlists.filter(matchesFilter);
  const sorted = sortPlaylists(filtered);
  els.playlistCount.textContent = filtered.length;

  sorted.forEach((playlist) => {
    const li = document.createElement('li');
    li.className = `playlist-item ${playlist.id === state.selectedPlaylistId ? 'active' : ''}`;
    li.innerHTML = `
      <div class="playlist-meta">
        <strong>${playlist.name}</strong>
        <span class="badge">${plural(playlist.tracks.length, 'track')}</span>
      </div>
      <p class="subtitle">${playlist.description}</p>
      <div class="playlist-meta">
        <span>${playlist.tags.map((t) => `#${t}`).join(' ')}</span>
        <span>${new Date(playlist.lastUpdated).toLocaleDateString()}</span>
      </div>
    `;
    li.addEventListener('click', () => {
      state.selectedPlaylistId = playlist.id;
      state.dedupeMode = false;
      renderPlaylists();
      renderDetail();
    });
    els.playlistList.appendChild(li);
  });
}

function findDuplicates(tracks) {
  const map = new Map();
  tracks.forEach((track) => {
    const key = `${track.name.toLowerCase()}-${track.artist.toLowerCase()}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  const duplicates = [];
  map.forEach((count, key) => {
    if (count > 1) duplicates.push({ key, count });
  });
  return duplicates;
}

function renderTracks(playlist) {
  els.trackTable.innerHTML = '';
  const duplicates = findDuplicates(playlist.tracks);
  const duplicateKeys = new Set(duplicates.map((d) => d.key));

  if (!playlist.tracks.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = 'table-empty';
    cell.textContent = 'No tracks yet. Import from Spotify or start merging playlists.';
    row.appendChild(cell);
    els.trackTable.appendChild(row);
    return;
  }

  playlist.tracks.forEach((track) => {
    const key = `${track.name.toLowerCase()}-${track.artist.toLowerCase()}`;
    const row = document.createElement('tr');
    if (state.dedupeMode && duplicateKeys.has(key)) {
      row.classList.add('duplicate');
    }
    row.innerHTML = `
      <td>${track.name}</td>
      <td>${track.artist}</td>
      <td>${track.album}</td>
      <td class="numeric">${formatDuration(track.duration)}</td>
    `;
    els.trackTable.appendChild(row);
  });
}

function renderStats(playlist) {
  els.detailStats.innerHTML = '';
  const totalDuration = playlist.tracks.reduce((acc, t) => acc + t.duration, 0);
  const avgEnergy = playlist.tracks.length
    ? playlist.tracks.reduce((acc, t) => acc + (t.energy ?? 0.5), 0) / playlist.tracks.length
    : 0;
  const cards = [
    { label: 'Tracks', value: plural(playlist.tracks.length, 'track') },
    { label: 'Play time', value: `${Math.floor(totalDuration / 60)} min` },
    { label: 'Avg energy', value: `${Math.round(avgEnergy * 100)} / 100` },
    { label: 'Updated', value: new Date(playlist.lastUpdated).toLocaleDateString() },
  ];

  cards.forEach((card) => {
    const div = document.createElement('div');
    div.className = 'stat-card';
    div.innerHTML = `
      <div class="stat-value">${card.value}</div>
      <p class="stat-label">${card.label}</p>
    `;
    els.detailStats.appendChild(div);
  });
}

function renderInsights(playlist) {
  els.insights.innerHTML = '';
  const duplicates = findDuplicates(playlist.tracks);
  const overlap = computeOverlap();
  const insights = [];

  if (duplicates.length) {
    insights.push(`Found ${duplicates.length} duplicate titles inside this playlist. Dedupe removes ${duplicates.reduce((a, b) => a + (b.count - 1), 0)} tracks.`);
  } else {
    insights.push('No duplicates detected inside this playlist.');
  }

  const highEnergy = playlist.tracks.filter((t) => (t.energy ?? 0.5) > 0.75).length;
  if (highEnergy) {
    insights.push(`${highEnergy} tracks are high-energy — great for workouts. Consider splitting to keep the mood consistent.`);
  }

  if (overlap.top.length) {
    const top = overlap.top
      .slice(0, 3)
      .map((t) => `${t.name} by ${t.artist} (${t.count} lists)`)
      .join('; ');
    insights.push(`Top cross-playlist repeats: ${top}. Helpful for building a "core favorites" set.`);
  }

  insights.forEach((text) => {
    const li = document.createElement('li');
    li.className = 'insight';
    li.textContent = text;
    els.insights.appendChild(li);
  });
}

function renderActionQueue() {
  els.actionQueue.innerHTML = '';
  if (!state.queue.length) {
    const li = document.createElement('li');
    li.className = 'insight';
    li.textContent = 'No queued changes. Run a scan or select playlists to merge.';
    els.actionQueue.appendChild(li);
    return;
  }

  state.queue.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'insight';
    li.innerHTML = `<strong>${item.title}:</strong> ${item.detail}`;
    els.actionQueue.appendChild(li);
  });
}

function renderDetail() {
  const playlist = state.playlists.find((p) => p.id === state.selectedPlaylistId);
  if (!playlist) return;

  els.detailTitle.textContent = playlist.name;
  els.detailSubtitle.textContent = playlist.description;
  els.detailTags.innerHTML = '';
  playlist.tags.forEach((tag) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = `#${tag}`;
    els.detailTags.appendChild(span);
  });

  renderStats(playlist);
  renderTracks(playlist);
  renderInsights(playlist);
  els.trackCount.textContent = playlist.tracks.length;
}

function computeOverlap() {
  const map = new Map();
  state.playlists.forEach((playlist) => {
    playlist.tracks.forEach((track) => {
      const key = `${track.name.toLowerCase()}-${track.artist.toLowerCase()}`;
      const existing = map.get(key) || { ...track, count: 0 };
      existing.count += 1;
      map.set(key, existing);
    });
  });
  const values = Array.from(map.values()).filter((v) => v.count > 1);
  values.sort((a, b) => b.count - a.count);
  return { top: values };
}

function setStatus(text, isError = false) {
  els.importStatus.textContent = text;
  els.importStatus.style.color = isError ? 'var(--danger)' : 'var(--muted)';
}

function importPlaylists(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    const normalized = (Array.isArray(parsed) ? parsed : [parsed])
      .filter((p) => p?.name)
      .map((p) => ({
        id: crypto.randomUUID(),
        name: p.name,
        description: p.description || 'Imported from Spotify data',
        tags: p.tags || ['import'],
        lastUpdated: new Date().toISOString(),
        tracks: Array.isArray(p.tracks)
          ? p.tracks.map((t) => ({
              name: t.name || 'Untitled',
              artist: t.artist || 'Unknown',
              album: t.album || 'Unknown',
              duration: Number(t.duration) || 200,
              energy: typeof t.energy === 'number' ? t.energy : 0.5,
            }))
          : [],
      }));

    if (!normalized.length) throw new Error('No playlists detected.');

    state.playlists.unshift(...normalized);
    state.selectedPlaylistId = normalized[0].id;
    renderTags();
    renderPlaylists();
    renderDetail();
    setStatus(`Added ${plural(normalized.length, 'playlist')} to your workspace.`);
  } catch (error) {
    console.error(error);
    setStatus('Could not import playlists. Check your JSON and try again.', true);
  }
}

function exportPlan() {
  const payload = {
    generatedAt: new Date().toISOString(),
    playlists: state.playlists.map((p) => ({
      name: p.name,
      tags: p.tags,
      proposedActions: state.queue.filter((q) => q.playlistId === p.id || q.playlistId === 'global'),
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'spotify-organizer-plan.json';
  link.click();
  URL.revokeObjectURL(url);
  setStatus('Exported plan JSON. Use it to track cleanup steps.');
}

function attachEventListeners() {
  els.playlistSearch.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderPlaylists();
  });

  els.playlistSort.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    renderPlaylists();
  });

  els.importForm.addEventListener('submit', (e) => {
    e.preventDefault();
    importPlaylists(els.importText.value);
  });

  els.useSample.addEventListener('click', (e) => {
    e.preventDefault();
    els.importText.value = JSON.stringify(
      [{
        name: 'Release Radar backup',
        description: 'Copy of weekly radar before pruning.',
        tags: ['radar', 'backlog'],
        tracks: [
          { name: 'Greedy', artist: 'Tate McRae', album: 'Think Later', duration: 175, energy: 0.73 },
          { name: 'Iris', artist: 'The Goo Goo Dolls', album: 'Dizzy Up the Girl', duration: 267, energy: 0.55 },
          { name: 'Skyline', artist: 'ODESZA', album: 'The Last Goodbye', duration: 227, energy: 0.82 },
        ],
      }],
      null,
      2
    );
  });

  els.actionDedupe.addEventListener('click', () => {
    const playlist = state.playlists.find((p) => p.id === state.selectedPlaylistId);
    if (!playlist) return;
    const duplicates = findDuplicates(playlist.tracks);
    state.dedupeMode = true;
    renderTracks(playlist);
    if (duplicates.length) {
      state.queue.push({
        title: 'Dedupe',
        detail: `${playlist.name}: remove ${duplicates.reduce((a, b) => a + (b.count - 1), 0)} duplicated tracks`,
        playlistId: playlist.id,
      });
    }
    renderActionQueue();
  });

  els.actionSort.addEventListener('click', () => {
    const playlist = state.playlists.find((p) => p.id === state.selectedPlaylistId);
    if (!playlist) return;
    playlist.tracks.sort((a, b) => a.name.localeCompare(b.name));
    state.queue.push({
      title: 'Sort',
      detail: `${playlist.name}: reorder tracks alphabetically before export`,
      playlistId: playlist.id,
    });
    renderTracks(playlist);
    renderActionQueue();
  });

  els.actionMerge.addEventListener('click', () => {
    const playlist = state.playlists.find((p) => p.id === state.selectedPlaylistId);
    if (!playlist) return;
    state.queue.push({
      title: 'Merge candidate',
      detail: `${playlist.name} added to merge queue. Combine with another playlist to publish.`,
      playlistId: playlist.id,
    });
    renderActionQueue();
  });

  els.actionExport.addEventListener('click', () => {
    exportPlan();
  });
}

function init() {
  renderTags();
  renderPlaylists();
  renderDetail();
  renderActionQueue();
  attachEventListeners();
}

init();
