import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../core/theme';

// The app's own line icons, drawn on a 24-unit grid with round joins so
// they sit with Figtree's strokes. One set, one weight, everywhere.

export type IconName =
  | 'back'
  | 'chevron'
  | 'close'
  | 'plus'
  | 'minus'
  | 'check'
  | 'drawer'
  | 'candle'
  | 'loops'
  | 'map'
  | 'steady'
  | 'wind'
  | 'mic'
  | 'pen'
  | 'flame'
  | 'heart'
  | 'trend'
  | 'sun'
  | 'moon'
  | 'plate'
  | 'repeat'
  | 'bowl'
  | 'calendar'
  | 'jar'
  | 'wheel'
  | 'flask'
  | 'trash'
  | 'clock'
  | 'sparkle'
  | 'pin'
  | 'help'
  | 'nap'
  | 'arrow'
  | 'pause'
  | 'play'
  | 'chat'
  | 'feather'
  | 'image'
  | 'music'
  | 'speaker'
  | 'speakerOff'
  | 'person'
  | 'book'
  | 'timer'
  | 'phone'
  | 'message'
  | 'cap'
  | 'flag'
  | 'edit'
  | 'star'
  | 'search'
  | 'grade'
  | 'cards'
  | 'gift'
  | 'car'
  | 'hands'
  | 'bag'
  | 'bed'
  | 'settings'
  | 'share'
  | 'trophy'
  | 'list'
  | 'bolt'
  | 'quote'
  | 'people'
  | 'hourglass'
  | 'layers';

