import * as Base from 'expo-haptics';
import { useLifeStore } from './lifeStore';

// The app's vibration, with the student's setting applied: everything that
// buzzes goes through here instead of expo-haptics directly. Same names, so
// `import * as Haptics from '…/core/haptics'` reads the same as before.

export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';

type Level = 'off' | 'light' | 'full';
const level = (): Level => useLifeStore.getState().settings.haptics ?? 'full';
const none = () => Promise.resolve();

export function impactAsync(style: Base.ImpactFeedbackStyle = Base.ImpactFeedbackStyle.Medium) {
  const l = level();
  if (l === 'off') return none();
  return Base.impactAsync(l === 'light' ? Base.ImpactFeedbackStyle.Light : style);
}

export function notificationAsync(type: Base.NotificationFeedbackType = Base.NotificationFeedbackType.Success) {
  const l = level();
  if (l === 'off') return none();
  // Light keeps a single soft tap instead of the success/warning pattern.
  if (l === 'light') return Base.impactAsync(Base.ImpactFeedbackStyle.Light);
  return Base.notificationAsync(type);
}

export function selectionAsync() {
  return level() === 'off' ? none() : Base.selectionAsync();
}
