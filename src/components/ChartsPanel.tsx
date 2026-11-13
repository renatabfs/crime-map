import { PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, YAxis } from 'recharts';
import { PieChart as PieIcon, TrendingUp, MapPin } from 'lucide-react';

interface ChartsPanelProps {
    filters: any;
}

export default function ChartsPanel({ filters }: ChartsPanelProps) {

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

    const basePieData = [
        { name: 'Furto', filterKey: 'Furto', value: 32.7, color: '#e12c2c' },
        { name: 'Roubo', filterKey: 'Roubo', value: 26.1, color: '#ff4d4d' },
        { name: 'Lesão', filterKey: 'Lesão Corporal', value: 18.4, color: '#ff7979' },
        { name: 'Homicídio', filterKey: 'Homicídio', value: 12.3, color: '#ffb3b3' },
        { name: 'Outros', filterKey: 'Outros', value: 10.5, color: '#ffe6e6' },
    ];

    const pieData = [
        filters.crimeType === 'all'
            ? basePieData
            : basePieData.map((item) => ({
                ...item,
                color: item.filterKey === filters.crimeType ? '#e12c2c' : '#2a2d37',
            }))
    ];

    const baseLineData =
        filters.period === '6-months'
            ? [
                { year: 'Nov', crimes: 380 },
                { year: 'Dez', crimes: 450 },
                { year: 'Jan', crimes: 410 },
                { year: 'Fev', crimes: 390 },
                { year: 'Mar', crimes: 470 },
                { year: 'Abr', crimes: 510 },
            ]
            : filters.period === '1-year'
                ? [
                    { year: '2º Tri', crimes: 1120 },
                    { year: '3º Tri', crimes: 1290 },
                    { year: '4º Tri', crimes: 1410 },
                    { year: '1º Tri', crimes: 1280 },
                ]
                : [
                    { year: '2019', crimes: 2100 },
                    { year: '2020', crimes: 3000 },
                    { year: '2021', crimes: 4200 },
                    { year: '2022', crimes: 4800 },
                    { year: '2023', crimes: 5100 },
                ];

    const lineData = baseLineData.map((item) => ({
        ...item,
        crimes: Math.max(1, Math.round(item.crimes * typeMultiplier)),
    }));
    
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