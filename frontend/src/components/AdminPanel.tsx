import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.PUBLIC_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

// Configuración Cloudinary (tomada del admin.html original como default)
const CLOUD_NAME = 'dznbw2nma';
const UPLOAD_PRESET = 'cuf_unsigned';

interface NewsItem {
    id?: string;
    _id?: string;
    title: string;
    subtitle?: string;
    category?: string;
    date?: string;
    content: string;
    image: string;
    imagePosition?: string;
    imageFit?: 'cover' | 'contain';
}

interface PlayerItem {
    id?: string;
    _id?: string;
    name: string;
    bio: string;
    image?: string;
}

const AdminPanel = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'news' | 'players'>('news');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [players, setPlayers] = useState<PlayerItem[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'news' | 'player'>('news');
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState<any>({});
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            fetchNews();
            fetchPlayers();
        }
    }, [isLoggedIn, activeTab]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (data.success) {
                setIsLoggedIn(true);
                setError('');
            } else {
                setError('Contraseña incorrecta');
            }
        } catch (err) {
            setError('Error de conexión');
        }
    };

    const fetchNews = async () => {
        const res = await fetch(`${API_URL}/news`);
        if (res.ok) setNews(await res.json());
    };

    const fetchPlayers = async () => {
        const res = await fetch(`${API_URL}/players`);
        if (res.ok) setPlayers(await res.json());
    };

    const uploadToCloudinary = async (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', UPLOAD_PRESET);
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const r = await fetch(url, { method: 'POST', body: fd });
        const data = await r.json();
        return data.secure_url;
    };

    const handleDelete = async (id: string, type: 'news' | 'players') => {
        if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
        await fetch(`${API_URL}/${type}/${id}`, { method: 'DELETE' });
        type === 'news' ? fetchNews() : fetchPlayers();
    };

    const openModal = (type: 'news' | 'player', item: any = null) => {
        setModalType(type);
        setEditingItem(item);
        setFormData(item || (type === 'news' ? { date: new Date().toISOString().split('T')[0], imageFit: 'cover' } : {}));
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrl = formData.image;

            // Handle file upload if a file object is present in formData.imageFile
            if (formData.imageFile) {
                imageUrl = await uploadToCloudinary(formData.imageFile);
            }

            const payload = { ...formData, image: imageUrl };
            delete payload.imageFile; // Clean up

            const endpoint = modalType === 'news' ? 'news' : 'players';
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem
                ? `${API_URL}/${endpoint}/${editingItem.id || editingItem._id}`
                : `${API_URL}/${endpoint}`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Error al guardar');

            setIsModalOpen(false);
            modalType === 'news' ? fetchNews() : fetchPlayers();
        } catch (err) {
            alert('Error al guardar cambios');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="container" id="admin-container">
                <h2 style={{ color: 'var(--primary)' }}>Iniciar Sesión</h2>
                <form onSubmit={handleLogin} id="login-form">
                    <label htmlFor="password">Contraseña:</label>
                    <div className="input-group">
                        <input
                            type="password"
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
                    <button type="submit">Ingresar</button>
                </form>
            </div>
        );
    }

    return (
        <div id="admin-container" className="admin-shell">
            <div className="admin-header">
                <h2>Panel de Administración</h2>
                <span className="badge">CUF Femenino</span>
                <button
                    onClick={() => setIsLoggedIn(false)}
                    style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid white', padding: '0.3rem 0.6rem', color: 'white', cursor: 'pointer', borderRadius: '4px' }}
                >
                    Salir
                </button>
            </div>

            <div className="admin-grid">
                <aside className="admin-sidebar">
                    <button
                        className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
                        onClick={() => setActiveTab('news')}
                    >
                        📰 Noticias
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
                        onClick={() => setActiveTab('players')}
                    >
                        🏀 Jugadoras
                    </button>
                </aside>

                <main className="admin-main">
                    {activeTab === 'news' && (
                        <section id="tab-news" className="tab active">
                            <div className="toolbar">
                                <input id="news-query" type="search" placeholder="Buscar noticia por título, categoría…" />
                                <button className="btn primary" onClick={() => openModal('news')}>+ Nueva noticia</button>
                            </div>
                            <div className="cards">
                                {news.map(item => (
                                    <article className="card" key={item.id || item._id}>
                                        <img className="thumb" src={item.image || '/img/placeholder.jpg'} alt="" style={{ objectPosition: item.imagePosition || 'center center' }} />
                                        <div className="meta">
                                            <h4>{item.title}</h4>
                                            <div className="chips">
                                                {item.category && <span className="chip">{item.category}</span>}
                                                {item.date && <span className="chip">{item.date}</span>}
                                            </div>
                                        </div>
                                        <div className="actions">
                                            <button className="icon-btn edit" title="Editar" onClick={() => openModal('news', item)}>✏️</button>
                                            <button className="icon-btn delete" title="Eliminar" onClick={() => handleDelete(item.id || item._id!, 'news')}>🗑️</button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeTab === 'players' && (
                        <section id="tab-players" className="tab active">
                            <div className="toolbar">
                                <input id="players-query" type="search" placeholder="Buscar jugadora por nombre…" />
                                <button className="btn primary" onClick={() => openModal('player')}>+ Nueva jugadora</button>
                            </div>
                            <div className="cards">
                                {players.map(item => (
                                    <article className="card" key={item.id || item._id}>
                                        <img className="thumb" src={item.image || '/img/placeholder.jpg'} alt="" />
                                        <div className="meta">
                                            <h4>{item.name}</h4>
                                            <div className="chips">
                                                {item.bio && <span className="chip">Bio</span>}
                                            </div>
                                        </div>
                                        <div className="actions">
                                            <button className="icon-btn edit" title="Editar" onClick={() => openModal('player', item)}>✏️</button>
                                            <button className="icon-btn delete" title="Eliminar" onClick={() => handleDelete(item.id || item._id!, 'players')}>🗑️</button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3 style={{ marginTop: 0 }}>{editingItem ? 'Editar' : 'Nueva'} {modalType === 'news' ? 'noticia' : 'jugadora'}</h3>

                        <form onSubmit={handleSubmit}>
                            {modalType === 'news' ? (
                                <>
                                    <label>Título</label>
                                    <input
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />

                                    <label>Copete</label>
                                    <input
                                        type="text"
                                        value={formData.subtitle || ''}
                                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                    />

                                    <label>Categoría</label>
                                    <select
                                        value={formData.category || ''}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray)', borderRadius: '10px', background: '#fff' }}
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        <option value="U10">U10</option>
                                        <option value="U12">U12</option>
                                        <option value="U13">U13</option>
                                        <option value="U15">U15</option>
                                        <option value="U17">U17</option>
                                        <option value="U21">U21</option>
                                        <option value="Primera">Primera</option>
                                        <option value="LIGA FEMENINA">LIGA FEMENINA</option>
                                    </select>

                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        value={formData.date || ''}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />

                                    <div style={{ marginBottom: '15px' }}>
                                        <label>Modo de Imagen</label>
                                        <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="imageFit"
                                                    value="cover"
                                                    checked={!formData.imageFit || formData.imageFit === 'cover'}
                                                    onChange={e => setFormData({ ...formData, imageFit: 'cover' })}
                                                    style={{ marginRight: '5px' }}
                                                />
                                                Recortar / Rellenar (Cover)
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="imageFit"
                                                    value="contain"
                                                    checked={formData.imageFit === 'contain'}
                                                    onChange={e => setFormData({ ...formData, imageFit: 'contain' })}
                                                    style={{ marginRight: '5px' }}
                                                />
                                                Ver Completa (Contain)
                                            </label>
                                        </div>
                                    </div>

                                    <label>Posición de Imagen (Foco)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', width: '120px', margin: '0 0 15px 0' }}>
                                        {[
                                            'left top', 'center top', 'right top',
                                            'left center', 'center center', 'right center',
                                            'left bottom', 'center bottom', 'right bottom'
                                        ].map(pos => (
                                            <div
                                                key={pos}
                                                onClick={() => setFormData({ ...formData, imagePosition: pos })}
                                                title={pos}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1/1',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    background: (formData.imagePosition || 'center center') === pos || (formData.imagePosition === 'center' && pos === 'center center') ? 'var(--primary)' : '#eee',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <div style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: (formData.imagePosition || 'center center') === pos || (formData.imagePosition === 'center' && pos === 'center center') ? '#fff' : '#aaa'
                                                }} />
                                            </div>
                                        ))}
                                    </div>
                                    <input type="hidden" value={formData.imagePosition || 'center center'} />

                                    <label>Contenido</label>
                                    <textarea
                                        rows={6}
                                        value={formData.content || ''}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />

                                    <label>Biografía</label>
                                    <textarea
                                        rows={5}
                                        value={formData.bio || ''}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </>
                            )}

                            <label>Imagen</label>
                            <div
                                className="dropzone"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                style={{ cursor: 'pointer', overflow: 'hidden' }}
                            >
                                <p>Click o arrastrar imagen</p>
                                {formData.image && (
                                    formData.imageFit === 'contain' ? (
                                        <div style={{ width: '100%', height: '300px', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                backgroundImage: `url(${formData.image})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                filter: 'blur(10px)',
                                                transform: 'scale(1.1)',
                                                opacity: 0.8
                                            }}></div>
                                            <img src={formData.image} alt="preview" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
                                        </div>
                                    ) : (
                                        <img src={formData.image} alt="preview" style={{ width: '100%', height: '300px', objectFit: 'cover', objectPosition: formData.imagePosition || 'center center', borderRadius: '8px' }} />
                                    )
                                )}
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                setFormData({ ...formData, image: ev.target?.result as string, imageFile: file });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
                                <button type="button" className="btn ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn primary" disabled={uploading}>
                                    {uploading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
