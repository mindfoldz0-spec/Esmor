import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function BootScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.mark}>
        <Text style={styles.letter} allowFontScaling={false}>
          E
        </Text>
      </View>
      <Text style={styles.name} allowFontScaling={false}>
        Esmor
      </Text>
      <ActivityIndicator color={Brand.accentInk} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A4417',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },
  letter: {
    color: Brand.ink,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  name: {
    color: Brand.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  spinner: {
    marginTop: 22,
  },
});
