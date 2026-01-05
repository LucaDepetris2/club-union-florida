// Usando fetch nativo de Node.js


const API_URL = 'http://localhost:3000/api/news';
const CATEGORIES = ['LIGA FEMENINA', 'PRIMERA', 'U21', 'U17', 'U15', 'U13', 'U12', 'U11'];
const ITEMS_PER_CATEGORY = 6;

async function seed() {
    console.log('🌱 Iniciando siembra de noticias...');

    for (const category of CATEGORIES) {
        console.log(`\nProcesando categoría: ${category}`);
        for (let i = 1; i <= ITEMS_PER_CATEGORY; i++) {
            const newsItem = {
                title: `Noticia ${i} de ${category}`,
                subtitle: `Resumen breve de la noticia ${i} para la categoría ${category}.`,
                content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Esta es la noticia de prueba número ${i} correspondiente a la categoría ${category}.`,
                date: new Date().toISOString(),
                category: category,
                image: `https://via.placeholder.com/800x600?text=${category}+${i}` // Imagen placeholder interactiva
            };

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newsItem)
                });

                if (res.ok) {
                    process.stdout.write('.');
                } else {
                    console.error(`X Error creando noticia ${i} ${category}:`, await res.text());
                }
            } catch (error) {
                console.error(`X Error conexión al crear noticia ${i} ${category}:`, error.message);
            }
        }
    }
    console.log('\n\n✅ Siembra completada.');
}

// Ejecutar si es Node 18+ (fetch nativo) o si se ejecuta directamente
seed();
