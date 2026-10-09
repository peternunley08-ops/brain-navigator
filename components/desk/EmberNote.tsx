import { useState, type ComponentType } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { sprung } from '../../core/motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nextBadge } from '../../core/achievements';
import { dateKey } from '../../core/dates';
import { closedToday, firstWeekNotes, moreLine, pickNotes, type DeskNoteId } from '../../core/deskNotes';
import { dueFollowUp } from '../../core/emberAI';
import { useHubStore } from '../../core/hubStore';
import { learnedNotes } from '../../core/learned';
import { useLifeStore } from '../../core/lifeStore';
import { useSchoolStore } from '../../core/schoolStore';
import { colors, fonts } from '../../core/theme';
import { useWellnessStore } from '../../core/wellnessStore';
import { IconButton } from '../ui/IconButton';
import { Pressy } from '../ui/Pressy';
import { AboutCards, whenAboutCards } from './AboutCards';
import {
  awayOnOpen,
  Birthday,
  FollowUp,
  HelperNudge,
  LeaveNoteSheet,
  NextBadge,
  OneKindThing,
  PickUp,
  PlanTest,
  Resurface,
  TagTool,
  TryThisWeek,
  useMarkSeen,
  WelcomeBack,
  whenBirthday,
  whenFollowUp,
  whenHelperNudge,
  whenNextBadge,
  whenOneKindThing,
  whenPickUp,
  whenPlanTest,
  whenResurface,
  whenTagTool,
  whenTryThisWeek,
  whenWelcomeBack,
  whenWorryTime,
  WorryTime,
} from './DayCards';
import { Crew, whenCrew } from './FirstWeek';
import { WhatsNew, whenWhatsNew } from './WhatsNew';

const NOTES: Record<DeskNoteId, ComponentType> = {
  Birthday,
  FollowUp,
  Crew,
  PickUp,
  HelperNudge,
  PlanTest,
  TagTool,
  WorryTime,
  WelcomeBack,
  TryThisWeek,
  OneKindThing,
  AboutCards,
  WhatsNew,
  Resurface,
  NextBadge,
};

// Cards the student can turn off in Settings → Your Desk, by section.
const NUDGES: DeskNoteId[] = ['TryThisWeek', 'OneKindThing', 'HelperNudge', 'PlanTest', 'TagTool', 'WorryTime', 'Resurface', 'NextBadge'];

