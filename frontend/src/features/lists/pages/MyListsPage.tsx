import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listaApi } from '../api/listaApi';
import type { ListaCompraDetalle } from '../types/lists.types';
import '../styles/myLists.css';

export function MyListsPage() {
  const navigate = useNavigate();
  const [listas, setListas] = useState<ListaCompraDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formFav, setFormFav] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchListas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listaApi.getAll();
      setListas(data);
    } catch (err) {
      console.error('Error cargando listas:', err);
      setError('Error al cargar las listas. Revisá la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await listaApi.update(isEditing, formName, formFav);
      } else {
        await listaApi.create(formName, formFav);
      }
      setFormName('');
      setFormFav(false);
      setIsEditing(null);
      fetchListas();
    } catch (err) {
      console.error('Error guardando lista:', err);
      alert('Error al guardar la lista');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta lista?')) return;
    try {
      await listaApi.remove(id);
      fetchListas();
    } catch (err) {
      console.error('Error eliminando lista:', err);
      alert('Error al eliminar la lista');
    }
  };

  const toggleFav = async (id: number, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setListas((prev) =>
        prev.map((l) => (l.id === id ? { ...l, favorita: !current } : l))
      );
      await listaApi.toggleFavorita(id);
    } catch (err) {
      console.error('Error toggling fav:', err);
      setListas((prev) =>
        prev.map((l) => (l.id === id ? { ...l, favorita: current } : l))
      );
      alert('Error al actualizar favorito');
    }
  };

  const startEdit = (lista: ListaCompraDetalle, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(lista.id);
    setFormName(lista.nombreLista);
    setFormFav(lista.favorita);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToDetail = (id: number) => {
    navigate(`/mis-listas/${id}`);
  };

  if (loading) {
    return (
      <div className="container">
        <p>Cargando listas...</p>
      </div>
    );
  }

  return (
    <div className="my-lists-container">
      <div className="my-lists-header">
        <h1 className="title">Mis Listas de Compras</h1>
        <p className="subtitle">
          Organizá tus compras habituales y optimizá el gasto en cada una
        </p>
      </div>

      {error && <div className="my-lists-error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="my-lists-form">
        <input
          type="text"
          className="input my-lists-form-input"
          placeholder="Nombre de la lista (ej: Compra del mes, Asado del domingo)"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          required
        />
        <label className="my-lists-checkbox-label">
          <input
            type="checkbox"
            checked={formFav}
            onChange={(e) => setFormFav(e.target.checked)}
          />
          ⭐ Favorita
        </label>
        <button
          type="submit"
          className="btn my-lists-btn-submit"
          disabled={submitting}
        >
          {submitting
            ? 'Guardando...'
            : isEditing
            ? 'Actualizar Lista'
            : '+ Crear Lista'}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn my-lists-btn-cancel"
            onClick={() => {
              setIsEditing(null);
              setFormName('');
              setFormFav(false);
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="my-lists-items-wrapper">
        {listas.length === 0 ? (
          <div className="my-lists-empty-state">
            <span className="my-lists-empty-icon">📋</span>
            <p>No tenés listas creadas todavía.</p>
          </div>
        ) : (
          listas.map((lista) => (
            <div
              key={lista.id}
              onClick={() => goToDetail(lista.id)}
              className={`my-lists-card ${lista.favorita ? 'favorite' : ''}`}
            >
              <div className="my-lists-card-main">
                <button
                  type="button"
                  onClick={(e) => toggleFav(lista.id, lista.favorita, e)}
                  className={`my-lists-star-btn ${lista.favorita ? 'active' : ''}`}
                  title={lista.favorita ? 'Quitar de favoritos' : 'Marcar como favorita'}
                >
                  {lista.favorita ? '★' : '☆'}
                </button>
                <div>
                  <h3 className="my-lists-card-title">{lista.nombreLista}</h3>
                  <small className="my-lists-card-details">
                    📅 {new Date(lista.fechaCreacion).toLocaleDateString()} ·
                    {lista.items
                      ? ` ${lista.items.length} producto${
                          lista.items.length !== 1 ? 's' : ''
                        }`
                      : ' 0 productos'}
                    {lista.totalEstimado
                      ? ` · $${lista.totalEstimado.toLocaleString('es-AR')}`
                      : ''}
                  </small>
                </div>
              </div>

              <div
                className="my-lists-card-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => startEdit(lista, e)}
                  className="my-lists-btn-edit"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(lista.id)}
                  className="my-lists-btn-delete"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyListsPage;
