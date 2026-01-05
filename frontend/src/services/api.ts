const getApiUrl = () => {
    // En el cliente (browser)
    if (typeof window !== 'undefined') {
        return import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';
    }
    // En el servidor (SSR) - Usar URL interna del contenedor/localhost
    // NOTA: En Render o Docker, esto podría necesitar ajuste si el puerto es dinámico
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}/api`;
}

const API_URL = getApiUrl();

export interface NewsItem {
    id: string;
    title: string;
    subtitle?: string;
    content: string;
    image?: string;
    imagePosition?: string;
    imageFit?: 'cover' | 'contain';
    date: string;
    category?: string;
}

export interface PlayerItem {
    id: string;
    name: string;
    bio: string;
    image?: string;
}

export const getNews = async (page = 1, limit = 100): Promise<NewsItem[]> => {
    try {
        const res = await fetch(`${API_URL}/news?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error('Error fetching news');
        const data = await res.json();
        // Enforce descending sort by date
        return data.sort((a: NewsItem, b: NewsItem) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const getNewsById = async (id: string): Promise<NewsItem | null> => {
    try {
        const res = await fetch(`${API_URL}/news/${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getPlayers = async (): Promise<PlayerItem[]> => {
    try {
        const res = await fetch(`${API_URL}/players`);
        if (!res.ok) throw new Error('Error fetching players');
        return await res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};
