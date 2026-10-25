import React from 'react';
import { X, ExternalLink, Clock, MapPin, Tag } from 'lucide-react';

interface SupermarketInfo {
  id: string;
  name: string;
  logo: string;
  description: string;
  hours: string;
  branches: string;
  promotions: string;
  website: string;
}

const SUPERMARKETS_INFO: Record<string, SupermarketInfo> = {
  comodin: {
    id: 'comodin',
    name: 'Comodín en Casa',
    logo: '/icons/icon-comodin.png',
    description: 'Cadena regional líder en el noroeste argentino con amplia cobertura en Jujuy y Salta.',
    hours: 'Lunes a Sábados: 08:30 - 21:30 hs | Domingos: 09:00 - 13:30 hs',
    branches: 'San Salvador de Jujuy, Palpalá, San Pedro, Perico, Salta Capital',
    promotions: 'Descuentos en carnes los martes y jueves, ofertas bancarias del 15% al 20%.',
    website: 'https://www.comodinencasa.com.ar',
  },
  dia: {
    id: 'dia',
    name: 'Supermercados Día',
    logo: '/icons/icon-dia.png',
    description: 'Tienda de proximidad y compras online con marcas propias y promociones Club Día.',
    hours: 'Lunes a Sábados: 08:00 - 21:00 hs | Domingos: 09:00 - 20:00 hs',
    branches: 'Cobertura nacional en principales centros urbanos',
    promotions: 'Cupones personalizados Club Día, 2x1 en productos seleccionados y marca propia.',
    website: 'https://diaonline.supermercadosdia.com.ar',
  },
  vea: {
    id: 'vea',
    name: 'Supermercados Vea',
    logo: '/icons/icon-vea-removebg-preview.png',
    description: 'Parte del grupo Cencosud, enfocado en precios accesibles y ofertas semanales Vea Ahorro.',
    hours: 'Lunes a Sábados: 08:30 - 21:30 hs | Domingos: 09:00 - 14:00 hs',
    branches: 'Presencia en Jujuy, Salta, Tucumán, Mendoza y región centro',
    promotions: 'Días Vea Ahorro, descuentos con Tarjeta Cencosud y ofertas por volumen.',
    website: 'https://www.vea.com.ar',
  },
};

interface SupermarketInfoModalProps {
  supermarketId: string | null;
  onClose: () => void;
}

export const SupermarketInfoModal: React.FC<SupermarketInfoModalProps> = ({
  supermarketId,
  onClose,
}) => {
  if (!supermarketId) return null;
  const info = SUPERMARKETS_INFO[supermarketId];
  if (!info) return null;

  return (
    <div className="super-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="super-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="super-modal-header">
          <div className="super-modal-brand">
            <img src={info.logo} alt={info.name} className="super-modal-logo" />
            <div>
              <h3 className="super-modal-title">{info.name}</h3>
              <span className="super-modal-badge">Cadena Asociada</span>
            </div>
          </div>
          <button
            type="button"
            className="super-modal-close"
            onClick={onClose}
            aria-label="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        <p className="super-modal-desc">{info.description}</p>

        <div className="super-modal-details">
          <div className="super-detail-row">
            <Clock className="super-detail-icon" size={18} />
            <div>
              <strong>Horarios habituales:</strong>
              <p>{info.hours}</p>
            </div>
          </div>

          <div className="super-detail-row">
            <MapPin className="super-detail-icon" size={18} />
            <div>
              <strong>Sucursales principales:</strong>
              <p>{info.branches}</p>
            </div>
          </div>

          <div className="super-detail-row">
            <Tag className="super-detail-icon" size={18} />
            <div>
              <strong>Beneficios habituales:</strong>
              <p>{info.promotions}</p>
            </div>
          </div>
        </div>

        <div className="super-modal-footer">
          <button type="button" className="super-modal-btn-close" onClick={onClose}>
            Cerrar
          </button>
          <a
            href={info.website}
            target="_blank"
            rel="noopener noreferrer"
            className="super-modal-btn-web"
          >
            <span>Ir a tienda oficial</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupermarketInfoModal;
