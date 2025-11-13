export const SKU_EP133 = 'TE032AS001';
export const SKU_EP1320 = 'TE032AS005';
export const SKU_EP40 = 'TE032AS006';

export const SKU_TO_NAME: Record<string, { id: string; name: string }> = {
  [SKU_EP133]: { id: 'ep133', name: 'EP-133' },
  [SKU_EP1320]: { id: 'ep1320', name: 'EP-1320' },
  [SKU_EP40]: { id: 'ep40', name: 'EP-40' },
};

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
