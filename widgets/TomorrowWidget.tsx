import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, lineLimit } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { WidgetProps } from '../core/homeWidget';

// The Night Desk's "Tomorrow" card on the Home Screen. The 'widget' function
// is compiled to a string and runs inside the widget, not the app: it can use
// only @expo/ui SwiftUI views and modifiers, nothing else from the app. So the
// app sends ready-to-show text and the theme colors (core/homeWidget.ts).
const TomorrowWidget = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  // Before the app's first update (the widget gallery), there's nothing yet.
  const ink = props && props.ink ? props.ink : { room: 'black', gold: 'orange', text: 'white', muted: 'gray', faint: 'gray' };
  const room = containerBackground(ink.room, 'widget');
  const head = <Text modifiers={[font({ design: 'serif', size: 15, weight: 'semibold' }), foregroundStyle(ink.gold)]}>Tomorrow</Text>;
  if (!props || !props.hasClasses) {
    return (
      <HStack modifiers={[room]}>
        <VStack alignment="leading" spacing={4}>
          {head}
          <Text modifiers={[font({ size: 13 }), foregroundStyle(ink.muted)]}>Add your classes in Brain Navigator to see your first class here.</Text>
          <Spacer />
        </VStack>
        <Spacer />
      </HStack>
    );
  }
  const first = props.first;
  const n = props.dueCount;
  const day = (
    <VStack alignment="leading" spacing={3}>
      {head}
      <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(ink.text), lineLimit(2)]}>{first ? first.name : 'No classes'}</Text>
      {first ? <Text modifiers={[font({ size: 12 }), foregroundStyle(ink.muted)]}>{'First class ' + first.time}</Text> : null}
      <Spacer />
      <Text modifiers={[font({ size: 12 }), foregroundStyle(ink.faint)]}>{n === 0 ? 'Nothing due' : n + ' due'}</Text>
    </VStack>
  );
  if (env.widgetFamily !== 'systemMedium') {
    return (
      <HStack modifiers={[room]}>
        {day}
        <Spacer />
      </HStack>
    );
  }
  return (
    <HStack alignment="top" spacing={16} modifiers={[room]}>
      {day}
      <VStack alignment="leading" spacing={6}>
        {n === 0 ? <Text modifiers={[font({ size: 13 }), foregroundStyle(ink.muted)]}>Nothing due tomorrow.</Text> : null}
        {props.due.map((a, i) => (
          <VStack key={i} alignment="leading" spacing={1}>
            <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundStyle(ink.text), lineLimit(1)]}>{a.title}</Text>
            {a.className ? <Text modifiers={[font({ size: 11 }), foregroundStyle(ink.faint), lineLimit(1)]}>{a.className}</Text> : null}
          </VStack>
        ))}
        {n > props.due.length ? <Text modifiers={[font({ size: 11 }), foregroundStyle(ink.faint)]}>{'and ' + (n - props.due.length) + ' more'}</Text> : null}
        <Spacer />
      </VStack>
      <Spacer />
    </HStack>
  );
};

export default createWidget<WidgetProps>('TomorrowWidget', TomorrowWidget);
