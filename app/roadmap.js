// Roadmap and missable audit: rendered from the data file so the page and the JSON can never drift apart.
export function renderRoadmap(doc) {
  const list = document.getElementById('roadmapList');
  list.replaceChildren();
  for (const step of doc.roadmap ?? []) {
    const li = document.createElement('li');
    const title = document.createElement('b');
    title.textContent = `Stage ${step.stage} — ${step.title} (${step.hours} hours)`;
    const text = document.createElement('p');
    text.textContent = step.text;
    li.append(title, text);
    list.append(li);
  }
}

// The missable audit paragraph, straight from the data file's own audit text.
export function renderMissableAudit(doc) {
  const el = document.getElementById('missableText');
  el.textContent = doc.missable_audit ?? '';
}

// The source list at the foot of the page, built from the data file's sources.
export function renderSources(doc) {
  const list = document.getElementById('sourceList');
  list.replaceChildren();
  for (const s of doc.sources ?? []) {
    const li = document.createElement('li');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.rel = 'noopener';
      li.append(a);
    } else {
      li.textContent = s.name;
    }
    list.append(li);
  }
}
