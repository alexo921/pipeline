import { useState, useCallback, useEffect } from 'react';
import { locationValidator, LocationValidationResult } from '../utils/locationValidator';

interface UseLocationValidationOptions {
  debounceMs?: number;
  autoValidate?: boolean;
}

interface UseLocationValidationReturn {
  city: string;
  state: string;
  setCity: (city: string) => void;
  setState: (state: string) => void;
  validationResult: LocationValidationResult | null;
  isValidating: boolean;
  validateLocation: () => Promise<LocationValidationResult | null>;
  suggestions: Array<{ city: string; state: string; distance: number }>;
  clearValidation: () => void;
}

export function useLocationValidation(
  initialCity: string = '',
  initialState: string = '',
  options: UseLocationValidationOptions = {}
): UseLocationValidationReturn {
  const { debounceMs = 500, autoValidate = true } = options;
  
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [validationResult, setValidationResult] = useState<LocationValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ city: string; state: string; distance: number }>>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const validateLocation = useCallback(async (): Promise<LocationValidationResult | null> => {
    if (!city.trim() || !state.trim()) {
      setValidationResult(null);
      setSuggestions([]);
      return null;
    }

    setIsValidating(true);
    try {
      const result = await locationValidator.validateLocation(city.trim(), state.trim());
      setValidationResult(result);
      setSuggestions(result.suggestions || []);
      return result;
    } catch (error) {
      console.error('Location validation error:', error);
      setValidationResult(null);
      setSuggestions([]);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [city, state]);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setSuggestions([]);
    setIsValidating(false);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  // Auto-validate when city or state changes
  useEffect(() => {
    if (!autoValidate) return;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      validateLocation();
    }, debounceMs);

    setDebounceTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [city, state, autoValidate, debounceMs, validateLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    city,
    state,
    setCity,
    setState,
    validationResult,
    isValidating,
    validateLocation,
    suggestions,
    clearValidation
  };
} 