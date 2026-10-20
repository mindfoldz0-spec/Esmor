import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { Gender } from '@/types/profile';

const FEMALE_ICON = require('@/assets/images/female_icon.png');
const MALE_ICON = require('@/assets/images/male_icon.png');

type GenderIllustrationProps = {
  gender: Gender;
  size?: number;
};

/**
 * Portrait artwork for the gender selection cards using the official
 * illustrated character icons from resources.
 */
export function GenderIllustration({ gender, size = 148 }: GenderIllustrationProps) {
  const isFemale = gender === 'female';
  const source = isFemale ? FEMALE_ICON : MALE_ICON;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={source}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        transition={150}
        accessibilityLabel={isFemale ? 'Female' : 'Male'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
