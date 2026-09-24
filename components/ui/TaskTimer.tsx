import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../core/theme';

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
  if (ratio > 0.2) return colors.lantern;
  return colors.unlocked;
}

export function TaskTimer({ budgetMinutes }: TaskTimerProps) {
  const budgetSeconds = budgetMinutes * 60;
  const [remaining, setRemaining] = useState(budgetSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((s) => s - 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const color = urgencyColor(remaining, budgetSeconds);

  return (
    <Pressable onPress={() => setRunning((r) => !r)} style={[styles.badge, { borderColor: color }]}>
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
    fontFamily: fonts.mono,
    fontSize: 13,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.inkFaint,
  },
});
