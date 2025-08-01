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

  // Imagen primero
  let img = null;
  if (news.image) {
    img = document.createElement('img');
    img.src = news.image;
    img.alt = news.title || 'Imagen de la noticia';
    card.appendChild(img);
  }

  // Contenido
  const content = document.createElement('div');
  content.className = 'card-content';

  // 1️⃣ Título
  const titleEl = document.createElement(full ? 'h2' : 'h3');
  titleEl.className = 'card-title';
  titleEl.textContent = news.title;
  content.appendChild(titleEl);

  // 2️⃣ Copete
  if (news.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'card-subtitle';
    subtitleEl.textContent = news.subtitle;
    content.appendChild(subtitleEl);
  }

  // 3️⃣ Fecha
  if (news.date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'card-date';
    dateEl.textContent = new Date(news.date).toLocaleDateString('es-AR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    content.appendChild(dateEl);
  }

  // 4️⃣ Texto
  const desc = document.createElement('p');
  desc.className = 'card-text';
  desc.innerHTML = full ? news.content : (
    news.content.substring(0, 200) + (news.content.length > 200 ? '...' : '')
  );
  content.appendChild(desc);

  // 🔹 Botón de cerrar (definido antes)
  const collapseLink = document.createElement('a');
  collapseLink.textContent = '✖ Cerrar';
  collapseLink.className = 'news-link';
  collapseLink.style.display = full ? 'inline-block' : 'none';
  collapseLink.addEventListener('click', e => {
    e.preventDefault();
    card.classList.remove('full');
    desc.innerHTML = news.content.substring(0, 200) + (news.content.length > 200 ? '...' : '');
    collapseLink.style.display = 'none';
    if (!content.contains(expandLink)) content.appendChild(expandLink);
  });

  // 🔹 Botón "Leer más"
  const expandLink = document.createElement('a');
  expandLink.textContent = 'Leer más';
  expandLink.className = 'news-link';
  if (!full) {
    expandLink.addEventListener('click', e => {
      e.preventDefault();
      card.classList.add('full');
      desc.innerHTML = news.content;
      expandLink.remove();
      collapseLink.style.display = 'inline-block';
    });
    content.appendChild(expandLink);
  }

  if (full) {
    content.appendChild(collapseLink);
  } else {
    content.appendChild(collapseLink); // Siempre está en el DOM pero oculto
  }

  card.appendChild(content);
  return card;
}








document.addEventListener('DOMContentLoaded', loadNews);

