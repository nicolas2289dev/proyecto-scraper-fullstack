import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardList,
  FolderHeart,
  ListPlus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { listaApi } from '../api/listaApi';
import type { ListaCompraDetalle } from '../types/lists.types';
import '../styles/myLists.css';

const QUICK_PRESETS = [
  'Compra mensual',
  'Semanal de frescos',
  'Almacén y limpieza',
  'Asado con amigos',
];

export function MyListsPage() {
  const navigate = useNavigate();
  const [listas, setListas] = useState<ListaCompraDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formFav, setFormFav] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ListaCompraDetalle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchListas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listaApi.getAll();
      setListas(data);
    } catch (err) {
      console.error('Error cargando listas:', err);
      setError('Error al cargar las listas. Revisá tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await listaApi.update(isEditing, formName.trim(), formFav);
      } else {
        await listaApi.create(formName.trim(), formFav);
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

  const handleCancelEdit = () => {
    setIsEditing(null);
    setFormName('');
    setFormFav(false);
    setError(null);
  };

  const handleSelectPreset = (preset: string) => {
    setFormName(preset);
    inputRef.current?.focus();
  };

  const requestDelete = (lista: ListaCompraDetalle, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(lista);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await listaApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      fetchListas();
    } catch (err) {
      console.error('Error eliminando lista:', err);
      alert('Error al eliminar la lista');
    } finally {
      setDeleting(false);
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
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const goToDetail = (id: number) => {
    navigate(`/mis-listas/${id}`);
  };

  if (loading) {
    return (
      <div className="my-lists-container">
        <div className="my-lists-loading-state">
          <RefreshCw className="my-lists-spinner" size={32} />
          <p>Cargando tus listas de compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-lists-container">
      {/* ─── Encabezado Principal ─── */}
      <div className="my-lists-header">
        <div className="my-lists-header-badge">
          <FolderHeart size={14} />
          <span>Gestión de Compras</span>
        </div>
        <h1 className="title">Mis Listas de Compras</h1>
        <p className="subtitle">
          Organizá tus compras habituales y optimizá el gasto en cada una con precios actualizados.
        </p>
      </div>

      {error && (
        <div className="my-lists-error-banner">
          <X size={16} className="my-lists-error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Panel de creación ─── */}
      <form
        onSubmit={handleSubmit}
        className={`my-lists-composer ${isEditing ? 'is-editing' : ''}`}
      >
        <div className="my-lists-composer-heading">
          <div className="my-lists-composer-heading-icon" aria-hidden="true">
            {isEditing ? <Pencil size={18} /> : <ListPlus size={18} />}
          </div>
          <div>
            <h2>{isEditing ? 'Editar lista' : 'Crear una lista'}</h2>
            <p>
              {isEditing
                ? 'Actualizá el nombre y las preferencias de tu lista.'
                : 'Dale un nombre para empezar a organizar tus compras.'}
            </p>
          </div>
        </div>

        <div className="my-lists-composer-bar">
          <span className="my-lists-composer-glyph" aria-hidden="true">
            {isEditing ? <Pencil size={16} /> : <ListPlus size={16} />}
          </span>

          <input
            ref={inputRef}
            id="list-name"
            type="text"
            className="my-lists-composer-input"
            placeholder={isEditing ? 'Nombre de la lista' : 'Creá una nueva lista...'}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            maxLength={100}
            autoComplete="off"
            required
            aria-label="Nombre de la lista"
          />

          {formName.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setFormName('');
                inputRef.current?.focus();
              }}
              className="my-lists-composer-clear"
              title="Borrar texto"
              aria-label="Borrar texto"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setFormFav((prev) => !prev)}
            className={`my-lists-composer-fav ${formFav ? 'is-fav' : ''}`}
            aria-pressed={formFav}
            title={formFav ? 'Quitar de favoritas' : 'Marcar como favorita'}
            aria-label={formFav ? 'Quitar de favoritas' : 'Marcar como favorita'}
          >
            <Star size={16} fill={formFav ? 'currentColor' : 'none'} aria-hidden="true" />
            <span>{formFav ? 'Favorita' : 'Favorito'}</span>
          </button>

          <button
            type="submit"
            className="my-lists-composer-submit"
            disabled={submitting || !formName.trim()}
          >
            {submitting ? (
              <RefreshCw className="my-lists-spinner" size={15} aria-hidden="true" />
            ) : isEditing ? (
              <>
                <Check size={15} aria-hidden="true" />
                <span>Guardar</span>
              </>
            ) : (
              <>
                <Plus size={15} aria-hidden="true" />
                <span>Crear</span>
              </>
            )}
          </button>
        </div>

        <div className="my-lists-composer-foot">
          {isEditing ? (
            <button
              type="button"
              className="my-lists-composer-cancel"
              onClick={handleCancelEdit}
              disabled={submitting}
            >
              Cancelar edición
            </button>
          ) : (
            <div className="my-lists-composer-presets">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`my-lists-composer-preset ${formName === preset ? 'is-active' : ''}`}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* ─── Listado de Listas Creadas ─── */}
      <div className="my-lists-items-wrapper">
        <div className="my-lists-items-header">
          <div>
            <h2 className="my-lists-items-title">Tus listas</h2>
            <p className="my-lists-items-subtitle">Seleccioná una para ver o editar tus productos.</p>
          </div>
          <span className="my-lists-items-count">{listas.length}</span>
        </div>

        {listas.length === 0 ? (
          <div className="my-lists-empty-state">
            <div className="my-lists-empty-icon-wrap">
              <ClipboardList size={32} aria-hidden="true" />
            </div>
            <h3>No tenés listas creadas todavía</h3>
            <p>Utilizá el panel superior para crear tu primera lista y comparar precios al instante.</p>
          </div>
        ) : (
          <div className="my-lists-grid">
            {listas.map((lista) => (
              <div
                key={lista.id}
                onClick={() => goToDetail(lista.id)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    goToDetail(lista.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`my-lists-card ${lista.favorita ? 'favorite' : ''}`}
                aria-label={`Abrir lista ${lista.nombreLista}`}
              >
                <div className="my-lists-card-main">
                  <button
                    type="button"
                    onClick={(e) => toggleFav(lista.id, lista.favorita, e)}
                    className={`my-lists-star-btn ${lista.favorita ? 'active' : ''}`}
                    title={lista.favorita ? 'Quitar de favoritos' : 'Fijar como favorita'}
                    aria-label={lista.favorita ? 'Quitar de favoritos' : 'Fijar como favorita'}
                  >
                    <Star size={17} fill={lista.favorita ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                  <div className="my-lists-card-info">
                    <div className="my-lists-card-title-row">
                      <h3 className="my-lists-card-title">{lista.nombreLista}</h3>
                      {lista.favorita && (
                        <span className="my-lists-card-fav-pill">Favorita</span>
                      )}
                    </div>
                    <div className="my-lists-card-details">
                      <span>
                        <CalendarDays size={13} aria-hidden="true" />
                        {new Date(lista.fechaCreacion).toLocaleDateString()}
                      </span>
                      <span>
                        <Package size={13} aria-hidden="true" />
                        {lista.items?.length || 0} producto{lista.items?.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>

                {lista.totalEstimado ? (
                  <div className="my-lists-card-total">
                    <span>Total estimado</span>
                    <strong>${lista.totalEstimado.toLocaleString('es-AR')}</strong>
                  </div>
                ) : null}

                <div
                  className="my-lists-card-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => startEdit(lista, e)}
                    className="my-lists-btn-edit"
                    aria-label={`Editar ${lista.nombreLista}`}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => requestDelete(lista, e)}
                    className="my-lists-btn-delete"
                    aria-label={`Eliminar ${lista.nombreLista}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal de confirmación de eliminación ─── */}
      {deleteTarget && (
        <div
          className="my-lists-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-list-title"
        >
          <div className="my-lists-modal" onClick={(e) => e.stopPropagation()}>
            <div className="my-lists-modal-icon" aria-hidden="true">
              <AlertTriangle size={22} />
            </div>
            <h3 id="delete-list-title">Eliminar lista</h3>
            <p>
              ¿Seguro que querés eliminar <strong>{deleteTarget.nombreLista}</strong>? Esta
              acción no se puede deshacer.
            </p>
            <div className="my-lists-modal-actions">
              <button
                type="button"
                className="my-lists-modal-btn ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="my-lists-modal-btn danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <RefreshCw className="my-lists-spinner" size={15} aria-hidden="true" />
                ) : (
                  <Trash2 size={15} aria-hidden="true" />
                )}
                <span>{deleting ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyListsPage;
