import React from 'react';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

export const ShoppingCircuitTipsCard: React.FC = () => {
  const tips = [
    'Elegí productos de marca propia',
    'Comprá en mayor cantidad',
    'Aprovechá las ofertas del día',
  ];

  return (
    <div className="opt-card opt-card--tips">
      {/* Encabezado con bombilla amarilla */}
      <div className="opt-card-header">
        <Lightbulb className="opt-card-header-icon opt-card-header-icon--yellow" size={20} />
        <h3 className="opt-card-header-title">Consejos para ahorrar</h3>
      </div>

      {/* Lista de consejos con tildes verdes */}
      <ul className="opt-tips-list">
        {tips.map((tip) => (
          <li key={tip} className="opt-tip-item">
            <CheckCircle2 className="opt-tip-check-icon" size={18} />
            <span className="opt-tip-item-text">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

