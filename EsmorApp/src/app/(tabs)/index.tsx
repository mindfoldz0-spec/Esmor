import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/home-header';
import { HomeWorkspace } from '@/components/home-workspace';
import { SearchMenu } from '@/components/search-menu';
import type { SharedFeatureAction } from '@/constants/role-workspace';
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
  const { language } = useI18n();
  const { profile } = useAppData();
  const [searchOpen, setSearchOpen] = useState(false);

  if (!profile) {
    return null;
  }

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
