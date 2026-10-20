import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Avatar } from '@/components/avatar';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { formatTodayDate } from '@/lib/date';
import { splitProfileName } from '@/lib/profile';

type HomeHeaderProps = {
  name: string;
  avatarUrl?: string | null;
  onAvatarPress: () => void;
  onSearchPress: () => void;
  /** Defaults to the current date in the selected language. */
  dateLabel?: string;
};

/**
 * Home header with the profile avatar, greeting and date, plus the search
 * trigger. The search menu itself is owned by the screen so it can be wired to
 * any data source.
 */
export function HomeHeader({
  name,
  avatarUrl,
  onAvatarPress,
  onSearchPress,
  dateLabel,
}: HomeHeaderProps) {
  const { t, language } = useI18n();
  const { firstName, lastName } = splitProfileName(name);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel={t('home.openProfile')}
        hitSlop={6}
        style={({ pressed }) => pressed && styles.avatarPressed}>
        <Avatar
          firstName={firstName}
          lastName={lastName}
          uri={avatarUrl}
          size={44}
        />
      </Pressable>

      <View style={styles.greeting}>
        <Text style={styles.title} numberOfLines={1} allowFontScaling={false}>
          {t('home.greeting', { name: firstName })}
        </Text>
        <Text style={styles.date} numberOfLines={1} allowFontScaling={false}>
          {dateLabel ?? t('home.today', { date: formatTodayDate(language) })}
        </Text>
      </View>

      <Pressable
        onPress={onSearchPress}
        accessibilityRole="button"
        accessibilityLabel={t('home.openSearch')}
        hitSlop={6}
        style={({ pressed }) => [styles.searchButton, pressed && styles.searchPressed]}>
        <AppIcon name={Icons.search} size={21} color={Brand.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  greeting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Brand.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  date: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 1,
  },
  avatarPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  searchButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  searchPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.95 }],
  },
});
