document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.innerHTML = `
    <div class="lightbox-modal">
      <span class="lightbox-close">✕</span>
      <img id="lightbox-img" src="" alt="">
    </div>
  `;
    document.body.appendChild(overlay);

    document.querySelectorAll('.afmb-card img').forEach(img => {
        img.addEventListener('click', () => {
            document.getElementById('lightbox-img').src = img.src;
            overlay.classList.add('show');
        });
    });

    overlay.addEventListener('click', (e) => {
        if (
            e.target.classList.contains('lightbox-close') ||
            e.target.id === 'lightbox-overlay'
        ) {
            overlay.classList.remove('show');
        }
    });
});

