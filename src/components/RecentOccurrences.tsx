import { FileText, ArrowRight } from 'lucide-react';
import { crimeData } from '../data/mockData';

export default function RecentOccurrences({ filters }) {
  const occurrences = crimeData.filter(
    (occ) => filters.crimeType === 'all' || occ.type === filters.crimeType
  );

  const formatDate = (isoDate: string) => {
    const [datePart, timePart] = isoDate.split('T');
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year} - ${timePart.slice(0, 5)}`;
  };

  return (
    <div className="recent-card">
      <div className="recent-header">
        <div className="recent-title">
          <FileText size={20} color="#e12c2c" />
          <h3>Últimas Ocorrências</h3>
        </div>
        <a href="#" className="view-all">Ver todas <ArrowRight size={16} /></a>
      </div>

      <div className="table-container">
        <table className="recent-table">
          <tbody>
            {occurrences.map((occ) => (
              <tr key={occ.id}>
                <td><span className="status-dot"></span>{formatDate(occ.date)}</td>
                <td>{occ.type}</td>
                <td>{occ.neighborhood}</td>
                <td>{occ.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}