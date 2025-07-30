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
    link.href = `news.html?id=${news.id}`;
    link.textContent = 'Leer más';
    link.className = 'news-link';
    content.appendChild(link);
  }

  card.appendChild(content);
  return card;
}

document.addEventListener('DOMContentLoaded', loadNews);

