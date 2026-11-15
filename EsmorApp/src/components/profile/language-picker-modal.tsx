import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { LANGUAGES, useI18n, type Language } from '@/i18n';

type LanguagePickerModalProps = {
  visible: boolean;
  onSelect: (language: Language) => void;
  onClose: () => void;
};

export function LanguagePickerModal({ visible, onSelect, onClose }: LanguagePickerModalProps) {
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}>
          <View style={styles.grabber} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>{t('profile.languageModalTitle')}</Text>
              <Text style={styles.sheetSubtitle}>{t('profile.languageSubtitle')}</Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closePressed,
              ]}>
              <AppIcon name={Icons.close} size={17} color={Brand.ink} />
            </Pressable>
          </View>

          <View style={styles.languageList} accessibilityRole="radiogroup">
            {LANGUAGES.map((option) => {
              const selected = option.code === language;

              return (
                <Pressable
                  key={option.code}
                  onPress={() => {
                    onSelect(option.code);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t('language.select', {
                    language: option.nativeName,
                  })}
                  style={({ pressed }) => [
                    styles.languageRow,
                    selected && styles.languageRowSelected,
                    pressed && styles.languageRowPressed,
                  ]}>
                  <View style={[styles.languageTile, selected && styles.languageTileSelected]}>
                    <Text style={styles.languageTileText} allowFontScaling={false}>
                      {option.tile}
                    </Text>
                  </View>

                  <Text style={styles.languageName}>{option.nativeName}</Text>

                  <View style={[styles.check, selected && styles.checkSelected]}>
                    {selected ? (
                      <AppIcon name={Icons.check} size={13} color={Brand.surface} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Brand.backdrop,
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#140E24',
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: -8 },
    elevation: 14,
  },
  grabber: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(22, 19, 31, 0.14)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 3,
  },
  sheetTitle: {
    color: Brand.ink,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    opacity: 0.7,
  },
  languageList: {
    gap: 10,
  },
  languageRow: {
    minHeight: 68,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Brand.divider,
    backgroundColor: Brand.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  languageRowSelected: {
    borderColor: Brand.ink,
    backgroundColor: '#FFFCFF',
  },
  languageRowPressed: {
    opacity: 0.86,
  },
  languageTile: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageTileSelected: {
    backgroundColor: Brand.accentSoft,
  },
  languageTileText: {
    color: Brand.ink,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  languageName: {
    flex: 1,
    color: Brand.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(22, 19, 31, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: Brand.ink,
    borderColor: Brand.ink,
  },
});
