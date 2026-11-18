
declare module 'react-leaflet-heatmap-layer-v3' {
  import type { ComponentType } from 'react';

  interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
  }

  interface HeatmapLayerProps {
    fitBoundsOnLoad?: boolean;
    fitBoundsOnUpdate?: boolean;
    points: HeatmapPoint[];
    longitudeExtractor: (point: HeatmapPoint) => number;
    latitudeExtractor: (point: HeatmapPoint) => number;
    intensityExtractor: (point: HeatmapPoint) => number;
    radius?: number;
    blur?: number;
    maxZoom?: number;
    gradient?: Record<number, string>;
  }

  export const HeatmapLayer: ComponentType<HeatmapLayerProps>;
}
