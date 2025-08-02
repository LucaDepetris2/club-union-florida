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

    data.sort((a, b) => new Date(b.date + "T00:00") - new Date(a.date + "T00:00"));

    data.forEach(item => {
      container.appendChild(renderNewsCard(item, false));
    });
  }
}

function renderNewsCard(news, full = false) {
  const card = document.createElement('div');
  card.className = 'news-card';
  if (full) card.classList.add('full');

  let img = null;
  if (news.image) {
    img = document.createElement('img');
    img.src = news.image;
    img.alt = news.title || 'Imagen de la noticia';
  }

  const content = document.createElement('div');
  content.className = 'news-card-content';

  if (news.category) {
    const cat = document.createElement('p');
    cat.className = 'news-card-category';
    cat.textContent = news.category;
    content.appendChild(cat);
  }

  const titleEl = document.createElement(full ? 'h2' : 'h3');
  titleEl.className = 'news-card-title';
  titleEl.textContent = news.title;
  content.appendChild(titleEl);

  if (news.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'news-card-subtitle';
    subtitleEl.textContent = news.subtitle;
    content.appendChild(subtitleEl);
  }

  if (img && full) {
    content.appendChild(img);
  }

  if (news.date) {
    const [yyyy, mm, dd] = news.date.split("-");
    const formatted = `${dd}/${mm}/${yyyy}`;
    const dateEl = document.createElement('p');
    dateEl.className = 'news-card-date';
    dateEl.textContent = formatted;
    content.appendChild(dateEl);
  }

  const desc = document.createElement('p');
  desc.className = 'news-card-text';
  desc.innerHTML = full
    ? formatText(news.content)
    : formatText(news.content.substring(0, 200)) + (news.content.length > 200 ? '<span class="dots">...</span>' : '');
  content.appendChild(desc);

  const expandLink = document.createElement('a');
  expandLink.textContent = 'Leer más';
  expandLink.className = 'news-link';

  const collapseLink = document.createElement('a');
  collapseLink.textContent = '✖ Cerrar';
  collapseLink.className = 'news-link';
  collapseLink.style.display = full ? 'inline-block' : 'none';

  expandLink.addEventListener('click', e => {
    e.preventDefault();
    card.classList.add('full');
    desc.innerHTML = formatText(news.content);
    expandLink.remove();
    collapseLink.style.display = 'inline-block';
    if (img && card.contains(img)) {
      card.removeChild(img);
      content.insertBefore(img, content.querySelector('.news-card-date') || desc);
    }
  });

  collapseLink.addEventListener('click', e => {
    e.preventDefault();
    card.classList.remove('full');
    desc.innerHTML = formatText(news.content.substring(0, 200)) + (news.content.length > 200 ? '<span class="dots">...</span>' : '');
    collapseLink.style.display = 'none';
    if (img && content.contains(img)) {
      content.removeChild(img);
    }
    if (img && !card.contains(img)) {
      card.insertBefore(img, content);
    }
    if (!content.contains(expandLink)) {
      content.appendChild(expandLink);
    }
  });

  if (!full) content.appendChild(expandLink);
  content.appendChild(collapseLink);
  if (!full && img) card.appendChild(img);
  card.appendChild(content);

  return card;
}

document.addEventListener('DOMContentLoaded', loadNews);



function formatText(text) {
  return text
    .replace(/\.\s/g, '.\n')
    .split('\n')
    .map(p => `<p>${p.trim()}</p>`)
    .join('');
}
