import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';

type AvatarProps = {
  firstName: string;
  lastName?: string;
  uri?: string | null;
  size?: number;
};

/**
 * Displays the user's photo when available and falls back to their initials.
 * The orange ring is part of the default visual language and can be changed
 * with the Brand palette.
 */
export function Avatar({ firstName, lastName, uri, size = 44 }: AvatarProps) {
  const { t } = useI18n();
  const initials = `${firstName.charAt(0)}${lastName?.charAt(0) ?? ''}`.toUpperCase();
  const outerSize = size + 8;
  const displayName = [firstName, lastName].filter(Boolean).join(' ');

  return (
    <View
      style={[
        styles.ring,
        { width: outerSize, height: outerSize, borderRadius: outerSize / 2 },
      ]}>
      {uri ? (
        <Image
          source={uri}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={150}
          accessibilityLabel={t('profile.photo', { name: displayName })}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}>
          <Text
            style={[styles.initials, { fontSize: Math.round(size * 0.34) }]}
            allowFontScaling={false}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    borderColor: Brand.accent,
    padding: 2,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: Brand.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Brand.accentInk,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
