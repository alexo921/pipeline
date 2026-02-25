import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';

const pipelineLogoP = require('../../assets/pipeline_logo_p.png');
const pipelineWordmark = require('../../assets/pipeline_logo.png');

const EllipseGlow: React.FC<{
  width: number;
  height: number;
  style?: any;
  gradientId: string;
}> = ({ width, height, style, gradientId }) => (
  <Svg width={width} height={height} style={style} viewBox={`0 0 ${width} ${height}`}>
    <Defs>
      <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor="rgba(149,169,255,0.32)" stopOpacity="0.9" />
        <Stop offset="35%" stopColor="rgba(149,169,255,0.24)" stopOpacity="0.7" />
        <Stop offset="60%" stopColor="rgba(149,169,255,0.10)" stopOpacity="0.45" />
        <Stop offset="80%" stopColor="rgba(149,169,255,0.12)" stopOpacity="0.25" />
        <Stop offset="100%" stopColor="rgba(149,169,255,0.10)" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width={width} height={height} fill={`url(#${gradientId})`} />
  </Svg>
);

interface IntroScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete, onSkip }) => {
  const { setUser } = useAuth();
  const [step, setStep] = useState<0 | 1>(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password]
  );

  const handleContinue = async () => {
    if (step === 0) {
      setStep(1);
      setError('');
      return;
    }
    if (!canSubmit) {
      setError('Please provide an email and a password.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      console.log('[Intro] attempting login', email.trim());
      const session = await login(email.trim(), password.trim());
      console.log('[Intro] login success', session.user?.id);
      await setUser(session.user, session.token);
      onComplete();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not sign in. Please try again.';
      setError(message);
      Alert.alert('Sign in failed', message);
      // eslint-disable-next-line no-console
      console.warn('Sign in failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await setUser(null, null);
    onSkip();
  };

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <LinearGradient colors={['#E8E9FF', '#F8F5FF', '#FFFFFF']} style={styles.background}>
          <View pointerEvents="none" style={styles.backgroundLayer}>
            <EllipseGlow width={500} height={620} gradientId="pipGlowTop" style={styles.topEllipse} />
            <EllipseGlow width={300} height={320} gradientId="pipGlowBottom" style={styles.bottomEllipse} />
          </View>
          <View style={styles.contentLayer}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              <View style={styles.logoRow}>
                <Image source={pipelineLogoP} style={styles.logoP} resizeMode="contain" />
                <Image source={pipelineWordmark} style={styles.logoWordmark} resizeMode="contain" />
              </View>

              <Text style={styles.welcome}>Welcome!</Text>

              <View style={styles.card}>
                {step === 0 ? (
                  <>
                    <Text style={styles.bodyText}>
                      This is Pip. <Text style={styles.bold}>Anonymous</Text> support for you to talk about whatever is
                      going on at work. <Text style={styles.bold}>Pip is not HR or management.</Text> Your facility’s
                      leadership never sees names, only anonymous trends so that they see how you all are doing, and what
                      needs to change.
                    </Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.cardTitle}>Sign In</Text>
                    <View style={styles.inputGroup}>
                      <TextInput
                        placeholder="Email"
                        placeholderTextColor="#9AA3B5"
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                      />
                      <TextInput
                        placeholder="Phone Number"
                        placeholderTextColor="#9AA3B5"
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                      <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9AA3B5"
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                      {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryButton, isSubmitting && { opacity: 0.6 }]}
                      onPress={handleContinue}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.primaryButtonText}>{isSubmitting ? 'Signing in...' : 'Continue'}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <TouchableOpacity onPress={handleSkip} style={styles.skip}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
    position: 'relative',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
  topEllipse: {
    position: 'absolute',
    top: -150,
    right: -180,
    opacity: 0.5,
    width: 600,
    height: 420,
    borderRadius: 260,
  },
  bottomEllipse: {
    position: 'absolute',
    bottom: 50,
    left: -150,
    opacity: 0.5,
    width: 320,
    height: 320,
    borderRadius: 260,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 200,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoRow: {
    position: 'absolute',
    top: 120,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  logoP: {
    width: 30,
    height: 30,
    marginRight: 6,
  },
  logoWordmark: {
    width: 96,
    height: 22,
  },
  welcome: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0B1F41',
    marginTop: 32,
    marginBottom: 22,
    fontFamily: Platform.select({ ios: 'Baloo2-SemiBold', android: 'sans-serif' }),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
    gap: 14,
  },
  bodyText: {
    fontSize: 15,
    color: '#1F2A44',
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  bold: {
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  primaryButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#0B1F41',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1F41',
  },
  inputGroup: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7DBE6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2A44',
    backgroundColor: '#F9FAFC',
  },
  errorText: {
    color: '#C6534C',
    fontSize: 13,
  },
  skip: {
    marginTop: 16,
  },
  skipText: {
    color: '#4A4F63',
    textDecorationLine: 'underline',
  },
});

export default IntroScreen;
