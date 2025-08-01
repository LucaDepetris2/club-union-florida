async function loadNews() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('news-container');
  container.innerHTML = '';

  if (id) {
    const res = await fetch(`/api/news/${id}`);
    if (res.ok) {
      const news = await res.json();
      container.appendChild(renderNewsCard(news, true));
    } else {
      container.textContent = 'Noticia no encontrada.';
    }
  } else {
    const res = await fetch('/api/news');
    const data = await res.json();
    if (!data.length) {
      container.textContent = 'No hay noticias disponibles.';
      return;
    }
    data.forEach(item => {
      container.appendChild(renderNewsCard(item, false));
    });
  }
}

function renderNewsCard(news, full = false) {
  const card = document.createElement('div');
  card.className = 'card';

  if (full) card.classList.add('full');

  // Imagen
  if (news.image) {
    const img = document.createElement('img');
    img.src = news.image;
    img.alt = news.title || 'Imagen de la noticia';
    card.appendChild(img);
  }

  // Contenido
  const content = document.createElement('div');
  content.className = 'card-content';

  if (news.date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'card-date';
    dateEl.textContent = new Date(news.date).toLocaleDateString('es-AR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    content.appendChild(dateEl);
  }

  const titleEl = document.createElement(full ? 'h2' : 'h3');
  titleEl.className = 'card-title';
  titleEl.textContent = news.title;
  content.appendChild(titleEl);

  const desc = document.createElement('p');
  desc.className = 'card-text';
  desc.innerHTML = full ? news.content : (
    news.content.substring(0, 200) + (news.content.length > 200 ? '...' : '')
  );
  content.appendChild(desc);

  if (!full) {
    const link = document.createElement('a');
    link.textContent = 'Leer más';
    link.className = 'news-link';
    link.addEventListener('click', e => {
      e.preventDefault();
      card.classList.add('full');
      desc.innerHTML = news.content;
      link.remove(); // Ocultamos el link al expandir
    });
    content.appendChild(link);
  }

  card.appendChild(content);
  return card;
}



document.addEventListener('DOMContentLoaded', loadNews);

