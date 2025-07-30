async function loadPlayers() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('players-container');
  container.innerHTML = '';

  // Vista de ficha individual (si pasas ?id=...)
  if (id) {
    const res = await fetch(`/api/players/${id}`);
    if (res.ok) {
      const player = await res.json();
      renderPlayerCard(container, player, true);
    } else {
      container.textContent = 'Jugadora no encontrada.';
    }
    return;
  }

  // Vista de galería
  const res = await fetch('/api/players');
  const data = await res.json();
  if (!data.length) {
    container.textContent = 'No hay jugadoras registradas.';
    return;
  }
  data.forEach(item => renderPlayerCard(container, item, false));
}

function renderPlayerCard(parent, player, alwaysShowDescription) {
  const card = document.createElement('div');
  card.className = 'player-card';

  // Imagen
  if (player.image) {
    const img = document.createElement('img');
    img.src = player.image;
    card.appendChild(img);
  }

  // Información (nombre)
  const info = document.createElement('div');
  info.className = 'info';
  info.textContent = player.name;
  card.appendChild(info);

  parent.appendChild(card);
}

document.addEventListener('DOMContentLoaded', loadPlayers);


