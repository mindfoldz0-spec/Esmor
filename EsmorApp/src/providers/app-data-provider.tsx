import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useI18n, type Language } from '@/i18n';
import {
  deleteProfile,
  getProfile,
  saveProfile,
  updateProfileLanguage,
} from '@/lib/profile-store';
import type { NewProfile, Profile } from '@/types/profile';

type AppDataContextValue = {
  ready: boolean;
  profile: Profile | null;
  completeOnboarding: (profile: NewProfile) => Promise<void>;
  resetProfile: () => Promise<void>;
  changeLanguage: (language: Language) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { setLanguage } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const savedProfile = await getProfile();

        if (cancelled) {
          return;
        }

        if (savedProfile) {
          setLanguage(savedProfile.language);
          setProfile(savedProfile);
        }
      } catch (error) {
        console.warn('Could not load the local profile.', error);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [setLanguage]);

  const completeOnboarding = useCallback(
    async (input: NewProfile) => {
      const savedProfile = await saveProfile(input);
      setLanguage(savedProfile.language);
      setProfile(savedProfile);
    },
    [setLanguage]
  );

  const resetProfile = useCallback(async () => {
    await deleteProfile();
    setProfile(null);
    setLanguage('en');
  }, [setLanguage]);

  const changeLanguage = useCallback(
    async (language: Language) => {
      if (!profile) {
        setLanguage(language);
        return;
      }

      const updatedProfile = await updateProfileLanguage(language);
      setLanguage(updatedProfile.language);
      setProfile(updatedProfile);
    },
    [profile, setLanguage]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      profile,
      completeOnboarding,
      resetProfile,
      changeLanguage,
    }),
    [ready, profile, completeOnboarding, resetProfile, changeLanguage]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider.');
  }

  return context;
}
