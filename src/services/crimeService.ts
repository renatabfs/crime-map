import { crimeData, citiesMetadata, CrimeRecord, CityMetadata } from '../data/mockData';

export interface CrimeFilters {
  city?: string;
  neighborhood?: string;
  period?: string;
  crimeType?: string;
  searchQuery?: string;
}

export interface DataSourceMetadata {
  totalRecords: number;
  totalCities: number;
  uniqueNeighborhoods: number;
  periodLabel: string;
  lastUpdateLabel: string;
}

const USE_REAL_API = false;
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function filterRecordsLocally(records: CrimeRecord[], filters?: CrimeFilters): CrimeRecord[] {
  if (!filters) return records;

  const referenceDate =
    records.length > 0
      ? new Date(Math.max(...records.map((r) => new Date(r.date).getTime())))
      : new Date();

  return records.filter((record) => {
    if (
      filters.city &&
      filters.city !== 'all' &&
      record.city.toLowerCase() !== filters.city.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.neighborhood &&
      filters.neighborhood !== 'all' &&
      record.neighborhood.toLowerCase() !== filters.neighborhood.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.crimeType &&
      filters.crimeType !== 'all' &&
      record.type.toLowerCase() !== filters.crimeType.toLowerCase()
    ) {
      return false;
    }

    if (filters.period && filters.period !== 'all') {
      const recDate = new Date(record.date);
      if (/^\d{4}$/.test(filters.period)) {
        if (recDate.getFullYear().toString() !== filters.period) return false;
      } else {
        const diffDays =
          (referenceDate.getTime() - recDate.getTime()) / (1000 * 60 * 60 * 24);
        if (filters.period === '30-days' && diffDays > 30) return false;
        if (filters.period === '6-months' && diffDays > 183) return false;
        if (filters.period === '1-year' && diffDays > 365) return false;
        if (filters.period === '5-years' && diffDays > 1826) return false;
      }
    }

    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const matches =
        record.city.toLowerCase().includes(q) ||
        record.neighborhood.toLowerCase().includes(q) ||
        record.type.toLowerCase().includes(q) ||
        record.description.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });
}

export const crimeService = {
  async getAllRecords(): Promise<CrimeRecord[]> {
    if (USE_REAL_API && API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/occurrences`);
      if (!response.ok) throw new Error('Erro ao buscar ocorrências na API');
      return response.json();
    }
    return Promise.resolve([...crimeData]);
  },

  async getFilteredRecords(filters?: CrimeFilters): Promise<CrimeRecord[]> {
    const all = await this.getAllRecords();
    return filterRecordsLocally(all, filters);
  },

  async getCitiesMetadata(): Promise<CityMetadata[]> {
    if (USE_REAL_API && API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/cities`);
      if (!response.ok) throw new Error('Erro ao buscar metadados das cidades');
      return response.json();
    }
    return Promise.resolve([...citiesMetadata]);
  },

  async getNeighborhoodsByCity(city: string): Promise<string[]> {
    const all = await this.getAllRecords();
    const scoped =
      !city || city === 'all'
        ? all
        : all.filter((r) => r.city.toLowerCase() === city.toLowerCase());
    return Array.from(new Set(scoped.map((r) => r.neighborhood))).sort();
  },

  async getDataSourcesSummary(): Promise<DataSourceMetadata> {
    const [records, cities] = await Promise.all([
      this.getAllRecords(),
      this.getCitiesMetadata(),
    ]);

    const uniqueNeighborhoods = new Set(records.map((r) => r.neighborhood)).size;
    const sortedDates = records
      .map((r) => new Date(r.date))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    let periodLabel = 'Indisponível na base atual';
    let lastUpdateLabel = 'Indisponível na base atual';

    if (sortedDates.length > 0) {
      const firstYear = sortedDates[0].getFullYear();
      const lastDate = sortedDates[sortedDates.length - 1];
      const lastYear = lastDate.getFullYear();
      periodLabel = firstYear === lastYear ? `${firstYear}` : `${firstYear} – ${lastYear}`;
      lastUpdateLabel = lastDate.toLocaleDateString('pt-BR');
    }

    return {
      totalRecords: records.length,
      totalCities: cities.length,
      uniqueNeighborhoods,
      periodLabel,
      lastUpdateLabel,
    };
  },
};