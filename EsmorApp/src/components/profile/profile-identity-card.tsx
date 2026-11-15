import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Brand } from '@/constants/theme';

type ProfileIdentityCardProps = {
  name: string;
  firstName: string;
  lastName: string;
  /** Already translated "member since" line. */
  memberSince: string;
};

export function ProfileIdentityCard({
  name,
  firstName,
  lastName,
  memberSince,
}: ProfileIdentityCardProps) {
  return (
    <View style={styles.profileCard}>
      <Avatar firstName={firstName} lastName={lastName} size={84} />

      <Text style={styles.name}>{name}</Text>

      <View style={styles.memberPill}>
        <Text style={styles.memberText}>{memberSince}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: Brand.surface,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 26,
    alignItems: 'center',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  name: {
    color: Brand.ink,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 16,
    textAlign: 'center',
  },
  memberPill: {
    marginTop: 12,
    paddingHorizontal: 12,
    minHeight: 28,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberText: {
    color: Brand.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
