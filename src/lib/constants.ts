export const GROUPS = [
  {
    name: 'A',
    id: 'a',
  },
  {
    name: 'B',
    id: 'b',
  },
  {
    name: 'C',
    id: 'c',
  },
  {
    name: 'D',
    id: 'd',
  },
] as const;

export const PADS = ['9', '8', '7', '6', '5', '4', '3', '2', '1', '.', '0', 'E'];

export const EFFECTS = {
  0: 'None',
  1: 'Delay',
  2: 'Reverb',
  3: 'Distortion',
  4: 'Chorus',
  5: 'Filter',
  6: 'Compressor',
};

export const EFFECTS_SHORT = {
  0: 'OFF',
  1: 'DLY',
  2: 'RVB',
  3: 'DST',
  4: 'CHO',
  5: 'FLT',
  6: 'CMP',
};
