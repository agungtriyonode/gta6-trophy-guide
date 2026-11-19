// Leonida Legend — GTA 6 trophy guide and tracker.
// Everything runs offline: the trophy list comes from data/trophies.json, and
// progress lives in this browser's localStorage until the player exports it.
const STORE_KEY = 'leonida-legend-progress-v1';
const SPOILER_KEY = 'leonida-legend-hide-spoilers';

const listEl = document.getElementById('trophy-list');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const statusEl = document.getElementById('status');
const spoilerEl = document.getElementById('spoiler');
const detailEl = document.getElementById('detail');
const onlineNote = document.getElementById('online-note');
const emptyNote = document.getElementById('empty-note');
const importStatus = document.getElementById('import-status');

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

let earned = new Set();
try {
  earned = new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]').filter((id) => byId.has(id)));
} catch {
  earned = new Set();
}
let hideSpoilers = localStorage.getItem(SPOILER_KEY) === '1';
spoilerEl.checked = hideSpoilers;

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned]));
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind === 'online' ? 'Online' : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function isHidden(t) {
  return hideSpoilers && t.story && !earned.has(t.id);
}

function updateProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-text').textContent = `${done} of ${total} earned · ${pct}%`;
  const counts = {};
  for (const t of trophies) counts[t.grade] = (counts[t.grade] ?? 0) + (earned.has(t.id) ? 1 : 0);
  const totals = {};
  for (const t of trophies) totals[t.grade] = (totals[t.grade] ?? 0) + 1;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('progress-grade').textContent =
    `Platinum ${counts.platinum ?? 0}/${totals.platinum ?? 0} · Gold ${counts.gold ?? 0}/${totals.gold ?? 0} · Silver ${counts.silver ?? 0}/${totals.silver ?? 0} · Bronze ${counts.bronze ?? 0}/${totals.bronze ?? 0}`;
  for (const stage of [1, 2, 3, 4, 5]) {
    const inStage = trophies.filter((t) => t.roadmap_stage === stage);
    const got = inStage.filter((t) => earned.has(t.id)).length;
    const slot = document.querySelector(`[data-stage="${stage}"]`);
    if (slot) slot.textContent = `${got} of ${inStage.length} earned in this stage`;
  }
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindEl.value === 'online') return false;
    if (kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (statusEl.value === 'earned' && !earned.has(t.id)) return false;
    if (statusEl.value === 'unearned' && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderList() {
  onlineNote.hidden = kindEl.value !== 'online';
  const shown = visibleTrophies();
  emptyNote.hidden = shown.length > 0;
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'card' + (earned.has(t.id) ? ' earned' : '') + (t.missable ? ' missable-card' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      save();
      updateProgress();
      renderList();
      if (detailEl.hidden === false) showDetail(t.id);
    });
    const body = document.createElement('div');
    const title = document.createElement('h3');
    const link = document.createElement('a');
    link.href = `#trophy=${t.id}`;
    link.textContent = isHidden(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
    title.append(link);
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = isHidden(t) ? 'Spoilers hidden. Tick it off once you earn it in the story.' : t.description;
    const guide = document.createElement('p');
    guide.className = 'guide';
    guide.textContent = isHidden(t) ? '' : t.guide;
    const tags = document.createElement('div');
    tags.className = 'tags';
    for (const [text, cls] of [
      [kindLabel(t.kind), t.kind === 'story' ? 'tag story' : 'tag'],
      [`Stage ${t.roadmap_stage}`, 'tag'],
    ]) {
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = text;
      tags.append(s);
    }
    if (t.missable) {
      const s = document.createElement('span');
      s.className = 'tag missable';
      s.textContent = '⚠ Missable — do it early';
      tags.append(s);
    }
    body.append(title, desc, guide, tags);
    const badge = document.createElement('span');
    badge.className = `badge ${t.grade}`;
    badge.textContent = gradeLabel(t.grade);
    li.append(box, body, badge);
    listEl.append(li);
  }
  updateProgress();
}

function showDetail(id) {
  const t = byId.get(id);
  if (!t) {
    detailEl.hidden = true;
    detailEl.replaceChildren();
    return;
  }
  detailEl.hidden = false;
  detailEl.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = isHidden(t) ? 'Hidden story trophy' : t.name;
  const meta = document.createElement('p');
  meta.className = 'fine';
  meta.textContent = `${gradeLabel(t.grade)} · ${kindLabel(t.kind)} · Roadmap stage ${t.roadmap_stage}` + (t.missable ? ' · ⚠ MISSABLE — do it early, it can be lost' : '') + (t.story ? ' · Story trophy (unmissable)' : '');
  const desc = document.createElement('p');
  desc.textContent = isHidden(t) ? 'Spoilers hidden until you earn this trophy.' : t.description;
  const guideTitle = document.createElement('h3');
  guideTitle.textContent = 'How to unlock it';
  const guide = document.createElement('p');
  guide.textContent = isHidden(t) ? '' : t.guide;
  const srcTitle = document.createElement('h3');
  srcTitle.textContent = 'Sources';
  const srcList = document.createElement('ul');
  srcList.className = 'sources';
  for (const url of t.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.textContent = new URL(url).hostname;
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a);
    srcList.append(li);
  }
  const earnedLabel = document.createElement('p');
  earnedLabel.textContent = earned.has(t.id) ? '✓ You have marked this trophy as earned.' : 'Not earned yet — tick its box on the checklist when you get it.';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'close-detail';
  close.textContent = 'Back to checklist';
  close.addEventListener('click', () => {
    location.hash = '#checklist';
  });
  detailEl.append(heading, meta, desc, guideTitle, guide, srcTitle, srcList, earnedLabel, close);
}

function currentView() {
  const hash = location.hash || '#checklist';
  const match = hash.match(/^#trophy=(.+)$/);
  for (const section of document.querySelectorAll('.view')) section.hidden = true;
  for (const link of document.querySelectorAll('.views a')) link.classList.remove('active');
  if (match) {
    document.getElementById('view-checklist').hidden = false;
    document.querySelector('[data-view="checklist"]').classList.add('active');
    showDetail(decodeURIComponent(match[1]));
    return;
  }
  detailEl.hidden = true;
  const view = hash.replace('#', '') || 'checklist';
  const section = document.getElementById(`view-${view}`) ?? document.getElementById('view-checklist');
  section.hidden = false;
  const link = document.querySelector(`[data-view="${section.id.replace('view-', '')}"]`);
  if (link) link.classList.add('active');
}

searchEl.addEventListener('input', renderList);
kindEl.addEventListener('change', renderList);
gradeEl.addEventListener('change', renderList);
statusEl.addEventListener('change', renderList);
spoilerEl.addEventListener('change', () => {
  hideSpoilers = spoilerEl.checked;
  localStorage.setItem(SPOILER_KEY, hideSpoilers ? '1' : '0');
  renderList();
  const match = location.hash.match(/^#trophy=(.+)$/);
  if (match) showDetail(decodeURIComponent(match[1]));
});
window.addEventListener('hashchange', currentView);

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    const valid = ids.filter((id) => byId.has(id));
    earned = new Set(valid);
    save();
    renderList();
    importStatus.textContent = `Imported ${valid.length} earned trophies${ids.length - valid.length ? ` (${ids.length - valid.length} unknown entries skipped)` : ''}.`;
  } catch {
    importStatus.textContent = 'That file could not be read as a progress export. Nothing was changed.';
  }
  event.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear every tick? Export first if you want a backup.')) return;
  earned = new Set();
  save();
  renderList();
});

renderList();
currentView();
