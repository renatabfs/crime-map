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
      radius={25}
      blur={15}
      maxZoom={14}
      gradient={{ 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }}
    />
  );
}