// Leonida Ledger — load the 55 trophies, render the checklist, filters, spoiler mode and tracker.
import { loadEarned, saveEarned, exportText, parseImport } from './tracker.js';
import { renderRoadmap, renderMissableAudit, renderSources } from './roadmap.js';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const earned = loadEarned();

const cardsEl = document.getElementById('cards');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const earnedEl = document.getElementById('earnedFilter');
const spoilerEl = document.getElementById('spoiler');

// Shareable views: ?kind=missable, ?grade=silver, ?spoiler=1 and ?q=... pre-set the filters on load.
const params = new URLSearchParams(location.search);
if (params.get('kind') && [...kindEl.options].some((o) => o.value === params.get('kind'))) kindEl.value = params.get('kind');
if (params.get('grade') && [...gradeEl.options].some((o) => o.value === params.get('grade'))) gradeEl.value = params.get('grade');
if (params.get('q')) searchEl.value = params.get('q');
if (params.get('spoiler') === '1') spoilerEl.checked = true;
if (params.get('spoiler') === '0') spoilerEl.checked = false;

renderRoadmap(doc);
renderMissableAudit(doc);
renderSources(doc);

// A story trophy stays hidden (name + description) while spoilers are on and it is not yet earned.
function isHidden(t) {
  return spoilerEl.checked && t.kind === 'story' && !earned.has(t.name);
}

function pill(text, cls) {
  const s = document.createElement('span');
  s.className = 'pill' + (cls ? ' ' + cls : '');
  s.textContent = text;
  return s;
}

function makeCard(t) {
  const card = document.createElement('article');
  card.id = `t-${t.id}`;
  card.className = 'card' + (earned.has(t.name) ? ' earned' : '');
  const hidden = isHidden(t);

  const head = document.createElement('div');
  head.className = 'earn';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Earned: ${t.name}`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name);
    else earned.delete(t.name);
    saveEarned(earned);
    render();
  });
  const name = document.createElement('h3');
  name.textContent = hidden ? 'Hidden story trophy' : t.name;
  head.append(box, name);
  card.append(head);

  const pills = document.createElement('div');
  pills.className = 'pills';
  pills.append(pill(t.grade, t.grade), pill(t.kind), pill(`Stage ${t.stage}`));
  if (t.missable) pills.append(pill('Potentially missable', 'missable'));
  if (hidden) pills.append(pill('Spoiler hidden', 'spoiler'));
  card.append(pills);

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = hidden ? 'Earn this trophy to reveal its official name and description.' : t.description;
  card.append(desc);

  if (!hidden) {
    const guide = document.createElement('p');
    guide.className = 'guide';
    guide.textContent = t.guide;
    card.append(guide);
    const steps = document.createElement('ol');
    steps.className = 'steps';
    for (const s of t.steps ?? []) {
      const li = document.createElement('li');
      li.textContent = `${s.text} — ${s.source}`;
      steps.append(li);
    }
    if (steps.children.length) card.append(steps);
  } else {
    const note = document.createElement('p');
    note.className = 'guide';
    note.textContent = 'Guide and steps are hidden with the spoiler setting. Tick the box once you have earned it.';
    card.append(note);
  }

  const src = document.createElement('p');
  src.className = 'src';
  src.textContent = `Sources: ${(t.sources ?? []).join('; ')}`;
  card.append(src);
  return card;
}

function visible(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
  if (kindEl.value === 'missable' && !t.missable) return false;
  if (kindEl.value === 'online') return false;
  if (kindEl.value !== 'all' && kindEl.value !== 'missable' && t.kind !== kindEl.value) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (earnedEl.value === 'earned' && !earned.has(t.name)) return false;
  if (earnedEl.value === 'todo' && earned.has(t.name)) return false;
  return true;
}

function render() {
  const shown = trophies.filter(visible);
  cardsEl.replaceChildren(...shown.map(makeCard));
  document.getElementById('emptyNote').hidden = shown.length > 0;
  document.getElementById('resultCount').textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
  document.getElementById('earnedCount').textContent = String(earned.size);
  document.getElementById('barFill').style.width = `${(earned.size / trophies.length) * 100}%`;
  document.getElementById('progressText').textContent = `${Math.round((earned.size / trophies.length) * 100)}% to the platinum`;
  document.getElementById('platState').textContent = earned.size === trophies.length ? 'earned!' : 'not yet';
  const count = (g) => `${trophies.filter((t) => t.grade === g && earned.has(t.name)).length}/${trophies.filter((t) => t.grade === g).length}`;
  document.getElementById('goldCount').textContent = count('gold');
  document.getElementById('silverCount').textContent = count('silver');
  document.getElementById('bronzeCount').textContent = count('bronze');
}

for (const el of [searchEl, kindEl, gradeEl, earnedEl, spoilerEl]) {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exportText(earned)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const next = parseImport(await file.text(), trophies.map((t) => t.name));
    earned.clear();
    for (const n of next) earned.add(n);
    saveEarned(earned);
    render();
  } catch {
    alert('That file is not a Leonida Ledger progress export.');
  }
  e.target.value = '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  earned.clear();
  saveEarned(earned);
  render();
});

render();

// Deep-link: a #t-<id> or section hash scrolls to that card once the list is rendered.
if (location.hash) {
  const target = document.querySelector(location.hash);
  if (target) target.scrollIntoView({ block: 'start' });
}
