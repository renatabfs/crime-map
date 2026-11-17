import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, YAxis } from 'recharts';
import { PieChart as PieIcon, TrendingUp, MapPin } from 'lucide-react';
import { crimeService } from '../services/crimeService';
import type { CrimeRecord } from '../services/crimeService';

interface ChartsPanelProps {
    filters: any;
}

export default function ChartsPanel({ filters }: ChartsPanelProps) {

    const [records, setRecords] = useState<CrimeRecord[]>([]);

    useEffect(() => {
        let active = true;
        crimeService
            .getFilteredRecords({
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

    const pieData = useMemo(() => {
        const counts: Record<string, number> = {};
        records.forEach((r) => {
            counts[r.type] = (counts[r.type] || 0) + 1;
        });

        const palette = ['#e12c2c', '#ff4d4d', '#ff7979', '#ffb3b3', '#ffe6e6'];
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
            return [{ name: 'Sem registros', value: 1, color: '#2a2d37' }];
        }

        return entries.map(([name, value], idx) => ({
            name,
            value,
            color: palette[idx % palette.length],
        }));
    }, [records]);

    const lineData = useMemo(() => {
        const counts: Record<string, number> = {};
        records.forEach((r) => {
            const d = new Date(r.date);
            if (isNaN(d.getTime())) return;
            const key =
                filters.period === '6-months' || filters.period === '1-year'
                    ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`
                    : String(d.getFullYear());
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([year, crimes]) => ({ year, crimes }));
    }, [records, filters.period]);

    const barData = useMemo(() => {
        const counts: Record<string, number> = {};
        records.forEach((r) => {
            counts[r.neighborhood] = (counts[r.neighborhood] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, crimes]) => ({ name, crimes }));
    }, [records]);

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