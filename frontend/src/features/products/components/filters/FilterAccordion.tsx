import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FilterAccordionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: number | string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
}

export const FilterAccordion: React.FC<FilterAccordionProps> = ({
  id,
  title,
  icon,
  badge,
  children,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onToggle,
  action,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
    if (!isControlled) {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const contentId = `${id}-content`;
  const headerId = `${id}-header`;

  return (
    <div className="filter-accordion">
      <div className="filter-accordion-header-row">
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={handleToggle}
          className="filter-accordion-toggle"
        >
          <div className="filter-accordion-title-wrap">
            {icon && <span className="filter-accordion-icon">{icon}</span>}
            <span className="filter-accordion-title">{title}</span>
            {badge !== undefined && badge !== null && Number(badge) > 0 && (
              <span className="filter-accordion-badge">{badge}</span>
            )}
          </div>
          <ChevronDown
            className={`filter-accordion-chevron ${open ? 'rotated' : ''}`}
            size={18}
            aria-hidden="true"
          />
        </button>
        {action && <div className="filter-accordion-action">{action}</div>}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={headerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="filter-accordion-content">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterAccordion;
