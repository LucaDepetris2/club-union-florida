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




document.addEventListener('DOMContentLoaded', () => {
  let currentlyOpenCard = null;

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.player-card');
    if (card) {
      if (currentlyOpenCard && currentlyOpenCard !== card) {
        currentlyOpenCard.classList.remove('active');
        currentlyOpenCard.querySelector('.description').style.display = 'none';
        currentlyOpenCard.querySelector('img').style.opacity = '1';
      }

      const desc = card.querySelector('.description');
      const img = card.querySelector('img');

      const isVisible = desc.style.display === 'block';
      if (isVisible) {
        desc.style.display = 'none';
        img.style.opacity = '1';
        currentlyOpenCard = null;
      } else {
        desc.style.display = 'block';
        img.style.opacity = '0.3';
        currentlyOpenCard = card;
      }
    } else if (currentlyOpenCard) {
      currentlyOpenCard.querySelector('.description').style.display = 'none';
      currentlyOpenCard.querySelector('img').style.opacity = '1';
      currentlyOpenCard = null;
    }
  });
});


