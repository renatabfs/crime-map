import { FileText, ArrowRight } from 'lucide-react';

export default function RecentOccurrences() {
  const occurrences = [
    { id: 1, date: '16/04/2026 - 22:17', type: 'Roubo', neighborhood: 'Centro', description: 'Roubo de celular em via pública.' },
    { id: 2, date: '16/04/2026 - 21:50', type: 'Furto', neighborhood: 'Patagônia', description: 'Furto de bicicleta.' },
    { id: 3, date: '16/04/2026 - 20:32', type: 'Lesão Corporal', neighborhood: 'Boa Vista', description: 'Agressão em estabelecimento.' },
  ];

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
                <td><span className="status-dot"></span>{occ.date}</td>
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