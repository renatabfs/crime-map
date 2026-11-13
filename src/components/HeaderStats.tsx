import {
  AlertTriangle,
  VenetianMask,
  Car,
  Shield,
  ArrowUp,
} from 'lucide-react';

interface HeaderStatsProps {
  filters: any;
}

export default function HeaderStats({ filters }: HeaderStatsProps) {
  const periodMultiplier =
    filters.period === '1-year' ? 0.24 : filters.period === '6-months' ? 0.11 : 1;

  const typeMultipliers: Record<string, number> = {
    all: 1,
    Furto: 0.33,
    Roubo: 0.26,
    'Lesão Corporal': 0.18,
    Homicídio: 0.12,
  };

  const typeMultiplier = typeMultipliers[filters.crimeType] ?? 1;
  const factor = periodMultiplier * typeMultiplier;

  const formatStat = (base: number) =>
    Math.max(1, Math.round(base * factor)).toLocaleString('pt-BR');

  const stats = [
    {
      id: 1,
      title: 'Ocorrências no período',
      value: formatStat(12348),
      trend: '+8,2%',
      icon: <AlertTriangle size={28} className="icon-red" />,
      highlight: true,
    },
    {
      id: 2,
      title: 'Casos de violência',
      value: formatStat(3742),
      trend: '+6,1%',
      icon: <VenetianMask size={28} className="icon-gray" />,
    },
    {
      id: 3,
      title: 'Furtos e roubos',
      value: formatStat(2193),
      trend: '+12,4%',
      icon: <Car size={28} className="icon-gray" />,
    },
    {
      id: 4,
      title: 'Outros crimes',
      value: formatStat(6413),
      trend: '+4,7%',
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
              <span className="trend positive">
                <ArrowUp size={14} /> {stat.trend}
              </span>
            </div>
            <p>{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
