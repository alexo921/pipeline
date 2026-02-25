import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = 'pipeline:onboarding-complete';

export const getOnboardingComplete = async (): Promise<boolean> => {
  try {
    const stored = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return stored === 'true';
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('Failed to read onboarding flag', error);
    }
    return false;
  }
};

export const setOnboardingComplete = async (value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, value ? 'true' : 'false');
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist onboarding flag', error);
    }
  }
};
