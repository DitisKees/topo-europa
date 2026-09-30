import raw from "./europe-map.json";

export type MapShape = {
  d: string;
  cx: number;
  cy: number;
};

export type EuropeMapData = {
  width: number;
  height: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  cos0: number;
  countries: Record<string, MapShape>;
};

export const europeMap = raw as EuropeMapData;

export function projectLonLat(lon: number, lat: number): { x: number; y: number } {
  const x = lon * europeMap.cos0;
  const y = lat;
  const px =
    ((x - europeMap.xMin) / (europeMap.xMax - europeMap.xMin)) * europeMap.width;
  const py =
    ((europeMap.yMax - y) / (europeMap.yMax - europeMap.yMin)) * europeMap.height;
  return { x: px, y: py };
}
