import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { alpha, colors, fonts } from '../../core/theme';

interface TaskTimerProps {
  budgetMinutes: number;
}

function formatClock(totalSeconds: number) {
  const over = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const mm = String(Math.floor(abs / 60)).padStart(2, '0');
  const ss = String(abs % 60).padStart(2, '0');
  return `${over ? '+' : ''}${mm}:${ss}`;
}

// Urgency escalates as the budget burns down — the whole point of giving a
// task less time than feels comfortable, per Parkinson's Law.
function urgencyColor(remainingSeconds: number, budgetSeconds: number) {
  if (remainingSeconds < 0) return colors.danger;
  const ratio = remainingSeconds / budgetSeconds;
  if (ratio > 0.5) return colors.secured;
  if (ratio > 0.2) return colors.flame;
  return colors.unlocked;
}

export function TaskTimer({ budgetMinutes }: TaskTimerProps) {
  const budgetSeconds = budgetMinutes * 60;
  const [remaining, setRemaining] = useState(budgetSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    // Compute from a real timestamp rather than decrementing once per tick —
    // React Native suspends JS timers while the app is backgrounded, so a
    // per-tick decrement would drift behind real elapsed time as soon as the
    // screen locks or the user switches apps mid-timer. Capturing `remaining`
    // here (not as a setInterval dependency) freezes the baseline at the
    // instant the timer (re)started, so resuming after any pause elsewhere
    // starts a fresh, correct baseline.
    const startedAt = Date.now();
    const remainingAtStart = remaining;
    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(remainingAtStart - elapsedSeconds);
    };
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const color = urgencyColor(remaining, budgetSeconds);

  return (
    <Pressable
      onPress={() => setRunning((r) => !r)}
      style={[styles.badge, { borderColor: alpha(color, 0.6), backgroundColor: alpha(color, running ? 0.16 : 0.06) }]}
      accessibilityRole="button"
      accessibilityLabel={`${running ? 'Pause' : 'Start'} timer, ${formatClock(remaining)} left`}
    >
      <Text style={[styles.text, { color }]}>{formatClock(remaining)}</Text>
      <Text style={styles.label}>{running ? 'Pause' : remaining === budgetSeconds ? 'Start' : 'Resume'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textFaint,
  },
});
