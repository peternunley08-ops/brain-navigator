import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../core/theme';
import { EmberGlyph } from './ember/EmberSprite';
import { Button } from './ui/Button';

// When a screen crashes: Ember, one honest line, and a way back.
export function ErrorScreen({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={styles.root}>
      <EmberGlyph size={64} />
      <Text style={styles.title}>Something tipped over.</Text>
      <Text style={styles.body}>Nothing you did. Your notes and schoolwork are safe on your phone.</Text>
      <Text style={styles.detail} numberOfLines={3}>
        {error.message}
      </Text>
      <Button label="Try again" icon="repeat" onPress={() => retry()} style={styles.btn} />
      <Button label="Back to the Desk" variant="ghost" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    marginTop: 18,
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  detail: {
    marginTop: 14,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
  btn: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
});
