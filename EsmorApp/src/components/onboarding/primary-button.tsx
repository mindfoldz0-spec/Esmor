import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: 'arrow' | 'check';
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon = 'arrow',
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={Brand.surface} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
        {!loading ? (
          <AppIcon
            name={icon === 'check' ? Icons.check : Icons.arrowRight}
            size={18}
            color={Brand.surface}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: 19,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#1B1630',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.91,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    backgroundColor: 'rgba(22, 19, 31, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    color: Brand.surface,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
