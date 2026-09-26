import { demoCoordinates } from '../data/demoInvestigation';

// Bundled scene used only for the automatic offline demonstration.
export const sceneConfig = {
  name: 'Demo SAR observation',
  imageUrl: '/media/demo-sar.png',
  maskUrl: '/media/sample-stage1-mask.jpeg',
  coordinates: demoCoordinates,
};

export const coordinateFields = [
  ['lat', 'Latitude'], ['lon', 'Longitude'],
  ['max_lat', 'Max latitude'], ['min_lat', 'Min latitude'],
  ['max_lon', 'Max longitude'], ['min_lon', 'Min longitude']
];
