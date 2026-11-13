import { HeatmapLayer as ReactLeafletHeatmap } from 'react-leaflet-heatmap-layer-v3';

interface HeatmapLayerProps {
  points: [number, number, number][];
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const heatmapData = points.map(p => ({
    lat: p[0],
    lng: p[1],
    intensity: p[2]
  }));

  return (
    <ReactLeafletHeatmap
      fitBoundsOnLoad={false}
      fitBoundsOnUpdate={false}
      points={heatmapData}
      longitudeExtractor={(m: any) => m.lng}
      latitudeExtractor={(m: any) => m.lat}
      intensityExtractor={(m: any) => m.intensity}
      radius={30}
      blur={20}
      maxZoom={14}
      gradient={{ 0.3: '#4a0404', 0.5: '#8b0000', 0.8: '#e12c2c', 1.0: '#ff6b6b' }}
    />
  );
}