import React, { useState } from 'react';
import { useLocationValidation } from '../hooks/useLocationValidation';
import { MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface LocationInputProps {
  initialCity?: string;
  initialState?: string;
  onLocationChange?: (city: string, state: string, isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showSuggestions?: boolean;
}

export default function LocationInput({
  initialCity = '',
  initialState = '',
  onLocationChange,
  placeholder = 'Enter city and state...',
  className = '',
  disabled = false,
  required = false,
  showSuggestions = true
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(`${initialCity}${initialCity && initialState ? ', ' : ''}${initialState}`);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const {
    city,
    state,
    setCity,
    setState,
    validationResult,
    isValidating,
    suggestions,
    clearValidation
  } = useLocationValidation(initialCity, initialState, {
    debounceMs: 300,
    autoValidate: true
  });

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Parse city and state from input
    const parts = value.split(',').map(part => part.trim());
    const newCity = parts[0] || '';
    const newState = parts[1] || '';
    
    setCity(newCity);
    setState(newState);
    
    if (onLocationChange) {
      onLocationChange(newCity, newState, validationResult?.isValid || false);
    }
  };

  const handleSuggestionClick = (suggestion: { city: string; state: string; distance: number }) => {
    const newValue = `${suggestion.city}, ${suggestion.state}`;
    setInputValue(newValue);
    setCity(suggestion.city);
    setState(suggestion.state);
    setShowDropdown(false);
    
    if (onLocationChange) {
      onLocationChange(suggestion.city, suggestion.state, true);
    }
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    if (!validationResult) {
      return <MapPin className="w-4 h-4 text-gray-400" />;
    }
    
    if (validationResult.isValid) {
      return validationResult.isExactMatch ? 
        <CheckCircle className="w-4 h-4 text-green-500" /> :
        <CheckCircle className="w-4 h-4 text-yellow-500" />;
    }
    
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const getValidationMessage = () => {
    if (!validationResult) return null;
    
    if (validationResult.isValid) {
      if (validationResult.isExactMatch) {
        return <span className="text-green-600 text-sm">Valid location</span>;
      } else {
        return (
          <span className="text-yellow-600 text-sm">
            Did you mean {validationResult.validatedCity}, {validationResult.validatedState}?
          </span>
        );
      }
    } else {
      return <span className="text-red-600 text-sm">Invalid location</span>;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            // Delay hiding dropdown to allow for clicks
            setTimeout(() => setShowDropdown(false), 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${validationResult?.isValid ? 'border-green-300' : validationResult ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      
      {/* Validation message */}
      {validationResult && (
        <div className="mt-1">
          {getValidationMessage()}
        </div>
      )}
      
      {/* Suggestions dropdown */}
      {showSuggestions && showDropdown && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {suggestion.city}, {suggestion.state}
                </span>
                <span className="text-sm text-gray-500">
                  {suggestion.distance < 0.1 ? 'Exact match' : `${Math.round((1 - suggestion.distance) * 100)}% match`}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* No suggestions message */}
      {showSuggestions && showDropdown && validationResult && !validationResult.isValid && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="text-gray-500 text-sm">
            No matching cities found in {state}. Please check the spelling or try a different location.
          </div>
        </div>
      )}
    </div>
  );
} 