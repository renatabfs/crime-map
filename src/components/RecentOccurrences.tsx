import { useState, useEffect } from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { crimeService } from '../services/crimeService';
import type { CrimeRecord } from '../services/crimeService';

interface RecentOccurrencesProps {
  filters: any;
  searchQuery?: string;
}

export default function RecentOccurrences({ filters, searchQuery = '' }: RecentOccurrencesProps) {
  const [occurrences, setOccurrences] = useState<CrimeRecord[]>([]);

  useEffect(() => {
    let active = true;
    crimeService
      .getFilteredRecords({
        city: filters.city,
        neighborhood: filters.neighborhood,
        period: filters.period,
        crimeType: filters.crimeType,
        searchQuery,
      })
      .then((data) => {
        if (active) setOccurrences(data);
      });
    return () => {
      active = false;
    };
  }, [filters, searchQuery]);

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