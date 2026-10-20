import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Gender, ProfileLocation } from '@/types/profile';

export type OnboardingForm = {
  name: string;
  age: string;
  phone: string;
  location: ProfileLocation | null;
  gender: Gender | null;
};

const INITIAL_FORM: OnboardingForm = {
  name: '',
  age: '',
  phone: '',
  location: null,
  gender: null,
};

type OnboardingContextValue = {
  form: OnboardingForm;
  updateForm: (patch: Partial<OnboardingForm>) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<OnboardingForm>(INITIAL_FORM);

  const updateForm = useCallback((patch: Partial<OnboardingForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({ form, updateForm }),
    [form, updateForm]
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used inside OnboardingProvider.');
  }

  return context;
}
