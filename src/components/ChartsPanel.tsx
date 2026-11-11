import { PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon, TrendingUp } from 'lucide-react';

interface ChartsPanelProps {
  filters: any;
}

export default function ChartsPanel({ filters }: ChartsPanelProps) {
  const pieData = [
    { name: 'Furto', value: 32.7, color: '#e12c2c' },
    { name: 'Roubo', value: 26.1, color: '#ff4d4d' },
    { name: 'Lesão', value: 18.4, color: '#ff7979' },
    { name: 'Homicídio', value: 12.3, color: '#ffb3b3' },
    { name: 'Outros', value: 10.5, color: '#ffe6e6' },
  ];

  // Dados simulados para o gráfico de linha (Evolução)
  const lineData = [
    { year: '2019', crimes: 2100 },
    { year: '2020', crimes: 3000 },
    { year: '2021', crimes: 4200 },
    { year: '2022', crimes: 4800 },
    { year: '2023', crimes: 5100 },
  ];

  return (
    <div className="charts-column">
      <div className="chart-card">
        <div className="chart-header">
          <PieIcon size={18} color="#e12c2c" />
          <h3>Tipos de Ocorrência</h3>
        </div>
        <div className="chart-body" style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1c23', border: 'none', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="chart-card">
        <div className="chart-header">
          <TrendingUp size={18} color="#e12c2c" />
          <h3>Evolução ao Longo dos Anos</h3>
        </div>
        <div className="chart-body" style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="year" stroke="#8b92a5" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1c23', border: 'none', color: '#fff' }} />
              <Line type="monotone" dataKey="crimes" stroke="#e12c2c" strokeWidth={3} dot={{ r: 4, fill: '#e12c2c' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}