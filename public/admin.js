// public/admin.js

const CLOUD_NAME = window.CLOUD_NAME || 'dznbw2nma';
const UPLOAD_PRESET = window.UPLOAD_PRESET || 'cuf_unsigned';

// Sube archivo a Cloudinary (unsigned). Devuelve secure_url.
async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const r = await fetch(url, { method: 'POST', body: fd });

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`Cloudinary ${r.status}: ${txt || 'Error al subir imagen'}`);
  }
  const data = await r.json();
  if (!data.secure_url) throw new Error('Cloudinary: respuesta sin secure_url');
  return data.secure_url;
}

function showDashboard() {
  const container = document.getElementById('admin-container');
  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = 'Panel de Administración';
  container.appendChild(title);

  // ---------- Noticias ----------
  const newsSection = document.createElement('section');
  newsSection.innerHTML = `
    <h3>Gestionar Noticias</h3>
    <form id="news-form">
      <label>Título:<br><input type="text" id="news-title" required></label><br>
      <label>Copete:<br><input type="text" id="news-subtitle"></label><br>
      <label>Categoría:<br><input type="text" id="news-category"></label><br>
      <label>Contenido:<br><textarea id="news-content" rows="4" required></textarea></label><br>
      <label>Fecha:<br><input type="date" id="news-date" required></label><br>
      <label>Imagen:<br><input type="file" id="news-image" accept="image/*"></label><br>
      <button type="submit">Crear Noticia</button>
    </form>
    <div id="news-list"></div>
  `;
  container.appendChild(newsSection);

  const newsForm = newsSection.querySelector('#news-form');
  const newsList = newsSection.querySelector('#news-list');

  newsForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('news-title').value.trim();
    const subtitle = document.getElementById('news-subtitle').value.trim();
    const category = document.getElementById('news-category').value.trim();
    const content = document.getElementById('news-content').value.trim();
    const date = document.getElementById('news-date').value;
    const imageFile = document.getElementById('news-image').files[0];

    try {
      let image = '';
      if (imageFile) image = await uploadToCloudinary(imageFile);

      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle, content, image, date, category })
      });

      if (!res.ok) throw new Error(await res.text());
      showToast('Noticia creada', 'success');
      newsForm.reset();
      loadNewsList();
    } catch (err) {
      console.error(err);
      showToast('Error al crear noticia', 'error');
    }
  };

  async function loadNewsList() {
    const res = await fetch('/api/news');
    const data = await res.json();
    newsList.innerHTML = '';
    data.forEach(item => {
      const div = document.createElement('div');
      div.style.border = '1px solid #ccc';
      div.style.padding = '6px';
      div.style.marginBottom = '6px';
      div.innerHTML = `
        <strong>${item.title}</strong>
        <button data-id="${item.id}" class="edit">Editar</button>
        <button data-id="${item.id}" class="delete">Eliminar</button>
      `;
      newsList.appendChild(div);
    });

    newsList.querySelectorAll('.delete').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Eliminar esta noticia?')) return;
        await fetch(`/api/news/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Noticia eliminada', 'success');
        loadNewsList();
      };
    });

    newsList.querySelectorAll('.edit').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const item = data.find(n => n.id == id);
        showEditModal({
          title: item.title,
          subtitle: item.subtitle || '',
          content: item.content,
          category: item.category || '',
          date: item.date || '',
          onSave: async (newTitle, newSubtitle, newContent, newDate, newCategory) => {
            const res = await fetch(`/api/news/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: newTitle, subtitle: newSubtitle, content: newContent,
                image: item.image, date: newDate || item.date, category: newCategory
              })
            });
            if (res.ok) {
              showToast('Noticia actualizada', 'success');
              loadNewsList();
            }
          }
        });
      };
    });
  }

  // ---------- Jugadoras ----------
  const playerSection = document.createElement('section');
  playerSection.innerHTML = `
    <h3>Gestionar Jugadoras</h3>
    <form id="player-form">
      <label>Nombre:<br><input type="text" id="player-name" required></label><br>
      <label>Biografía:<br><textarea id="player-bio" rows="3" required></textarea></label><br>
      <label>Imagen:<br><input type="file" id="player-image" accept="image/*"></label><br>
      <button type="submit">Crear Jugadora</button>
    </form>
    <div id="player-list"></div>
  `;
  container.appendChild(playerSection);

  const playerForm = playerSection.querySelector('#player-form');
  const playerList = playerSection.querySelector('#player-list');

  playerForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('player-name').value.trim();
    const bio = document.getElementById('player-bio').value.trim();
    const imageFile = document.getElementById('player-image').files[0];

    try {
      let image = '';
      if (imageFile) image = await uploadToCloudinary(imageFile);

      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, image })
      });

      if (!res.ok) throw new Error(await res.text());
      showToast('Jugadora creada', 'success');
      playerForm.reset();
      loadPlayerList();
    } catch (err) {
      console.error(err);
      showToast('Error al crear jugadora', 'error');
    }
  };

  async function loadPlayerList() {
    const res = await fetch('/api/players');
    const data = await res.json();
    playerList.innerHTML = '';
    data.forEach(item => {
      const div = document.createElement('div');
      div.style.border = '1px solid #ccc';
      div.style.padding = '6px';
      div.style.marginBottom = '6px';
      div.innerHTML = `
        <strong>${item.name}</strong>
        <button data-id="${item.id}" class="edit">Editar</button>
        <button data-id="${item.id}" class="delete">Eliminar</button>
      `;
      playerList.appendChild(div);
    });

    playerList.querySelectorAll('.delete').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Eliminar esta jugadora?')) return;
        await fetch(`/api/players/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Jugadora eliminada', 'success');
        loadPlayerList();
      };
    });

    playerList.querySelectorAll('.edit').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const item = data.find(p => p.id == id);
        showEditModal({
          title: item.name,
          content: item.bio,
          onSave: async (newName, _subtitle, newBio) => {
            const res = await fetch(`/api/players/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newName, bio: newBio, image: item.image })
            });
            if (res.ok) {
              showToast('Jugadora actualizada', 'success');
              loadPlayerList();
            }
          }
        });
      };
    });
  }

  // arranque
  loadNewsList();
  loadPlayerList();
}

