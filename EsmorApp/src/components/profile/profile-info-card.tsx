import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { Brand } from '@/constants/theme';

export type ProfileInfoRow = {
  label: string;
  value: string;
  icon: AppIconName;
};

type ProfileInfoCardProps = {
  rows: ProfileInfoRow[];
};

export function ProfileInfoCard({ rows }: ProfileInfoCardProps) {
  return (
    <View style={styles.infoCard}>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.infoRow, index > 0 && styles.infoDivider]}>
          <View style={styles.infoIcon}>
            <AppIcon name={row.icon} size={18} color={Brand.ink} />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: Brand.surface,
    borderRadius: 24,
    paddingVertical: 4,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    color: Brand.inkMuted,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoValue: {
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
});
