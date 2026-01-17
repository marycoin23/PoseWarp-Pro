
export interface Point {
  x: number;
  y: number;
}

export type RotationMode = 'Auto' | 'Fixed';

export interface Pin extends Point {
  id: string;
  originalX: number;
  originalY: number;
  depth: number;
  rotation: number;
  rotationMode: RotationMode;
}

export interface WarpSettings {
  meshDensity: number;
  pinInfluence: number;
  showMesh: boolean;
  lockPins: boolean;
}

export interface Layer {
  id: string;
  name: string;
  image: HTMLImageElement | null;
  pins: Pin[];
  selectedPinId: string | null;
  visible: boolean;
  opacity: number;
  scale: number;
}

export interface AppState {
  layers: Layer[];
  activeLayerId: string | null;
  settings: WarpSettings;
  history: Layer[][];
  historyIndex: number;
}
