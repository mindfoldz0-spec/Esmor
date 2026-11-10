import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/home-header';
import { HomeWorkspace } from '@/components/home-workspace';
import { SearchMenu } from '@/components/search-menu';
import type { SharedFeatureAction } from '@/constants/role-workspace';
import type { SearchItem } from '@/constants/search';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';

/**
 * Home screen shell.
 *
 * The header and floating tab bar are the reusable parts of the design. The
 * content below is the role-aware workspace, so a farmer, a kirana owner and
 * an entrepreneur each see their own tools plus the shared ones.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const { profile } = useAppData();
  const [searchOpen, setSearchOpen] = useState(false);

  // Real, in-app search entries: navigation targets plus the role's tool list.
  const searchItems = useMemo<SearchItem[]>(() => {
    if (!profile) {
      return [];
    }

    const moduleCategory = t('search.categoryModule');

    const entries: SearchItem[] = [
      {
        id: 'go:/(tabs)/explore',
        title: t('home.bannerTransportTitle'),
        subtitle: t('home.bannerTransportDesc'),
        category: moduleCategory,
      },
      {
        id: 'go:/(tabs)/activity',
        title: t('home.bannerMarketplaceTitle'),
        subtitle: t('home.bannerMarketplaceDesc'),
        category: moduleCategory,
      },
      {
        id: 'go:/orders',
        title: t('profile.ordersTitle'),
        subtitle: t('profile.ordersSubtitle'),
        category: moduleCategory,
      },
      {
        id: 'go:/notifications',
        title: t('profile.notifications'),
        subtitle: t('profile.notificationsSubtitle'),
        category: moduleCategory,
      },
      {
        id: 'go:/profile',
        title: t('profile.title'),
        subtitle: t('profile.settings'),
        category: moduleCategory,
      },
    ];

    return entries;
  }, [t, profile]);

  if (!profile) {
    return null;
  }

  const handleSelectSearchItem = (item: SearchItem) => {
    setSearchOpen(false);
    if (item.id.startsWith('go:')) {
      router.push(item.id.slice(3) as Href);
    }
  };

  const handleSharedFeature = (action: SharedFeatureAction) => {
    switch (action) {
      case 'search':
        setSearchOpen(true);
        return;
      case 'notifications':
        router.push('/notifications');
        return;
      case 'activity':
        router.push('/activity');
        return;
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <HomeHeader
          name={profile.name}
          onAvatarPress={() => router.push('/profile')}
          onSearchPress={() => setSearchOpen(true)}
        />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <HomeWorkspace
          role={profile.role}
          onSharedFeaturePress={handleSharedFeature}
        />
      </ScrollView>

      <SearchMenu
        key={language}
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={searchItems}
        onSelectItem={handleSelectSearchItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  safeArea: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
});