// Login simple
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const pwd = document.getElementById('password').value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd })
  });

  const data = await res.json();
  if (data.success) {
    showDashboard();
    showToast('Acceso concedido', 'success');
  } else {
    showToast('Contraseña incorrecta', 'error');
  }
});

// utilidades UI
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showEditModal({ title = '', subtitle = '', content = '', image = '', date = '', category = '', onSave }) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Editar</h3>
      <label>Título o Nombre:</label>
      <input type="text" id="modal-title" value="${title}">
      <label>Copete (si es noticia):</label>
      <input type="text" id="modal-subtitle" value="${subtitle}">
      <label>Contenido o Bio:</label>
      <textarea id="modal-content">${content}</textarea>
      <label>Categoría:</label>
      <input type="text" id="modal-category" value="${category || ''}">
      <label>Fecha:</label>
      <input type="date" id="modal-date" value="${date || ''}">
      <button id="modal-save">Guardar</button>
      <button id="modal-cancel">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#modal-cancel').onclick = () => modal.remove();
  modal.querySelector('#modal-save').onclick = () => {
    const newTitle = modal.querySelector('#modal-title').value;
    const newSubtitle = modal.querySelector('#modal-subtitle').value;
    const newContent = modal.querySelector('#modal-content').value;
    const newCategory = modal.querySelector('#modal-category').value;
    const newDate = modal.querySelector('#modal-date').value;
    onSave(newTitle, newSubtitle, newContent, newDate, newCategory);
    modal.remove();
  };
}

