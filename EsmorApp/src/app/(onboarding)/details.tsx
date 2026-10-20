import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icons } from '@/components/app-icon';
import { OnboardingNote, OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { PrimaryButton } from '@/components/onboarding/primary-button';
import { TextField } from '@/components/onboarding/text-field';
import { useI18n } from '@/i18n';
import { useOnboarding } from '@/providers/onboarding-provider';

type FieldErrors = {
  name?: string;
  age?: string;
  phone?: string;
};

export default function DetailsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { form, updateForm } = useOnboarding();
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/language');
  };

  const handleChange = (patch: Partial<typeof form>, field: keyof FieldErrors) => {
    updateForm(patch);

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleContinue = () => {
    const nextErrors: FieldErrors = {};
    const name = form.name.trim().replace(/\s+/g, ' ');
    const age = Number(form.age);
    const phone = form.phone.trim();
    const digits = phone.replace(/\D/g, '');

    if (name.length < 2) {
      nextErrors.name = t('details.nameError');
    }

    if (!form.age.trim() || !Number.isInteger(age) || age < 13 || age > 100) {
      nextErrors.age = t('details.ageError');
    }

    if (!/^[+0-9\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
      nextErrors.phone = t('details.phoneError');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    updateForm({ name, age: String(age), phone });
    router.push('/location');
  };

  return (
    <OnboardingShell
      step={2}
      eyebrow={t('details.eyebrow')}
      title={t('details.title')}
      subtitle={t('details.subtitle')}
      onBack={handleBack}
      footer={<PrimaryButton label={t('common.continue')} onPress={handleContinue} />}>
      <View style={styles.fields}>
        <TextField
          label={t('details.nameLabel')}
          icon={Icons.person}
          value={form.name}
          onChangeText={(name) => handleChange({ name }, 'name')}
          placeholder={t('details.namePlaceholder')}
          error={errors.name}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          maxLength={80}
        />

        <TextField
          label={t('details.ageLabel')}
          icon={Icons.calendar}
          value={form.age}
          onChangeText={(age) => handleChange({ age }, 'age')}
          placeholder={t('details.agePlaceholder')}
          error={errors.age}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={3}
        />

        <TextField
          label={t('details.phoneLabel')}
          icon={Icons.phone}
          value={form.phone}
          onChangeText={(phone) => handleChange({ phone }, 'phone')}
          placeholder={t('details.phonePlaceholder')}
          error={errors.phone}
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={20}
        />
      </View>

      <OnboardingNote>{t('details.privateNote')}</OnboardingNote>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  fields: {
    marginTop: 26,
    gap: 17,
  },
});