const shapes: Record<IconName, (c: string) => ReactNode> = {
  back: () => <Path d="M14.5 5.5 8 12l6.5 6.5" />,
  chevron: () => <Path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  close: () => <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  plus: () => <Path d="M12 5.5v13M5.5 12h13" />,
  minus: () => <Path d="M5.5 12h13" />,
  check: () => <Path d="m5.5 12.5 4.2 4.2 8.8-9.4" />,
  drawer: () => (
    <>
      <Rect x={4.5} y={4.5} width={6.2} height={6.2} rx={1.8} />
      <Rect x={13.3} y={4.5} width={6.2} height={6.2} rx={1.8} />
      <Rect x={4.5} y={13.3} width={6.2} height={6.2} rx={1.8} />
      <Rect x={13.3} y={13.3} width={6.2} height={6.2} rx={1.8} />
    </>
  ),
  candle: () => (
    <>
      <Path d="M12 3.5c1.6 1.7 2.2 3 2.2 4.1a2.2 2.2 0 0 1-4.4 0c0-1.1.6-2.4 2.2-4.1Z" />
      <Rect x={8.2} y={11} width={7.6} height={9.5} rx={1.6} />
    </>
  ),
  loops: () => (
    <>
      <Circle cx={12} cy={12} r={7.5} />
      <Path d="M12 7.8v4.4l2.8 1.8" />
    </>
  ),
  map: () => (
    <>
      <Circle cx={6} cy={16.5} r={2} />
      <Circle cx={12.5} cy={7} r={2} />
      <Circle cx={18.5} cy={14.5} r={2} />
      <Path d="m7.2 14.8 4.1-6M14.3 8.2l3.3 4.6M8 16.2l8.5-1.4" />
    </>
  ),
  steady: () => <Path d="M3.5 13c2.2 0 2.2-3 4.3-3s2.1 4.5 4.2 4.5 2.1-6 4.2-6 2.1 4.5 4.3 4.5" />,
  wind: () => (
    <>
      <Path d="M3.5 9h10.2a2.6 2.6 0 1 0-2.6-2.6" />
      <Path d="M3.5 13.5h13.7a2.8 2.8 0 1 1-2.8 2.8" />
      <Path d="M3.5 17.5h6" />
    </>
  ),
  mic: () => (
    <>
      <Rect x={9} y={3.5} width={6} height={11} rx={3} />
      <Path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3" />
    </>
  ),
  pen: () => <Path d="M5 19l1-4.2L15.6 5.2a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L9.2 18 5 19ZM13.5 7.3l3.2 3.2" />,
  flame: () => (
    <Path d="M12 3.5c3.4 3.3 5.4 6.3 5.4 9.3a5.4 5.4 0 0 1-10.8 0c0-1.8.8-3.4 2.1-4.7.3 1.4 1 2.3 2 2.6-.5-2.4.1-4.8 1.3-7.2Z" />
  ),
  heart: () => (
    <Path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4Z" />
  ),
  trend: () => <Path d="M4 17.5l5-5.5 3.5 3.2L20 7M15.5 7H20v4.5" />,
  sun: () => (
    <>
      <Circle cx={12} cy={12} r={3.8} />
      <Path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
    </>
  ),
  moon: () => <Path d="M18.5 14.6A7 7 0 0 1 9.4 5.5a7 7 0 1 0 9.1 9.1Z" />,
  plate: () => (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Circle cx={12} cy={12} r={4.4} />
    </>
  ),
  repeat: () => (
    <>
      <Path d="M5 11V9.5A3 3 0 0 1 8 6.5h10.5M16 4l2.5 2.5L16 9" />
      <Path d="M19 13v1.5a3 3 0 0 1-3 3H5.5M8 20l-2.5-2.5L8 15" />
    </>
  ),
  bowl: () => (
    <>
      <Path d="M4 11.5h16a8 8 0 0 1-16 0Z" />
      <Path d="M9 8.5c0-1.5 1-2 1-3.5M13 8.5c0-1.5 1-2 1-3.5" />
    </>
  ),
  calendar: () => (
    <>
      <Rect x={4} y={5.5} width={16} height={14.5} rx={3} />
      <Path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  jar: () => (
    <>
      <Path d="M8 4.5h8M9 4.5v2.2c-2.3 1-3.5 2.6-3.5 5v5.3A2.5 2.5 0 0 0 8 19.5h8a2.5 2.5 0 0 0 2.5-2.5v-5.3c0-2.4-1.2-4-3.5-5V4.5" />
      <Path d="M9.5 13.5l1.7 1.7 3.3-3.4" />
    </>
  ),
  wheel: () => (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" />
    </>
  ),
  flask: () => (
    <>
      <Path d="M9.5 3.5h5M10.5 3.5v5.2L5.6 17.2a2.2 2.2 0 0 0 1.9 3.3h9a2.2 2.2 0 0 0 1.9-3.3l-4.9-8.5V3.5" />
      <Path d="M7.8 14h8.4" />
    </>
  ),
  trash: () => (
    <Path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6.5 7l.9 11.6A2 2 0 0 0 9.4 20.5h5.2a2 2 0 0 0 2-1.9L17.5 7" />
  ),
  clock: () => (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Path d="M12 7.5V12l3 2" />
    </>
  ),
  sparkle: () => (
    <Path d="M12 4c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6ZM18.5 16c.2 1.2.8 1.8 2 2-1.2.2-1.8.8-2 2-.2-1.2-.8-1.8-2-2 1.2-.2 1.8-.8 2-2Z" />
  ),
  pin: () => (
    <>
      <Path d="M12 20.5s6-5.4 6-10.5a6 6 0 0 0-12 0c0 5.1 6 10.5 6 10.5Z" />
      <Circle cx={12} cy={10} r={2.2} />
    </>
  ),
  help: () => (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Path d="M9.7 9.6a2.4 2.4 0 1 1 3.3 2.2c-.6.3-1 .8-1 1.5v.4" />
      <Circle cx={12} cy={16.4} r={0.4} />
    </>
  ),
  nap: () => <Path d="M5 6.5h5l-5 5.5h5M13 11h6.5L13 18.5h6.5" />,
  arrow: () => <Path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5" />,
  pause: () => <Path d="M9 6v12M15 6v12" />,
  play: () => <Path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.6-6.2a.8.8 0 0 0 0-1.4L9.2 5.1a.8.8 0 0 0-1.2.7Z" />,
  chat: () => (
    <Path d="M5 17.5V7a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 7v6.5a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5v-2Z" />
  ),
  feather: () => (
    <Path d="M19 5c-6.5 0-11 4.5-11 11v3.5M8 16h5.5c3.6 0 5.5-4.5 5.5-11M5 19.5l3-3" />
  ),
  book: () => (
    <>
      <Path d="M5 5.5A2 2 0 0 1 7 3.5h11.5v15H7a2 2 0 0 0-2 2v-15Z" />
      <Path d="M5 20.5a2 2 0 0 1 2-2h11.5v2H7a2 2 0 0 1-2 0ZM9 8h6" />
    </>
  ),
  timer: () => (
    <>
      <Circle cx={12} cy={13.5} r={7} />
      <Path d="M12 13.5V10M9.5 3.5h5M18 7.5l1.5-1.5" />
    </>
  ),
  phone: () => (
    <Path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />
  ),
  message: () => (
    <>
      <Path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3.5V16.5h0a2 2 0 0 1-2-2v-8Z" />
      <Path d="M8.5 9.5h7M8.5 12.5h4.5" />
    </>
  ),
  cap: () => (
    <>
      <Path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" />
      <Path d="M6.5 11.5v4c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4M21.5 9.5v5" />
    </>
  ),
  flag: () => <Path d="M5.5 20.5v-16M5.5 4.5h11l-2 4 2 4h-11" />,
  edit: () => <Path d="M5 19l1-4.2L15.6 5.2a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L9.2 18 5 19Z" />,
  star: () => <Path d="m12 4.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.6l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 4.2Z" />,
  search: () => (
    <>
      <Circle cx={10.8} cy={10.8} r={6} />
      <Path d="m15.3 15.3 4.2 4.2" />
    </>
  ),
  grade: () => (
    <>
      <Rect x={4.5} y={3.5} width={15} height={17} rx={2.5} />
      <Path d="M8.5 15.5 11 8.5l2.5 7M9.3 13.2h3.4M15.5 10v3M14 11.5h3" />
    </>
  ),
  cards: () => (
    <>
      <Rect x={3.5} y={7} width={13} height={13} rx={2.5} />
      <Path d="M7.5 7V6a2.5 2.5 0 0 1 2.5-2.5h8A2.5 2.5 0 0 1 20.5 6v8a2.5 2.5 0 0 1-2.5 2.5h-1.5" />
    </>
  ),
  gift: () => (
    <>
      <Rect x={4} y={9} width={16} height={11} rx={2} />
      <Path d="M3.5 9h17M12 9v11M12 9c-1-3-4.5-4.5-5.5-2.5S9 9 12 9Zm0 0c1-3 4.5-4.5 5.5-2.5S15 9 12 9Z" />
    </>
  ),
  car: () => (
    <>
      <Path d="M4 15.5v-3l2-5a2 2 0 0 1 1.9-1.3h8.2A2 2 0 0 1 18 7.5l2 5v3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 15.5ZM4 12.5h16" />
      <Circle cx={7.5} cy={17.5} r={1.5} />
      <Circle cx={16.5} cy={17.5} r={1.5} />
    </>
  ),
  hands: () => (
    <Path d="M12 20s-7-4.2-7-9a3.6 3.6 0 0 1 7-1.2A3.6 3.6 0 0 1 19 11c0 4.8-7 9-7 9ZM9 12.5h6M12 9.5v6" />
  ),
  bag: () => (
    <>
      <Rect x={5} y={8} width={14} height={12.5} rx={3} />
      <Path d="M9 8V6.5a3 3 0 0 1 6 0V8M9 13.5h6" />
    </>
  ),
  bed: () => (
    <>
      <Path d="M3.5 18.5v-11M3.5 14.5h17v4M20.5 14.5v-2a3 3 0 0 0-3-3h-7v5" />
      <Circle cx={7.2} cy={11.5} r={1.8} />
    </>
  ),
  settings: () => (
    <>
      <Path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
      <Circle cx={15} cy={7} r={2} />
      <Circle cx={9} cy={12} r={2} />
      <Circle cx={17} cy={17} r={2} />
    </>
  ),
  share: () => <Path d="M12 15V4M8 7.5 12 3.5l4 4M6.5 11H6a1.5 1.5 0 0 0-1.5 1.5V19A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-6.5A1.5 1.5 0 0 0 18 11h-.5" />,
  trophy: () => (
    <>
      <Path d="M8 4.5h8v5a4 4 0 0 1-8 0v-5ZM8 6.5H5a3 3 0 0 0 3 3.5M16 6.5h3a3 3 0 0 1-3 3.5M12 13.5v3.5M8.5 20h7M9.5 17h5" />
    </>
  ),
  list: () => <Path d="M9 7h11M9 12h11M9 17h11M4.5 7h.5M4.5 12h.5M4.5 17h.5" />,
  bolt: () => <Path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12l1-7Z" />,
  quote: () => <Path d="M5 17.5c0-4 1-7.5 5-9.5M5 13h4v4.5H5M14 17.5c0-4 1-7.5 5-9.5M14 13h4v4.5h-4" />,
  people: () => (
    <>
      <Circle cx={9} cy={8.5} r={3} />
      <Path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M15.5 5.8a3 3 0 0 1 0 5.4M17.5 14.3a5.5 5.5 0 0 1 3 5.2" />
    </>
  ),
  hourglass: () => <Path d="M6.5 3.5h11M6.5 20.5h11M8 3.5v2.8a4 4 0 0 0 1.6 3.2L12 12l2.4-2.5A4 4 0 0 0 16 6.3V3.5M8 20.5v-2.8a4 4 0 0 1 1.6-3.2L12 12l2.4 2.5a4 4 0 0 1 1.6 3.2v2.8" />,
  layers: () => <Path d="M12 4 3.5 8.5 12 13l8.5-4.5L12 4ZM3.5 12.5 12 17l8.5-4.5M3.5 16 12 20.5l8.5-4.5" />,
  image: () => (
    <>
      <Rect x={4} y={5} width={16} height={14} rx={3} />
      <Circle cx={9.5} cy={10} r={1.6} />
      <Path d="m5 17 4.5-4 3.5 3 2.5-2 3.5 3" />
    </>
  ),
  person: () => (
    <>
      <Circle cx={12} cy={8} r={3.5} />
      <Path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  music: () => (
    <>
      <Path d="M9.5 17.5V6l9-2v11.5" />
      <Circle cx={7.25} cy={17.5} r={2.25} />
      <Circle cx={16.25} cy={15.5} r={2.25} />
    </>
  ),
  speaker: () => (
    <>
      <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <Path d="M15.5 9a4.5 4.5 0 0 1 0 6" />
      <Path d="M18 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  speakerOff: () => (
    <>
      <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <Path d="M16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color = colors.text, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name](color)}
    </Svg>
  );
}
