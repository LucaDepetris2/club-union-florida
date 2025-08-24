// public/admin.js – Admin UI 2.0 (tabs, cards, modal forms, search)

const CLOUD_NAME = window.CLOUD_NAME || 'dznbw2nma';
const UPLOAD_PRESET = window.UPLOAD_PRESET || 'cuf_unsigned';

// ==== Utils ====
const qs = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => Array.from(c.querySelectorAll(s));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '';
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const r = await fetch(url, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Error al subir imagen');
  const data = await r.json();
  if (!data.secure_url) throw new Error('Respuesta sin secure_url');
  return data.secure_url;
}

// Toast minimal (usa tus estilos existentes)
function showToast(message, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = message;
  document.body.appendChild(t); setTimeout(() => t.remove(), 4000);
}

// Modal con form dinámico (crear/editar)
function showFormModal({ title = 'Nuevo', submitLabel = 'Guardar', fields = [], onSubmit }) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  const htmlFields = fields.map(f => {
    if (f.type === 'textarea') return `
      <label>${f.label}</label>
      <textarea id="${f.id}" rows="${f.rows || 4}" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>`;
    if (f.type === 'date') return `
      <label>${f.label}</label>
      <input id="${f.id}" type="date" value="${f.value || ''}">`;
    if (f.type === 'dropzone') return `
      <label>${f.label}</label>
      <div class="dropzone" id="${f.id}">
        <p>Arrastrá una imagen o hacé click</p>
        ${f.preview ? `<img src="${f.preview}" alt="preview">` : ''}
        <input type="file" accept="image/*" hidden>
      </div>`;
    return `
      <label>${f.label}</label>
      <input id="${f.id}" type="text" value="${f.value || ''}" placeholder="${f.placeholder || ''}">`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-content">
      <h3 style="margin-top:0">${title}</h3>
      ${htmlFields}
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn ghost" id="cancel">Cancelar</button>
        <button class="btn primary" id="ok">${submitLabel}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Dropzone behavior
  fields.filter(f => f.type === 'dropzone').forEach(f => {
    const dz = qs(`#${f.id}`, modal);
    const input = dz.querySelector('input[type="file"]');
    dz.addEventListener('click', () => input.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('drag');
      if (!e.dataTransfer.files?.[0]) return;
      input.files = e.dataTransfer.files;
      const fr = new FileReader();
      fr.onload = () => { dz.querySelector('img')?.remove(); const img = document.createElement('img'); img.src = fr.result; dz.appendChild(img); };
      fr.readAsDataURL(input.files[0]);
    });
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => { dz.querySelector('img')?.remove(); const img = document.createElement('img'); img.src = fr.result; dz.appendChild(img); };
      fr.readAsDataURL(f);
    });
  });

  qs('#cancel', modal).onclick = () => modal.remove();
  qs('#ok', modal).onclick = async () => {
    const values = {};
    for (const f of fields) {
      if (f.type === 'dropzone') {
        values[f.id] = qs(`#${f.id} input[type="file"]`, modal).files?.[0] || null;
      } else {
        values[f.id] = qs(`#${f.id}`, modal).value.trim();
      }
    }
    await onSubmit(values);
    modal.remove();
  };
}

