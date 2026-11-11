import { PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, YAxis } from 'recharts';
import { PieChart as PieIcon, TrendingUp, MapPin } from 'lucide-react';

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

    const lineData = [
        { year: '2019', crimes: 2100 },
        { year: '2020', crimes: 3000 },
        { year: '2021', crimes: 4200 },
        { year: '2022', crimes: 4800 },
        { year: '2023', crimes: 5100 },
    ];

    const barData = [
        { name: 'Centro', crimes: 1842 },
        { name: 'Patagônia', crimes: 1235 },
        { name: 'Boa Vista', crimes: 1103 },
        { name: 'Jardim Valéria', crimes: 987 },
        { name: 'Candeias', crimes: 877 },
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
            <div className="chart-card">
                <div className="chart-header">
                    <MapPin size={18} color="#e12c2c" />
                    <h3>Bairros Mais Afetados</h3>
                </div>
                <div className="chart-body" style={{ minHeight: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#8b92a5', fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1a1c23', border: 'none', color: '#fff' }} />
                            <Bar dataKey="crimes" fill="#e12c2c" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}