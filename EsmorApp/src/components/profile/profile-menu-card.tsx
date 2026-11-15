import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, Icons, type AppIconName } from '@/components/app-icon';
import { Brand } from '@/constants/theme';

export type ProfileMenuItem = {
  id: string;
  label: string;
  subtitle: string;
  icon: AppIconName;
  onPress: () => void;
};

type ProfileMenuCardProps = {
  items: ProfileMenuItem[];
};

export function ProfileMenuCard({ items }: ProfileMenuCardProps) {
  return (
    <View style={styles.menuCard}>
      {items.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={`${item.label}, ${item.subtitle}`}
          style={({ pressed }) => [
            styles.menuRow,
            index > 0 && styles.menuDivider,
            pressed && styles.menuRowPressed,
          ]}>
          <View style={styles.menuIcon}>
            <AppIcon name={item.icon} size={19} color={Brand.ink} />
          </View>

          <View style={styles.menuBody}>
            <Text style={styles.menuTitle}>{item.label}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>

          <AppIcon name={Icons.chevronRight} size={16} color={Brand.inkFaint} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    backgroundColor: Brand.surface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  menuRowPressed: {
    backgroundColor: Brand.surfaceTint,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: Brand.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
});
