const ADMIN_PASSWORD = 'admin123';

function showDashboard() {
  const container = document.getElementById('admin-container');
  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = 'Panel de Administración';
  container.appendChild(title);

  const newsSection = document.createElement('section');
  const newsTitle = document.createElement('h3');
  newsTitle.textContent = 'Gestionar Noticias';
  newsSection.appendChild(newsTitle);
  const newsForm = document.createElement('form');
  newsForm.innerHTML = `
  <label>Título:<br><input type="text" id="news-title" required></label><br>
  <label>Contenido:<br><textarea id="news-content" rows="4" required></textarea></label><br>
  <label>Fecha:<br><input type="date" id="news-date" required></label><br>
  <label>Imagen:<br><input type="file" id="news-image" accept="image/*"></label><br>
  <button type="submit">Crear Noticia</button>
`;

  newsForm.onsubmit = async e => {
    e.preventDefault();
    const title = document.getElementById('news-title').value;
    const content = document.getElementById('news-content').value;
    const date = document.getElementById('news-date').value; // ⬅️ Agregado acá
    const imageInput = document.getElementById('news-image');
    let imageData = '';
    if (imageInput.files[0]) {
      imageData = await toBase64(imageInput.files[0]);
    }

    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, image: imageData, date }) // ⬅️ Acá también
    });

    if (res.ok) {
      showToast('Noticia creada', 'success');
      loadNewsList();
      newsForm.reset();
    } else {
      showToast('Error al crear noticia', 'error');
    }
  };

  newsSection.appendChild(newsForm);
  const newsList = document.createElement('div');
  newsSection.appendChild(newsList);
  container.appendChild(newsSection);

  const playerSection = document.createElement('section');
  const playerTitle = document.createElement('h3');
  playerTitle.textContent = 'Gestionar Jugadoras';
  playerSection.appendChild(playerTitle);
  const playerForm = document.createElement('form');
  playerForm.innerHTML = `
    <label>Nombre:<br><input type="text" id="player-name" required></label><br>
    <label>Biografía:<br><textarea id="player-bio" rows="3" required></textarea></label><br>
    <label>Imagen:<br><input type="file" id="player-image" accept="image/*"></label><br>
    <button type="submit">Crear Jugadora</button>
  `;
  playerForm.onsubmit = async e => {
    e.preventDefault();
    const name = document.getElementById('player-name').value;
    const bio = document.getElementById('player-bio').value;
    const imageInput = document.getElementById('player-image');
    let imageData = '';
    if (imageInput.files[0]) {
      imageData = await toBase64(imageInput.files[0]);
    }
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, image: imageData })
    });
    if (res.ok) {
      showToast('Jugadora creada', 'success');
      loadPlayerList();
      playerForm.reset();
      await loadPlayerList();
    } else {
      showToast('Error al crear jugadora', 'error');
    }
  };
  playerSection.appendChild(playerForm);
  const playerList = document.createElement('div');
  playerSection.appendChild(playerList);
  container.appendChild(playerSection);

  loadNewsList();
  loadPlayerList();

  async function loadNewsList() {
    const res = await fetch('/api/news');
    const data = await res.json();
    newsList.innerHTML = '';
    data.forEach(item => {
      const div = document.createElement('div');
      div.style.border = '1px solid #ccc';
      div.style.padding = '0.5rem';
      div.style.marginBottom = '0.5rem';
      div.innerHTML = `<strong>${item.title}</strong> <button data-id="${item.id}" class="edit">Editar</button> <button data-id="${item.id}" class="delete">Eliminar</button>`;
      newsList.appendChild(div);
    });
    newsList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Eliminar esta noticia?')) {
          await fetch(`/api/news/${btn.getAttribute('data-id')}`, { method: 'DELETE' });
          loadNewsList();
          showToast('Noticia eliminada', 'success');
        }
      });
    });
    newsList.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const item = data.find(n => n.id == id);
        showEditModal({
          title: item.title,
          content: item.content,
          onSave: async (newTitle, newContent, newDate) => {
            const res = await fetch(`/api/news/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: newTitle,
                content: newContent,
                image: item.image,
                date: newDate || item.date
              })
            });

            if (res.ok) {
              showToast('Noticia actualizada', 'success');
              loadNewsList();
            }
          }
        });
      });
    });
  }

  async function loadPlayerList() {
    const res = await fetch('/api/players');
    const data = await res.json();
    playerList.innerHTML = '';
    data.forEach(item => {
      const div = document.createElement('div');
      div.style.border = '1px solid #ccc';
      div.style.padding = '0.5rem';
      div.style.marginBottom = '0.5rem';
      div.innerHTML = `<strong>${item.name}</strong> <button data-id="${item.id}" class="edit">Editar</button> <button data-id="${item.id}" class="delete">Eliminar</button>`;
      playerList.appendChild(div);
    });
    playerList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Eliminar esta jugadora?')) {
          await fetch(`/api/players/${btn.getAttribute('data-id')}`, { method: 'DELETE' });
          loadPlayerList();
          showToast('Jugadora eliminada', 'success');
        }
      });
    });
    playerList.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const item = data.find(p => p.id == id);
        showEditModal({
          title: item.name,
          content: item.bio,
          onSave: async (newName, newBio) => {
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
      });
    });
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const pwd = document.getElementById('password').value;
  if (pwd === ADMIN_PASSWORD) {
    showDashboard();
    showToast('Acceso concedido', 'success');
  } else {
    showToast('Contraseña incorrecta', 'error');
  }
});

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showEditModal({ title = '', content = '', image = '', date = '', onSave }) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const html = `
    <div class="modal-content">
      <h3>Editar</h3>
      <label>Título o Nombre:</label>
      <input type="text" id="modal-title" value="${title}">
      <label>Contenido o Bio:</label>
      <textarea id="modal-content">${content}</textarea>
      <label>Fecha:</label>
      <input type="date" id="modal-date" value="${date || ''}">
      <button id="modal-save">Guardar</button>
      <button id="modal-cancel">Cancelar</button>
    </div>
  `;

  modal.innerHTML = html;
  document.body.appendChild(modal);

  modal.querySelector('#modal-cancel').onclick = () => modal.remove();
  modal.querySelector('#modal-save').onclick = () => {
    const newTitle = modal.querySelector('#modal-title').value;
    const newContent = modal.querySelector('#modal-content').value;
    const newDate = modal.querySelector('#modal-date').value;
    onSave(newTitle, newContent, newDate);
    modal.remove();
  };
}



function showConfirmModal(message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'modal confirm-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <p>${message}</p>
      <div class="btn-group">
        <button id="confirm-yes">Sí</button>
        <button id="confirm-no">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#confirm-no').onclick = () => modal.remove();
  modal.querySelector('#confirm-yes').onclick = () => {
    onConfirm();
    modal.remove();
  };
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
