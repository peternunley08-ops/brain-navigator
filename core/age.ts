import * as AgeRange from 'expo-age-range';
import { Platform } from 'react-native';

// Brain Navigator is for 13 and up (docs/legal/RELEASE-COMPLIANCE.md, B6).
// Apple's Declared Age Range answers first: the phone shares a range, never a
// birthday, declared by the person, by a parent, or confirmed by Apple. Where
// Apple can't answer (before iOS 26, on the web, or for someone who'd rather
// not share), picking one of four ranges does, unless a state law (Texas,
// Utah, Louisiana) says the age has to come from the App Store.

export type AgeBand = 'under13' | '13-15' | '16-17' | '18+';
/** Who said so: the person to Apple, a parent to Apple, Apple itself, a pick in the app, or Riley. */
export type AgeSource = 'self' | 'guardian' | 'confirmed' | 'picked' | 'sample';

export interface AgeRecord {
  band: AgeBand;
  source: AgeSource;
  /** ISO time of the answer. */
  at: string;
  /** Whether Apple says an age law covers this account (null: Apple couldn't say). */
  regulated?: boolean | null;
  /** Parental controls a parent chose to share with the range. */
  parental?: string[];
}

export const AGE_BANDS: { band: AgeBand; label: string }[] = [
  { band: 'under13', label: 'Under 13' },
  { band: '13-15', label: '13 to 15' },
  { band: '16-17', label: '16 or 17' },
  { band: '18+', label: '18 or older' },
];

/** Apple's ranges come back split at these ages. */
export const AGE_THRESHOLDS = { threshold1: 13, threshold2: 16, threshold3: 18 } as const;

type AppleRange = { lowerBound: number | null; upperBound: number | null; ageRangeDeclaration?: string | null };

/**
 * Apple's answer as a band, or null when Apple didn't really answer. Before
 * iOS 26 the module stands in an adult with no declaration; that isn't an
 * answer, so it doesn't let anyone past.
 */
export function bandFromApple(r: AppleRange): AgeBand | null {
  if (!r.ageRangeDeclaration) return null;
  const lo = r.lowerBound;
  const hi = r.upperBound;
  if (lo != null && lo >= 18) return '18+';
  if (lo != null && lo >= 16) return '16-17';
  if (lo != null && lo >= 13) return '13-15';
  if (hi != null && hi < 13) return 'under13';
  return null;
}

export function sourceFromApple(declaration?: string | null): AgeSource {
  return declaration === 'guardianDeclared' ? 'guardian' : declaration === 'confirmed' ? 'confirmed' : 'self';
}

/** In the app at all: an answer, and 13 or older. */
export function ageAllowed(rec?: AgeRecord | null) {
  return !!rec && rec.band !== 'under13';
}

/**
 * Whether a picked range may stand in for Apple's: not where a state law says
 * the App Store's answer is the one that counts. Apple's plain "no law here"
 * wins; the feature list only decides when Apple couldn't say (seen on the
 * Simulator: not covered, yet every feature listed).
 */
export function canPick(regulated: boolean | null, features: string[] | null) {
  if (regulated !== null) return !regulated;
  return !features?.includes('declaredAgeRangeRequired');
}

export interface AppleAsk {
  record: AgeRecord | null;
  regulated: boolean | null;
  features: string[] | null;
}

/** Ask Apple (iPhone only). Never throws: anything Apple can't answer comes back as no record. */
export async function askApple(now = new Date()): Promise<AppleAsk> {
  if (Platform.OS !== 'ios') return { record: null, regulated: null, features: null };
  const regulated = await AgeRange.isEligibleForAgeFeaturesAsync().catch(() => null);
  const features = await AgeRange.getRequiredRegulatoryFeaturesAsync().catch(() => null);
  const range = await AgeRange.requestAgeRangeAsync(AGE_THRESHOLDS).catch(() => null);
  const band = range ? bandFromApple(range) : null;
  const record: AgeRecord | null =
    range && band
      ? {
          band,
          source: sourceFromApple(range.ageRangeDeclaration),
          at: now.toISOString(),
          regulated,
          ...(range.activeParentalControls?.length ? { parental: range.activeParentalControls } : {}),
        }
      : null;
  return { record, regulated, features };
}
