import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { Brand } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  icon: AppIconName;
  error?: string | null;
};

export function TextField({
  label,
  icon,
  error,
  onFocus,
  onBlur,
  style,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}>
        <AppIcon
          name={icon}
          size={18}
          color={error ? Brand.danger : focused ? Brand.accentInk : Brand.inkMuted}
        />
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          placeholderTextColor={Brand.inkFaint}
          selectionColor={Brand.accent}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, style]}
        />
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: Brand.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 7,
    marginLeft: 2,
  },
  field: {
    height: 58,
    borderRadius: 18,
    backgroundColor: Brand.surface,
    borderWidth: 1.5,
    borderColor: Brand.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  fieldFocused: {
    borderColor: Brand.accent,
    backgroundColor: '#FFFCFF',
  },
  fieldError: {
    borderColor: Brand.danger,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Brand.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '500',
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'solid' as const, outlineWidth: 0 },
    }),
  },
  error: {
    color: Brand.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 2,
  },
});
