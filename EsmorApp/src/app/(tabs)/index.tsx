import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/home-header';
import { SearchMenu } from '@/components/search-menu';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';

/**
 * Home screen shell.
 *
 * The header and floating tab bar are the reusable parts of the design; the
 * middle area is intentionally empty so app-specific home content can be
 * dropped in without fighting preset cards.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { language } = useI18n();
  const { profile } = useAppData();
  const [searchOpen, setSearchOpen] = useState(false);

  if (!profile) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <HomeHeader
          name={profile.name}
          onAvatarPress={() => router.push('/profile')}
          onSearchPress={() => setSearchOpen(true)}
        />
      </SafeAreaView>

      <View style={styles.content} />

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
  content: {
    flex: 1,
  },
});
