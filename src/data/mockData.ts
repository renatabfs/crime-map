export interface CityMetadata {
  name: string;
  state: string;
  coords: [number, number];
  zoom: number;
}

export interface CrimeRecord {
  id: number;
  date: string;
  city: string;
  state: string;
  type: string;
  neighborhood: string;
  location?: string;
  description?: string;
  source: string;
  coords: [number, number];
}

export const citiesMetadata: CityMetadata[] = [
  {
    name: 'Vitória da Conquista',
    state: 'BA',
    coords: [-14.8661, -40.8394],
    zoom: 13,
  },
  {
    name: 'Salvador',
    state: 'BA',
    coords: [-12.9714, -38.5014],
    zoom: 13,
  },
  {
    name: 'Feira de Santana',
    state: 'BA',
    coords: [-12.2664, -38.9663],
    zoom: 13,
  },
];

export const crimeData: CrimeRecord[] = [
  {
    id: 1,
    date: '2024-04-16T22:17:00',
    city: 'Vitória da Conquista',
    state: 'BA',
    type: 'Roubo',
    neighborhood: 'Centro',
    location: 'Via pública — Centro',
    description: 'Roubo de celular em via pública.',
    source: 'SSP-BA / Boletim de Ocorrência',
    coords: [-14.8661, -40.8394],
  },
  {
    id: 2,
    date: '2024-04-16T21:50:00',
    city: 'Vitória da Conquista',
    state: 'BA',
    type: 'Furto',
    neighborhood: 'Patagônia',
    location: 'Via pública — Patagônia',
    description: 'Furto de bicicleta.',
    source: 'SSP-BA / Boletim de Ocorrência',
    coords: [-14.878, -40.85],
  },
  {
    id: 3,
    date: '2024-04-16T20:32:00',
    city: 'Vitória da Conquista',
    state: 'BA',
    type: 'Lesão Corporal',
    neighborhood: 'Boa Vista',
    location: 'Estabelecimento comercial — Boa Vista',
    description: 'Agressão em estabelecimento.',
    source: 'SSP-BA / Boletim de Ocorrência',
    coords: [-14.885, -40.83],
  },
  {
    id: 4,
    date: '2024-04-15T18:45:00',
    city: 'Vitória da Conquista',
    state: 'BA',
    type: 'Homicídio',
    neighborhood: 'Jardim Valéria',
    location: 'Via pública — Jardim Valéria',
    description: 'Ocorrência com arma de fogo.',
    source: 'SSP-BA / Estatísticas Criminais',
    coords: [-14.895, -40.86],
  },
  {
    id: 5,
    date: '2024-04-15T14:20:00',
    city: 'Vitória da Conquista',
    state: 'BA',
    type: 'Roubo',
    neighborhood: 'Candeias',
    location: 'Via pública — Candeias',
    description: 'Roubo a transeunte.',
    source: 'SSP-BA / Boletim de Ocorrência',
    coords: [-14.855, -40.82],
  },
  {
    id: 6,
    date: '2024-04-16T19:15:00',
    city: 'Salvador',
    state: 'BA',
    type: 'Roubo',
    neighborhood: 'Centro',
    location: 'Via pública — Centro, Salvador',
    description: 'Roubo de aparelho celular em via pública.',
    source: 'SSP-BA / Boletim de Ocorrência',
    coords: [-12.9777, -38.5126],
  },
  {
    id: 7,
    date: '2024-04-15T16:40:00',
    city: 'Salvador',
    state: 'BA',
    type: 'Furto',
    neighborhood: 'Barra',
    location: 'Orla — Barra, Salvador',
    description: 'Furto de bicicleta próximo à orla.',
    source: 'SSP-BA / Boletim de Ocorrência',
    coords: [-13.0094, -38.5326],
  },
  {
    id: 8,
    date: '2024-04-14T21:10:00',
    city: 'Feira de Santana',
    state: 'BA',
    type: 'Furto',
    neighborhood: 'Kalilândia',
    location: 'Via pública — Kalilândia',
    description: 'Furto em veículo estacionado.',
    source: 'SSP-BA / Boletim de Ocorrência',
    coords: [-12.2572, -38.9553],
  },
];