import { useEffect } from 'react';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Hash,
  FileText,
} from 'lucide-react';
import type { CrimeRecord } from '../services/crimeService';
import './CrimeDetailsModal.css';

interface CrimeDetailsModalProps {
  occurrence: CrimeRecord | null;
  onClose: () => void;
}

const CITY_ILLUSTRATIONS: Record<string, string> = {
  'vitória da conquista':
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=900&auto=format&fit=crop',
  salvador:
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=900&auto=format&fit=crop',
  'feira de santana':
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=900&auto=format&fit=crop',
};

export default function CrimeDetailsModal({
  occurrence,
  onClose,
}: CrimeDetailsModalProps) {
  useEffect(() => {
    if (!occurrence) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [occurrence, onClose]);

  if (!occurrence) return null;

  const parsedDate = new Date(occurrence.date);
  const isValidDate = !isNaN(parsedDate.getTime());

  const formattedDate = isValidDate
    ? parsedDate.toLocaleDateString('pt-BR')
    : occurrence.date.split('T')[0] || 'Data não informada';

  const formattedTime = isValidDate
    ? parsedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : (occurrence.date.split('T')[1] || '').slice(0, 5) || 'Horário não informado';

  const occurrenceCode = `OC-${String(occurrence.id).padStart(6, '0')}`;
  const fullLocation = occurrence.location
    ? `${occurrence.location} (${occurrence.city} - ${occurrence.state})`
    : `${occurrence.neighborhood}, ${occurrence.city} - ${occurrence.state}`;

  const illustrationUrl =
    CITY_ILLUSTRATIONS[occurrence.city.toLowerCase()] ||
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=900&auto=format&fit=crop';

  return (
    <div
      className="cm-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cm-modal-title"
      onClick={onClose}
    >
      <div className="cm-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="cm-modal-header">
          <div className="cm-modal-title-group">
            <div className="cm-modal-header-icon">
              <AlertTriangle size={18} />
            </div>
            <h2 id="cm-modal-title">Detalhes da Ocorrência</h2>
          </div>

          <button
            type="button"
            className="cm-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        <div className="cm-modal-body">
          <div className="cm-modal-columns">
            <div className="cm-modal-left-col">
              <div className="cm-detail-row">
                <span className="cm-detail-icon">
                  <ShieldAlert size={17} />
                </span>
                <div className="cm-detail-texts">
                  <span className="cm-detail-label">Tipo de ocorrência</span>
                  <span className="cm-type-badge">{occurrence.type}</span>
                </div>
              </div>

              <div className="cm-detail-row">
                <span className="cm-detail-icon">
                  <Calendar size={17} />
                </span>
                <div className="cm-detail-texts">
                  <span className="cm-detail-label">Data da ocorrência</span>
                  <span className="cm-detail-value">{formattedDate}</span>
                </div>
              </div>

              <div className="cm-detail-row">
                <span className="cm-detail-icon">
                  <Clock size={17} />
                </span>
                <div className="cm-detail-texts">
                  <span className="cm-detail-label">Horário</span>
                  <span className="cm-detail-value">{formattedTime}</span>
                </div>
              </div>

              <div className="cm-detail-row">
                <span className="cm-detail-icon">
                  <MapPin size={17} />
                </span>
                <div className="cm-detail-texts">
                  <span className="cm-detail-label">Local</span>
                  <span className="cm-detail-value">{fullLocation}</span>
                </div>
              </div>

              <div className="cm-detail-row">
                <span className="cm-detail-icon">
                  <Navigation size={17} />
                </span>
                <div className="cm-detail-texts">
                  <span className="cm-detail-label">Bairro</span>
                  <span className="cm-detail-value">{occurrence.neighborhood}</span>
                </div>
              </div>

              <div className="cm-detail-row">
                <span className="cm-detail-icon">
                  <Hash size={17} />
                </span>
                <div className="cm-detail-texts">
                  <span className="cm-detail-label">Código da ocorrência</span>
                  <span className="cm-detail-value">{occurrenceCode}</span>
                </div>
              </div>
            </div>

            <div className="cm-modal-right-col">
              <div className="cm-illustration-box">
                <img
                  src={illustrationUrl}
                  alt={`Imagem ilustrativa urbana de ${occurrence.city}`}
                />
                <span className="cm-illustration-caption">
                  Imagem meramente ilustrativa — {occurrence.city}/{occurrence.state}
                </span>
              </div>

              <div className="cm-description-card">
                <h3>
                  <FileText size={15} color="#e12c2c" />
                  Descrição
                </h3>
                <p>
                  {occurrence.description ||
                    'Registro demonstrativo sem narrativa adicional informada na base.'}
                </p>
                <div className="cm-source-subtext">
                  Base de referência: {occurrence.source} (dados fictícios de demonstração)
                </div>
              </div>
            </div>
          </div>

          <div className="cm-modal-disclaimer">
            <AlertTriangle size={16} />
            <span>
              Os dados apresentados representam registros das bases utilizadas e podem não
              corresponder à totalidade dos crimes ocorridos.
            </span>
          </div>
        </div>

        <div className="cm-modal-footer">
          <button
            type="button"
            className="cm-modal-footer-close"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}