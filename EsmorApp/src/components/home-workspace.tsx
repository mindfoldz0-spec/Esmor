import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import {
  ROLE_LABEL_KEYS,
  SHARED_WORKSPACE_FEATURES,
  getRoleWorkspaceFeatures,
  type SharedFeatureAction,
} from '@/constants/role-workspace';
import { Brand, FloatingTabBarSpace } from '@/constants/theme';
import { useI18n } from '@/i18n';
import type { UserRole } from '@/types/profile';

type HomeWorkspaceProps = {
  role: UserRole;
  onSharedFeaturePress: (action: SharedFeatureAction) => void;
};

/**
 * The home workspace is role-aware: the top section is generated from the
 * selected role, while the shared list is identical for every role. This is
 * the single place that decides what a farmer, kirana owner, or entrepreneur
 * can see on the home screen.
 */
export function HomeWorkspace({ role, onSharedFeaturePress }: HomeWorkspaceProps) {
  const router = useRouter();
  const { t, language } = useI18n();
  const features = getRoleWorkspaceFeatures(role);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{t('workspace.eyebrow')}</Text>
      <Text style={styles.title}>
        {t('workspace.title', { role: t(ROLE_LABEL_KEYS[role]) })}
      </Text>
      <Text style={styles.subtitle}>{t('workspace.subtitle')}</Text>

      {/* Featured Rural Freight Pooling Banner */}
      <Pressable
        style={styles.transportBanner}
        onPress={() => router.push('/(tabs)/explore')}
        accessibilityRole="button"
        accessibilityLabel="Open Rural Freight Transport Pooling">
        <View style={styles.transportBannerLeft}>
          <View style={styles.transportBadge}>
            <Text style={styles.transportBadgeText}>
              {language === 'mr' ? 'नवीन सुविधा' : language === 'hi' ? 'नई सुविधा' : 'New Feature'}
            </Text>
          </View>
          <Text style={styles.transportBannerTitle}>
            {language === 'mr'
              ? 'सामाईक मालवाहतूक (Freight Pooling)'
              : language === 'hi'
                ? 'साझा माल ढुलाई (Freight Pooling)'
                : 'Rural Freight Transport Pooling'}
          </Text>
          <Text style={styles.transportBannerDesc}>
            {language === 'mr'
              ? 'गावातून थेट बाजारपेठेत ५०% ते ७०% कमी खर्चात माल पाठवा.'
              : language === 'hi'
                ? 'गांव से मंडी तक ५०% से ७०% कम खर्च में माल भेजें।'
                : 'Pool empty vehicle space to local mandis & save 50-70% freight costs.'}
          </Text>
        </View>
        <View style={styles.transportBannerRight}>
          <Text style={styles.transportIcon}>🚚</Text>
        </View>
      </Pressable>

      <View style={styles.featureList}>
        {features.map((feature) => (
          <View
            key={feature.id}
            style={styles.featureCard}
            accessible
            accessibilityLabel={`${t(feature.titleKey)}. ${t(feature.descriptionKey)}`}>
            <View style={styles.iconBubble}>
              <AppIcon name={feature.icon} size={19} color={Brand.ink} />
            </View>

            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
              <Text style={styles.featureDescription}>{t(feature.descriptionKey)}</Text>
            </View>

            <View style={styles.soonPill}>
              <Text style={styles.soonText}>{t('workspace.soon')}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sharedTitle}>{t('workspace.sharedTitle')}</Text>
      <Text style={styles.sharedSubtitle}>{t('workspace.sharedSubtitle')}</Text>

      <View style={styles.sharedCard}>
        {SHARED_WORKSPACE_FEATURES.map((feature, index) => (
          <Pressable
            key={feature.id}
            onPress={() => onSharedFeaturePress(feature.action)}
            accessibilityRole="button"
            accessibilityLabel={t(feature.titleKey)}
            style={({ pressed }) => [
              styles.sharedRow,
              index > 0 && styles.sharedDivider,
              pressed && styles.sharedPressed,
            ]}>
            <View style={styles.sharedIcon}>
              <AppIcon name={feature.icon} size={17} color={Brand.ink} />
            </View>

            <View style={styles.sharedBody}>
              <Text style={styles.sharedRowTitle}>{t(feature.titleKey)}</Text>
              <Text style={styles.sharedRowDescription}>
                {t(feature.descriptionKey)}
              </Text>
            </View>

            <AppIcon name={Icons.chevronRight} size={16} color={Brand.inkFaint} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: FloatingTabBarSpace,
  },
  eyebrow: {
    color: Brand.accentInk,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: Brand.ink,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 3,
  },
  subtitle: {
    color: Brand.inkMuted,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 5,
  },
  featureList: {
    marginTop: 16,
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Brand.surface,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    color: Brand.ink,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  featureDescription: {
    color: Brand.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  soonPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: Brand.accentSoft,
  },
  soonText: {
    color: Brand.accentInk,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
  },
  sharedTitle: {
    color: Brand.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 26,
  },
  sharedSubtitle: {
    color: Brand.inkMuted,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 3,
  },
  sharedCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: Brand.surface,
    paddingHorizontal: 14,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  sharedDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  sharedPressed: {
    opacity: 0.72,
  },
  sharedIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedBody: {
    flex: 1,
    gap: 1,
  },
  sharedRowTitle: {
    color: Brand.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  sharedRowDescription: {
    color: Brand.inkMuted,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  transportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surface,
    borderRadius: 20,
    padding: 18,
    marginTop: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Brand.accent,
    shadowColor: Brand.accent,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  transportBannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  transportBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  transportBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Brand.accentInk,
    textTransform: 'uppercase',
  },
  transportBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Brand.ink,
    marginBottom: 4,
  },
  transportBannerDesc: {
    fontSize: 12,
    color: Brand.inkMuted,
    lineHeight: 17,
  },
  transportBannerRight: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportIcon: {
    fontSize: 24,
  },
});
