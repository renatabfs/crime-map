
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { Layer } from 'leaflet';
import { HeatLayer } from 'leaflet.heat';

interface HeatmapLayerProps {
  points: [number, number, number][];
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    const heatLayer = new HeatLayer(points, {
      radius: 40,
      blur: 25,
      minOpacity: 0.2,
      maxZoom: 5,
      max: 1,
      gradient: {
        0.2: '#4a0404',
        0.4: '#8b0000',
        0.6: '#e12c2c',
        0.8: '#ff3333',
        1.0: '#ff7777',
      },
    });

    const layer = heatLayer as unknown as Layer;

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
