// The Eight Dimensions of Wellness — the shared taxonomy behind Tasks,
// Habits, and the Wellness Wheel. A task or habit tagged to a dimension is
// what lets the wheel compute a real, per-dimension score instead of a
// single flattened "wellness" number.

export type WellnessDimension =
  | 'emotional'
  | 'environmental'
  | 'financial'
  | 'intellectual'
  | 'occupational'
  | 'physical'
  | 'social'
  | 'spiritual';

export interface WellnessDimensionInfo {
  key: WellnessDimension;
  label: string;
  description: string;
}

export const WELLNESS_DIMENSIONS: WellnessDimensionInfo[] = [
  {
    key: 'emotional',
    label: 'Emotional',
    description: 'Coping effectively with life and expressing emotions well.',
  },
  {
    key: 'environmental',
    label: 'Environmental',
    description: 'Pleasant, healthy, safe surroundings — and caring for them.',
  },
  {
    key: 'financial',
    label: 'Financial',
    description: 'Satisfaction with, and wise handling of, your finances.',
  },
  {
    key: 'intellectual',
    label: 'Intellectual',
    description: 'Expanding knowledge and skills; staying open-minded.',
  },
  {
    key: 'occupational',
    label: 'Occupational',
    description: 'Fulfillment from your work and responsibilities.',
  },
  {
    key: 'physical',
    label: 'Physical',
    description: 'Activity, healthy food, and enough sleep.',
  },
  {
    key: 'social',
    label: 'Social',
    description: 'Connection, belonging, and a support system.',
  },
  {
    key: 'spiritual',
    label: 'Spiritual',
    description: 'Purpose, meaning, and inner balance.',
  },
];

export function dimensionLabel(key: WellnessDimension): string {
  return WELLNESS_DIMENSIONS.find((d) => d.key === key)?.label ?? key;
}
