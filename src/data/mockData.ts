export interface CrimeRecord {
  id: number;
  date: string;
  type: string;
  neighborhood: string;
  description: string;
  coords: [number, number];
}

export const crimeData: CrimeRecord[] = [
  {
    id: 1,
    date: '2024-04-16T22:17:00',
    type: 'Roubo',
    neighborhood: 'Centro',
    description: 'Roubo de celular em via pública.',
    coords: [-14.8661, -40.8394],
  },
  {
    id: 2,
    date: '2024-04-16T21:50:00',
    type: 'Furto',
    neighborhood: 'Patagônia',
    description: 'Furto de bicicleta.',
    coords: [-14.878, -40.85],
  },
  {
    id: 3,
    date: '2024-04-16T20:32:00',
    type: 'Lesão Corporal',
    neighborhood: 'Boa Vista',
    description: 'Agressão em estabelecimento.',
    coords: [-14.885, -40.83],
  },
  {
    id: 4,
    date: '2024-04-15T18:45:00',
    type: 'Homicídio',
    neighborhood: 'Jardim Valéria',
    description: 'Ocorrência com arma de fogo.',
    coords: [-14.895, -40.86],
  },
  {
    id: 5,
    date: '2024-04-15T14:20:00',
    type: 'Roubo',
    neighborhood: 'Candeias',
    description: 'Roubo a transeunte.',
    coords: [-14.855, -40.82],
  },
];
