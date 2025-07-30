
const ADMIN_PASSWORD = 'admin123';
function showDashboard() {
  const container = document.getElementById('admin-container');
  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = 'Panel de Administración';
  container.appendChild(title);
  // News management
  const newsSection = document.createElement('section');
  const newsTitle = document.createElement('h3');
  newsTitle.textContent = 'Gestionar Noticias';
  newsSection.appendChild(newsTitle);
  const newsForm = document.createElement('form');
  newsForm.innerHTML = `
    <label>Título:<br><input type="text" id="news-title" required></label><br>
    <label>Contenido:<br><textarea id="news-content" rows="4" required></textarea></label><br>
    <label>Imagen:<br><input type="file" id="news-image" accept="image/*"></label><br>
    <button type="submit">Crear Noticia</button>
  `;
  newsForm.onsubmit = async e => {
    e.preventDefault();
    const title = document.getElementById('news-title').value;
    const content = document.getElementById('news-content').value;
    const imageInput = document.getElementById('news-image');
    let imageData = '';
    if (imageInput.files[0]) {
      imageData = await toBase64(imageInput.files[0]);
    }
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, image: imageData })
    });
    if (res.ok) {
      alert('Noticia creada');
      loadNewsList();
      newsForm.reset();
    }
  };
  newsSection.appendChild(newsForm);
  const newsList = document.createElement('div');
  newsSection.appendChild(newsList);
  container.appendChild(newsSection);
  // Players management
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
      alert('Jugadora creada');
      loadPlayerList();
      playerForm.reset();
    }
  };
  playerSection.appendChild(playerForm);
  const playerList = document.createElement('div');
  playerSection.appendChild(playerList);
  container.appendChild(playerSection);
  // Load lists
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
        }
      });
    });
    newsList.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = data.find(n => n.id == id);
        const newTitle = prompt('Nuevo título', item.title);
        const newContent = prompt('Nuevo contenido', item.content);
        if (newTitle != null && newContent != null) {
          fetch(`/api/news/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle, content: newContent })
          }).then(() => loadNewsList());
        }
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
        }
      });
    });
    playerList.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = data.find(p => p.id == id);
        const newName = prompt('Nuevo nombre', item.name);
        const newBio = prompt('Nueva biografía', item.bio);
        if (newName != null && newBio != null) {
          fetch(`/api/players/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, bio: newBio })
          }).then(() => loadPlayerList());
        }
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
  } else {
    alert('Contraseña incorrecta');
  }
});