/** Every day card that would show right now, asking each card's own when…() check. */
export function useDeskNoteIds(deskHidden: string[]): DeskNoteId[] {
  const assignments = useSchoolStore((s) => s.assignments);
  const tags = useSchoolStore((s) => s.stressTags[dateKey()]);
  const onboarded = useSchoolStore((s) => s.profile.onboarded);
  // Re-read the badge and follow-up when what they count changes.
  useSchoolStore((s) => s.focus);
  useLifeStore((s) => s.wins);
  useLifeStore((s) => s.achievements);
  useLifeStore((s) => s.emberMemory);
  const closed = useLifeStore((s) => s.settings.deskClosed);
  const birthday = useLifeStore((s) => s.settings.birthday);
  const draft = useLifeStore((s) => s.settings.checkinDraft);
  const lastNote = useLifeStore((s) => s.settings.lastNote);
  const aiOff = useLifeStore((s) => !!s.settings.aiOff);
  const kindWeek = useLifeStore((s) => s.settings.kindWeek);
  const whatsNewSeen = useLifeStore((s) => s.settings.whatsNewSeen);
  const reviews = useLifeStore((s) => s.reviews);
  const worries = useLifeStore((s) => s.worries);
  const people = useLifeStore((s) => s.people);
  const gratitude = useLifeStore((s) => s.gratitude);
  const about = useLifeStore((s) => s.about);
  const checkins = useWellnessStore((s) => s.checkins);
  const notes = useHubStore((s) => s.notes);
  const firstWeek = useLifeStore((s) => s.settings.firstWeek);
  useMarkSeen();

  const today = dateKey();
  const shut = (id: string) => closedToday(closed, id, today);
  const nudges = !deskHidden.includes('nudges');
  const ids: DeskNoteId[] = [];
  const add = (id: DeskNoteId, on: unknown) => {
    if (on && (nudges || !NUDGES.includes(id))) ids.push(id);
  };
  add('Birthday', whenBirthday(birthday, today, shut('Birthday')));
  add('FollowUp', whenFollowUp(dueFollowUp(), aiOff));
  add('Crew', whenCrew(firstWeek, today));
  add('PickUp', whenPickUp(draft, lastNote, checkins, notes, shut('PickUp')));
  add('HelperNudge', whenHelperNudge(assignments, shut('HelperNudge')));
  add('PlanTest', whenPlanTest(assignments, shut('PlanTest')));
  add('TagTool', whenTagTool(tags, closed, today));
  add('WorryTime', whenWorryTime(worries, shut('WorryTime')));
  add('WelcomeBack', whenWelcomeBack(awayOnOpen(), shut('WelcomeBack')));
  add('TryThisWeek', whenTryThisWeek(reviews, shut('TryThisWeek')));
  add('OneKindThing', whenOneKindThing(people, kindWeek, shut('OneKindThing')));
  add('AboutCards', !deskHidden.includes('question') && whenAboutCards(about, onboarded, today, () => learnedNotes().length, false, firstWeekNotes(firstWeek, today).holdIntro));
  add('WhatsNew', whenWhatsNew(whatsNewSeen));
  add('Resurface', whenResurface(gratitude, shut('Resurface')));
  add('NextBadge', whenNextBadge(nextBadge(), shut('NextBadge')));
  return ids;
}

// Ember's note: one day card at a time. Closing it (× or Skip) brings the
// next; "Ember has N more" opens the rest in a sheet, so nothing is lost.
export function EmberNote({ deskHidden }: { deskHidden: string[] }) {
  const { shown, rest } = pickNotes(useDeskNoteIds(deskHidden));
  const [open, setOpen] = useState(false);
  if (!shown) return null;
  const Note = NOTES[shown];
  return (
    <View>
      <Note key={shown} />
      {rest.length ? (
        <Pressy onPress={() => setOpen(true)} hitSlop={8} style={styles.more} accessibilityRole="button" accessibilityHint="Opens Ember’s other notes for today">
          <Text style={styles.link}>{moreLine(rest.length)}</Text>
        </Pressy>
      ) : null}
      <NotesSheet open={open && rest.length > 0} ids={rest} onClose={() => setOpen(false)} />
    </View>
  );
}

function NotesSheet({ open, ids, onClose }: { open: boolean; ids: DeskNoteId[]; onClose: () => void }) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={open} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.fill}>
        <Pressy style={styles.scrim} onPress={onClose} depth={1} haptic="none" accessibilityLabel="Close" />
        <KeyboardAvoidingView behavior="padding" style={styles.slot} pointerEvents="box-none">
          <Animated.View entering={reduced ? undefined : sprung(SlideInDown)} style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: height * 0.8 }]}>
            <View style={styles.head}>
              <Text style={styles.title} accessibilityRole="header">
                Ember’s notes
              </Text>
              <IconButton icon="close" label="Close" size={34} onPress={onClose} />
            </View>
            <LeaveNoteSheet.Provider value={onClose}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {ids.map((id) => {
                  const Note = NOTES[id];
                  return <Note key={id} />;
                })}
                <Text style={styles.end}>{moreLine(0)}</Text>
              </ScrollView>
            </LeaveNoteSheet.Provider>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  more: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 4,
  },
  link: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.flame,
  },
  fill: {
    flex: 1,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 4, 8, 0.6)',
  },
  slot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  end: {
    marginTop: 18,
    marginBottom: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
