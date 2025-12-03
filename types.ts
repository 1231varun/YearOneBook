export interface PhotoSlot {
  id: string;
  label: string;
  image: HTMLImageElement | null;
  file: File | null;
  x: number; // Relative center X (0-1)
  y: number; // Relative center Y (0-1)
  radius: number; // Relative radius (0-1)
  isCenter?: boolean;
  imageOffsetX: number; // Relative offset X (0-1)
  imageOffsetY: number; // Relative offset Y (0-1)
}

export interface CollageConfig {
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export type SlotId = 
  | 'day1' | 'month1' | 'month2' | 'month3' 
  | 'month4' | 'month5' | 'month6' | 'month7' 
  | 'month8' | 'month9' | 'month10' | 'month11' 
  | 'birthday';