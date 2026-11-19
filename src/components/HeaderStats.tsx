import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  VenetianMask,
  Car,
  Shield,
} from 'lucide-react';
import { crimeService } from '../services/crimeService';
import type { CrimeRecord } from '../services/crimeService';

interface HeaderStatsProps {
  filters: any;
}

export default function HeaderStats({ filters }: HeaderStatsProps) {
  const [records, setRecords] = useState<CrimeRecord[]>([]);

  useEffect(() => {
    let active = true;
    crimeService
      .getFilteredRecords({
        state: filters.state,
        city: filters.city,
        neighborhood: filters.neighborhood,
        period: filters.period,
        crimeType: filters.crimeType,
      })
      .then((data) => {
        if (active) setRecords(data);
      });
    return () => {
      active = false;
    };
  }, [filters]);

  const counts = useMemo(() => {
    const total = records.length;
    const violence = records.filter((r) =>
      ['homicídio', 'lesão corporal', 'agressão'].includes(r.type.toLowerCase())
    ).length;
    const theftAndRobbery = records.filter((r) =>
      ['roubo', 'furto'].includes(r.type.toLowerCase())
    ).length;
    const others = Math.max(0, total - violence - theftAndRobbery);

    return { total, violence, theftAndRobbery, others };
  }, [records]);

  const stats = [
    {
      id: 1,
      title: 'Ocorrências no período',
      value: counts.total.toLocaleString('pt-BR'),
      icon: <AlertTriangle size={28} className="icon-red" />,
      highlight: true,
    },
    {
      id: 2,
      title: 'Casos de violência',
      value: counts.violence.toLocaleString('pt-BR'),
      icon: <VenetianMask size={28} className="icon-gray" />,
    },
    {
      id: 3,
      title: 'Furtos e roubos',
      value: counts.theftAndRobbery.toLocaleString('pt-BR'),
      icon: <Car size={28} className="icon-gray" />,
    },
    {
      id: 4,
      title: 'Outros crimes',
      value: counts.others.toLocaleString('pt-BR'),
      icon: <Shield size={28} className="icon-green" />,
    },
  ];

  return (
    <div className="header-stats">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={`stat-card ${stat.highlight ? 'highlighted' : ''}`}
        >
          <div className="stat-icon-wrapper">{stat.icon}</div>
          <div className="stat-info">
            <div className="stat-header">
              <h2>{stat.value}</h2>
            </div>
            <p>{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
