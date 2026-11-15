import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';

type ResetConfirmModalProps = {
  visible: boolean;
  resetting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ResetConfirmModal({
  visible,
  resetting,
  onConfirm,
  onClose,
}: ResetConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!resetting) {
          onClose();
        }
      }}>
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!resetting) {
              onClose();
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        />

        <View
          accessibilityViewIsModal
          style={[
            styles.confirmSheet,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}>
          <View style={styles.confirmIcon}>
            <AppIcon name={Icons.trash} size={24} color={Brand.danger} />
          </View>

          <Text style={styles.confirmTitle}>{t('profile.resetTitle')}</Text>
          <Text style={styles.confirmMessage}>{t('profile.resetMessage')}</Text>

          <Pressable
            onPress={() => {
              onConfirm();
            }}
            disabled={resetting}
            accessibilityRole="button"
            accessibilityLabel={t('profile.resetConfirm')}
            accessibilityState={{ disabled: resetting, busy: resetting }}
            style={({ pressed }) => [
              styles.confirmButton,
              resetting && styles.confirmButtonDisabled,
              pressed && !resetting && styles.confirmButtonPressed,
            ]}>
            {resetting ? (
              <ActivityIndicator color={Brand.surface} />
            ) : (
              <Text style={styles.confirmButtonText}>{t('profile.resetConfirm')}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => onClose()}
            disabled={resetting}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && !resetting && styles.cancelButtonPressed,
            ]}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </Pressable>
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
  confirmSheet: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'center',
    shadowColor: '#140E24',
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: -8 },
    elevation: 14,
  },
  confirmIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: Brand.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    color: Brand.ink,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 16,
    textAlign: 'center',
  },
  confirmMessage: {
    color: Brand.inkMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: Brand.danger,
    marginTop: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.68,
  },
  confirmButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  confirmButtonText: {
    color: Brand.surface,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  cancelButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 999,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: Brand.surfaceTint,
  },
  cancelButtonText: {
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
});