// ============ Dashboard ============
function showDashboard() {
  const container = document.getElementById('admin-container');
  container.classList.add('admin-shell');
  container.innerHTML = `
    <div class="admin-header">
      <h2>Panel de Administración</h2>
      <span class="badge">CUF Femenino</span>
    </div>

    <div class="admin-grid">
      <aside class="admin-sidebar">
        <button class="tab-btn active" data-tab="news">📰 Noticias</button>
        <button class="tab-btn" data-tab="players">🏀 Jugadoras</button>
      </aside>

      <main class="admin-main">
        <section id="tab-news" class="tab active">
          <div class="toolbar">
            <input id="news-query" type="search" placeholder="Buscar noticia por título, categoría…">
            <button id="new-news" class="btn primary">+ Nueva noticia</button>
          </div>
          <div id="news-cards" class="cards"></div>
        </section>

        <section id="tab-players" class="tab">
          <div class="toolbar">
            <input id="players-query" type="search" placeholder="Buscar jugadora por nombre…">
            <button id="new-player" class="btn primary">+ Nueva jugadora</button>
          </div>
          <div id="players-cards" class="cards"></div>
        </section>
      </main>
    </div>
  `;

  // Tabs
  qsa('.tab-btn', container).forEach(b => {
    b.onclick = () => {
      qsa('.tab-btn', container).forEach(x => x.classList.remove('active'));
      qsa('.tab', container).forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      qs(`#tab-${b.dataset.tab}`, container).classList.add('active');
    };
  });

  // ======= Noticias =======
  let newsData = [];
  async function loadNews() {
    const r = await fetch('/api/news');
    newsData = await r.json();
    renderNews();
  }
  function renderNews() {
    const q = qs('#news-query').value.toLowerCase().trim();
    const cards = qs('#news-cards');
    const filtered = newsData.filter(n => {
      const hay = (n.title || '') + ' ' + (n.category || '') + ' ' + (n.subtitle || '');
      return hay.toLowerCase().includes(q);
    });
    cards.innerHTML = filtered.map(n => `
      <article class="card">
        <img class="thumb" src="${n.image || 'img/placeholder.jpg'}" alt="">
        <div class="meta">
          <h4>${n.title}</h4>
          <div class="chips">
            ${n.category ? `<span class="chip">${n.category}</span>` : ''}
            ${n.date ? `<span class="chip">${fmtDate(n.date)}</span>` : ''}
          </div>
        </div>
        <div class="actions">
          <button class="icon-btn edit"   title="Editar"   data-id="${n.id}">✏️</button>
          <button class="icon-btn delete" title="Eliminar" data-id="${n.id}">🗑️</button>
        </div>
      </article>
    `).join('');

    // handlers
    qsa('.icon-btn.delete', cards).forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Eliminar esta noticia?')) return;
        await fetch(`/api/news/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Noticia eliminada', 'success'); loadNews();
      };
    });
    qsa('.icon-btn.edit', cards).forEach(btn => {
      btn.onclick = () => {
        const item = newsData.find(n => String(n.id) === String(btn.dataset.id));
        showFormModal({
          title: 'Editar noticia',
          submitLabel: 'Guardar cambios',
          fields: [
            { id: 'title', label: 'Título', value: item.title },
            { id: 'subtitle', label: 'Copete', value: item.subtitle || '' },
            { id: 'category', label: 'Categoría', value: item.category || '' },
            { id: 'date', label: 'Fecha', type: 'date', value: (item.date || '').slice(0, 10) },
            { id: 'content', label: 'Contenido', type: 'textarea', value: item.content, rows: 6 },
            { id: 'image', label: 'Imagen (opcional)', type: 'dropzone', preview: item.image || '' }
          ],
          onSubmit: async (v) => {
            let image = item.image;
            if (v.image instanceof File) { image = await uploadToCloudinary(v.image); }
            await fetch(`/api/news/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: v.title, subtitle: v.subtitle, content: v.content,
                date: v.date || item.date, category: v.category, image
              })
            });
            showToast('Noticia actualizada', 'success'); loadNews();
          }
        });
      };
    });
  }

  // Crear noticia
  qs('#new-news').onclick = () => {
    showFormModal({
      title: 'Nueva noticia',
      submitLabel: 'Crear',
      fields: [
        { id: 'title', label: 'Título' },
        { id: 'subtitle', label: 'Copete' },
        { id: 'category', label: 'Categoría' },
        { id: 'date', label: 'Fecha', type: 'date' },
        { id: 'content', label: 'Contenido', type: 'textarea', rows: 6 },
        { id: 'image', label: 'Imagen', type: 'dropzone' }
      ],
      onSubmit: async (v) => {
        let image = '';
        if (v.image instanceof File) image = await uploadToCloudinary(v.image);
        const res = await fetch('/api/news', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: v.title, subtitle: v.subtitle, content: v.content, image, date: v.date, category: v.category })
        });
        if (!res.ok) throw new Error(await res.text());
        showToast('Noticia creada', 'success'); loadNews();
      }
    });
  };
  qs('#news-query').addEventListener('input', debounce(renderNews, 120));

  // ======= Jugadoras =======
  let playersData = [];
  async function loadPlayers() {
    const r = await fetch('/api/players');
    playersData = await r.json();
    renderPlayers();
  }
  function renderPlayers() {
    const q = qs('#players-query').value.toLowerCase().trim();
    const cards = qs('#players-cards');
    const filtered = playersData
      .slice().sort((a, b) => a.name.localeCompare(b.name))
      .filter(p => (p.name || '').toLowerCase().includes(q));
    cards.innerHTML = filtered.map(p => `
      <article class="card">
        <img class="thumb" src="${p.image || 'img/placeholder.jpg'}" alt="">
        <div class="meta">
          <h4>${p.name}</h4>
          <div class="chips">${p.bio ? `<span class="chip">Bio</span>` : ''}</div>
        </div>
        <div class="actions">
          <button class="icon-btn edit"   title="Editar"   data-id="${p.id}">✏️</button>
          <button class="icon-btn delete" title="Eliminar" data-id="${p.id}">🗑️</button>
        </div>
      </article>
    `).join('');

    qsa('.icon-btn.delete', cards).forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Eliminar esta jugadora?')) return;
        await fetch(`/api/players/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Jugadora eliminada', 'success'); loadPlayers();
      };
    });
    qsa('.icon-btn.edit', cards).forEach(btn => {
      btn.onclick = () => {
        const item = playersData.find(p => String(p.id) === String(btn.dataset.id));
        showFormModal({
          title: 'Editar jugadora',
          submitLabel: 'Guardar cambios',
          fields: [
            { id: 'name', label: 'Nombre', value: item.name },
            { id: 'bio', label: 'Biografía', type: 'textarea', value: item.bio || '', rows: 5 },
            { id: 'image', label: 'Imagen (opcional)', type: 'dropzone', preview: item.image || '' }
          ],
          onSubmit: async (v) => {
            let image = item.image;
            if (v.image instanceof File) { image = await uploadToCloudinary(v.image); }
            await fetch(`/api/players/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: v.name, bio: v.bio, image })
            });
            showToast('Jugadora actualizada', 'success'); loadPlayers();
          }
        });
      };
    });
  }

  // Crear jugadora
  qs('#new-player').onclick = () => {
    showFormModal({
      title: 'Nueva jugadora',
      submitLabel: 'Crear',
      fields: [
        { id: 'name', label: 'Nombre' },
        { id: 'bio', label: 'Biografía', type: 'textarea', rows: 5 },
        { id: 'image', label: 'Imagen', type: 'dropzone' }
      ],
      onSubmit: async (v) => {
        let image = '';
        if (v.image instanceof File) image = await uploadToCloudinary(v.image);
        const res = await fetch('/api/players', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: v.name, bio: v.bio, image })
        });
        if (!res.ok) throw new Error(await res.text());
        showToast('Jugadora creada', 'success'); loadPlayers();
      }
    });
  };
  qs('#players-query').addEventListener('input', debounce(renderPlayers, 120));

  // Arranque
  loadNews(); loadPlayers();
}

// ---- UI Login: agrupa input + agrega toggle "ojo" ----
(function () {
  const form = document.getElementById('login-form');
  const pwd = document.getElementById('password');
  if (!form || !pwd) return;

  const group = document.createElement('div');
  group.className = 'input-group';
  pwd.parentNode.insertBefore(group, pwd);
  group.appendChild(pwd);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pwd-toggle';
  btn.setAttribute('aria-label', 'Mostrar u ocultar contraseña');
  btn.textContent = '👁';
  group.appendChild(btn);

  btn.addEventListener('click', () => {
    const isPass = pwd.type === 'password';
    pwd.type = isPass ? 'text' : 'password';
    btn.textContent = isPass ? '🙈' : '👁';
    pwd.focus();
  });
})();


// ===== Login =====
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = qs('#password').value;
  const res = await fetch('/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd })
  });
  const data = await res.json();
  if (data.success) { showDashboard(); showToast('Acceso concedido', 'success'); }
  else { showToast('Contraseña incorrecta', 'error'); }
});
