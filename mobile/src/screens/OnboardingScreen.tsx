import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
const heroImage = require('../../assets/Frame-1898.png');
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

type QuestionType =
  | 'number-scale'
  | 'multiple-choice'
  | 'multiple-choice-long'
  | 'short-answer'
  | 'likert-group'
  | 'matrix-scale';

type Option = {
  id: string;
  label: string;
  description?: string;
};

type Statement = {
  id: string;
  label: string;
  helper?: string;
};

type OnboardingStep = {
  id: string;
  type: QuestionType;
  question: string;
  options?: Option[];
  scaleMax?: number;
  placeholder?: string;
  statements?: Statement[];
  scaleLabels?: string[];
};

const steps: OnboardingStep[] = [
  {
    id: 'role',
    type: 'multiple-choice',
    question: 'What is your role at this facility?',
    options: [
      { id: 'cna', label: 'CNA' },
      { id: 'lpn', label: 'LPN (Charge Nurse)' },
      { id: 'rn', label: 'RN (Charge Nurse)' },
      { id: 'supervisor', label: 'RN Supervisor' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    id: 'unit',
    type: 'short-answer',
    question: 'Which floor or unit do you primarily work on?',
    placeholder: 'Type your answer here',
  },
  {
    id: 'shift',
    type: 'multiple-choice',
    question: 'Which shift do you usually work?',
    options: [
      { id: 'day', label: 'Day' },
      { id: 'evening', label: 'Evening' },
      { id: 'overnight', label: 'Overnight' },
      { id: 'float', label: 'Float' },
      { id: 'weekend', label: 'Weekend only' },
    ],
  },
  {
    id: 'tenure',
    type: 'multiple-choice',
    question: 'How long have you worked here?',
    options: [
      { id: '<1m', label: '< 1 month' },
      { id: '1-3m', label: '1–3 months' },
      { id: '3-6m', label: '3–6 months' },
      { id: '6-12m', label: '6–12 months' },
      { id: '1-3y', label: '1–3 years' },
      { id: '3-5y', label: '3–5 years' },
      { id: '5-10y', label: '5–10 years' },
      { id: '10+y', label: '10+ years' },
    ],
  },
  {
    id: 'likelihood',
    type: 'number-scale',
    question: 'How likely are you to still be working here in 6 months?',
    scaleMax: 5,
    scaleLabels: ['Very Unlikely', 'Not likely', 'Neutral', 'Likely', 'Very Likely'],
  },
  {
    id: 'likelihood-confidence',
    type: 'number-scale',
    question: 'How confident are you in that answer?',
    scaleMax: 5,
    scaleLabels: ['Very low', 'Low', 'Neutral', 'High', 'Very high'],
  },
  {
    id: 'retention-likert',
    type: 'likert-group',
    question: 'Let us know how much you agree with the following.',
    statements: [
      { id: 'stress', label: 'Stress from work often creeps into my personal life.' },
      { id: 'talk', label: 'People here are comfortable talking about problems.' },
      { id: 'help', label: 'Help is available when I have a problem.' },
      { id: 'belonging', label: 'I have a strong sense of belonging here.' },
      { id: 'engaged', label: 'I am highly engaged in this job.' },
      { id: 'stay', label: 'I want to stay with this organization for as long as possible.' },
    ],
    scaleMax: 5,
  },
  {
    id: 'attrition-drivers',
    type: 'matrix-scale',
    question: 'If you were to leave, how much would each factor contribute?',
    statements: [
      { id: 'conditions', label: 'Workplace conditions' },
      { id: 'financial', label: 'Financial & structural concerns' },
      { id: 'emotional', label: 'Emotional & psychological reasons' },
      { id: 'culture', label: 'Relational & cultural issues' },
      { id: 'growth', label: 'Career & growth limitations' },
      { id: 'logistics', label: 'Logistical & lifestyle factors' },
      { id: 'ethical', label: 'Ethical or moral conflict' },
    ],
    scaleMax: 5,
  },
  {
    id: 'attrition-primary',
    type: 'multiple-choice',
    question: 'If you had to choose one primary reason for leaving, what would it be?',
    options: [
      { id: 'conditions', label: 'Workplace conditions' },
      { id: 'financial', label: 'Financial & structural concerns' },
      { id: 'emotional', label: 'Emotional & psychological reasons' },
      { id: 'culture', label: 'Relational & cultural issues' },
      { id: 'growth', label: 'Career & growth limitations' },
      { id: 'logistics', label: 'Logistical & lifestyle factors' },
      { id: 'ethical', label: 'Ethical or moral conflict' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    id: 'retention-hooks',
    type: 'matrix-scale',
    question: 'What keeps you here? Rate each one.',
    statements: [
      { id: 'team-connection', label: 'I feel connected to my team.' },
      { id: 'schedule-fit', label: 'My schedule fits my life.' },
      { id: 'residents', label: 'I like the residents / patients.' },
      { id: 'manager-respect', label: 'I feel respected by my manager.' },
      { id: 'location', label: 'The location is convenient.' },
      { id: 'pay', label: 'The pay is good enough.' },
      { id: 'improving', label: 'I believe things are improving here.' },
    ],
    scaleMax: 5,
  },
  {
    id: 'retention-primary',
    type: 'multiple-choice',
    question: 'What is the #1 reason you’re still here?',
    options: [
      { id: 'team-connection', label: 'Connection to my team' },
      { id: 'schedule-fit', label: 'Schedule fits my life' },
      { id: 'residents', label: 'Residents / patients' },
      { id: 'manager-respect', label: 'Respect from my manager' },
      { id: 'location', label: 'Convenient location' },
      { id: 'pay', label: 'Pay & benefits' },
      { id: 'improving', label: 'Belief things are improving' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    id: 'environment',
    type: 'likert-group',
    question: 'How much do you agree with the following?',
    statements: [
      { id: 'team', label: 'I feel like part of a team on my shift.' },
      { id: 'manageable', label: 'My workload is manageable.' },
      { id: 'organized', label: 'My shift feels organized and well run.' },
      { id: 'respected', label: 'I feel respected at work.' },
      { id: 'clear', label: 'I know what is expected of me.' },
    ],
    scaleMax: 5,
  },
  {
    id: 'ideal-traits',
    type: 'matrix-scale',
    question: 'How helpful are these traits in coworkers on your floor?',
    statements: [
      { id: 'reliable', label: 'Reliable and consistent' },
      { id: 'calm', label: 'Calm under pressure' },
      { id: 'fast', label: 'Fast and efficient' },
      { id: 'friendly', label: 'Friendly and social' },
      { id: 'steady', label: 'Emotionally steady' },
      { id: 'self-sufficient', label: 'Self-sufficient' },
      { id: 'detail', label: 'Detail-oriented' },
      { id: 'empathetic', label: 'Empathetic & emotionally aware' },
    ],
    scaleMax: 5,
  },
  {
    id: 'ideal-trait-top',
    type: 'multiple-choice',
    question: 'Which trait matters most in a new teammate?',
    options: [
      { id: 'reliable', label: 'Reliable and consistent' },
      { id: 'calm', label: 'Calm under pressure' },
      { id: 'fast', label: 'Fast and efficient' },
      { id: 'friendly', label: 'Friendly and social' },
      { id: 'steady', label: 'Emotionally steady' },
      { id: 'self-sufficient', label: 'Self-sufficient' },
      { id: 'detail', label: 'Detail-oriented' },
      { id: 'empathetic', label: 'Empathetic & emotionally aware' },
    ],
  },
  {
    id: 'grit-signals',
    type: 'matrix-scale',
    question: 'How true are these about you at work?',
    statements: [
      { id: 'on-time', label: 'I show up on time consistently.' },
      { id: 'calm-pressure', label: 'I stay calm under pressure.' },
      { id: 'help', label: 'I help coworkers without being asked.' },
      { id: 'finish', label: 'I finish what I start.' },
      { id: 'no-drama', label: 'I avoid drama and stay focused.' },
      { id: 'push-through', label: 'I push through hard shifts without giving up.' },
    ],
    scaleMax: 5,
  },
  {
    id: 'culture-statements',
    type: 'likert-group',
    question: 'How much do these statements describe your floor/unit?',
    statements: [
      { id: 'support', label: 'People support each other.' },
      { id: 'adapt', label: 'The team adapts well to change.' },
      { id: 'expectations', label: 'Expectations are clear.' },
      { id: 'fast-paced', label: 'Work is fast-paced and demanding.' },
      { id: 'listens', label: 'Management listens to feedback.' },
      { id: 'rules', label: 'Rules and routines are followed closely.' },
    ],
    scaleMax: 5,
  },
  {
    id: 'culture-vibe',
    type: 'likert-group',
    question: 'How much do these words fit your floor’s vibe?',
    statements: [
      { id: 'supportive', label: 'Supportive' },
      { id: 'chaotic', label: 'Chaotic' },
      { id: 'fast', label: 'Fast-paced' },
      { id: 'independent', label: 'Independent' },
      { id: 'structured', label: 'Structured' },
      { id: 'isolated', label: 'Isolated' },
      { id: 'friendly', label: 'Friendly' },
      { id: 'calm', label: 'Calm' },
      { id: 'high-stress', label: 'High-stress' },
      { id: 'team', label: 'Team oriented' },
    ],
    scaleMax: 5,
  },
  {
    id: 'culture-word',
    type: 'multiple-choice',
    question: 'Pick the one word that best describes your team culture.',
    options: [
      { id: 'supportive', label: 'Supportive' },
      { id: 'chaotic', label: 'Chaotic' },
      { id: 'fast', label: 'Fast-paced' },
      { id: 'independent', label: 'Independent' },
      { id: 'structured', label: 'Structured' },
      { id: 'isolated', label: 'Isolated' },
      { id: 'friendly', label: 'Friendly' },
      { id: 'calm', label: 'Calm' },
      { id: 'high-stress', label: 'High-stress' },
      { id: 'team', label: 'Team oriented' },
    ],
  },
  {
    id: 'scenario',
    type: 'multiple-choice-long',
    question:
      'You’re midway through assisting a resident when you’re called to help transfer another who is unstable. What do you do first?',
    options: [
      {
        id: 'ensure-safety',
        label: 'Ensure the current resident is safe before leaving',
        description: 'Manages heavy loads, stays calm under stress.',
      },
      {
        id: 'call-backup',
        label: 'Call for immediate backup while staying with the current resident',
        description: 'Team player, steps in to help before asked.',
      },
      {
        id: 'leave-now',
        label: 'Leave immediately to help with the unstable patient',
        description: 'Perseveres, adapts quickly.',
      },
    ],
  },
  {
    id: 'confidence-answers',
    type: 'number-scale',
    question: 'How confident are you in your answers today?',
    scaleMax: 5,
  },
  {
    id: 'nps',
    type: 'number-scale',
    question: 'Would you recommend working here to someone you trust?',
    scaleMax: 10,
  },
];

type AnswerMap = Record<string, string>;

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onSkip }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const scrollRef = useRef<ScrollView | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const currentStep = steps[currentIndex];

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentIndex]);

  const handleSelect = useCallback((stepId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  }, []);

  const handleMatrixSelect = useCallback((stepId: string, statementId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [`${stepId}:${statementId}`]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex === steps.length - 1) {
      onComplete();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, onComplete]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    setCurrentIndex(0);
    onSkip();
  }, [onSkip]);

  const isMatrixComplete = (step: OnboardingStep) => {
    if (!step.statements) {
      return true;
    }
    return step.statements.every((statement) => Boolean(answers[`${step.id}:${statement.id}`]));
  };

  const canProceed = useMemo(() => {
    if (currentStep.type === 'short-answer') {
      return (answers[currentStep.id] ?? '').trim().length > 0;
    }
    if (currentStep.type === 'likert-group' || currentStep.type === 'matrix-scale') {
      return isMatrixComplete(currentStep);
    }
    return Boolean(answers[currentStep.id]);
  }, [answers, currentStep]);

  const renderScaleButtons = (
    selected: string | undefined,
    max: number,
    onPress: (value: string) => void,
    compact?: boolean,
    labels?: string[]
  ) => (
    <View style={styles.scaleRow}>
      {Array.from({ length: max }, (_, index) => {
        const value = (index + 1).toString();
        const isActive = selected === value;
        const display = labels?.[index] ?? value;
        const hasLabels = Boolean(labels);
        return (
          <TouchableOpacity
            key={value}
            style={[
              compact ? styles.scaleButtonCompact : styles.scaleButton,
              hasLabels && styles.scaleButtonLabeled,
              isActive && styles.scaleButtonActive,
            ]}
            onPress={() => onPress(value)}
          >
            <Text
              style={[
                styles.scaleButtonText,
                hasLabels && styles.scaleButtonTextWrapped,
                isActive && styles.scaleButtonTextActive,
              ]}
            >
              {display}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderNumberScale = (step: OnboardingStep) => {
    const selected = answers[step.id];
    return renderScaleButtons(
      selected,
      step.scaleMax ?? 5,
      (value) => handleSelect(step.id, value),
      false,
      step.scaleLabels
    );
  };

  const renderSimpleChoices = (step: OnboardingStep) => {
    const selected = answers[step.id];
    return (
      <View>
        {step.options?.map((option, index) => {
          const isActive = selected === option.id;
          const isLast = index === (step.options?.length ?? 1) - 1;
          return (
            <View key={option.id} style={!isLast && styles.choiceSpacer}>
              <TouchableOpacity
                style={[styles.choiceButton, isActive && styles.choiceButtonActive]}
                onPress={() => handleSelect(step.id, option.id)}
              >
                <Text style={[styles.choiceButtonText, isActive && styles.choiceButtonTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        {selected === 'other' && (
          <TextInput
            style={[styles.shortAnswerInput, { marginTop: 12 }]}
            placeholder="Type your answer"
            placeholderTextColor="#9AA2B4"
            value={answers['role-other'] ?? ''}
            onChangeText={(value) => handleSelect('role-other', value)}
          />
        )}
      </View>
    );
  };

  const renderLongChoices = (step: OnboardingStep) => {
    const selected = answers[step.id];
    return (
      <View>
        {step.options?.map((option, index) => {
          const isActive = selected === option.id;
          const isLast = index === (step.options?.length ?? 1) - 1;
          return (
            <View key={option.id} style={!isLast && styles.choiceSpacer}>
              <TouchableOpacity
                style={[styles.longChoiceButton, isActive && styles.choiceButtonActive]}
                onPress={() => handleSelect(step.id, option.id)}
              >
                <Text style={[styles.choiceButtonText, isActive && styles.choiceButtonTextActive]}>{option.label}</Text>
                {option.description && <Text style={styles.choiceDescription}>{option.description}</Text>}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  const renderShortAnswer = (step: OnboardingStep) => {
    return (
      <TextInput
        style={[styles.shortAnswerInput, { height: 64 }]}
        placeholder={step.placeholder ?? 'Type your answer'}
        placeholderTextColor="#9AA2B4"
        value={answers[step.id] ?? ''}
        onChangeText={(value) => handleSelect(step.id, value)}
        multiline
      />
    );
  };

  const renderStatements = (step: OnboardingStep) => {
    return (
      <View>
        {step.statements?.map((statement, index) => {
          const selected = answers[`${step.id}:${statement.id}`];
          const isLast = index === (step.statements?.length ?? 1) - 1;
          return (
            <View key={statement.id} style={[styles.statementBlock, !isLast && styles.statementSpacer]}>
              <Text style={styles.statementLabel}>{statement.label}</Text>
              {statement.helper && <Text style={styles.statementHelper}>{statement.helper}</Text>}
              {renderScaleButtons(selected, step.scaleMax ?? 5, (value) =>
                handleMatrixSelect(step.id, statement.id, value),
                true
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderQuestionContent = () => {
    switch (currentStep.type) {
      case 'number-scale':
        return renderNumberScale(currentStep);
      case 'multiple-choice':
        return renderSimpleChoices(currentStep);
      case 'multiple-choice-long':
        return renderLongChoices(currentStep);
      case 'short-answer':
        return renderShortAnswer(currentStep);
      case 'likert-group':
      case 'matrix-scale':
        return renderStatements(currentStep);
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <EllipseGlow width={500} height={620} gradientId="pipGlowTop" style={styles.topEllipse} />
        <EllipseGlow width={300} height={320} gradientId="pipGlowBottom" style={styles.bottomEllipse} />
      </View>
      <View style={styles.contentLayer}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroSection}>
              <View style={styles.logoRow}>
                <Image source={pipelineLogoP} style={styles.logoP} resizeMode="contain" />
                <Image source={pipelineWordmark} style={styles.logoWordmark} resizeMode="contain" />
              </View>
              <View style={styles.heroImageWrapper}>
                <Image source={heroImage} style={styles.heroImage} resizeMode="contain" />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.progressRow}>
                {steps.map((step, index) => (
                  <View
                    key={step.id}
                    style={[styles.progressBar, { opacity: index <= currentIndex ? 1 : 0.25 }]}
                  />
                ))}
                <TouchableOpacity onPress={handleSkip} style={styles.closeIcon}>
                  <Ionicons name="close" size={18} color="#0B1F41" />
                </TouchableOpacity>
              </View>
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.questionContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.questionText}>{currentStep.question}</Text>
                {renderQuestionContent()}
              </ScrollView>
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  onPress={handlePrevious}
                  disabled={currentIndex === 0}
                  style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
                >
                  <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, !canProceed && styles.primaryButtonDisabled]}
                  onPress={handleNext}
                  disabled={!canProceed}
                >
                  <Text style={styles.primaryButtonText}>{currentIndex === steps.length - 1 ? 'Finish' : 'Next'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  flex: {
    flex: 1,
  },
  topEllipse: {
    position: 'absolute',
    top: -150,
    left: -180,
    opacity: 0.5,
    width: 600,
    height: 420,
    borderRadius: 260,
  },
  bottomEllipse: {
    position: 'absolute',
    bottom: 50,
    right: -150,
    opacity: 0.5,
    width: 320,
    height: 320,
    borderRadius: 260,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 44,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 0,
    minHeight: 320,
    justifyContent: 'flex-end',
    width: '100%',
    overflow: 'visible',
  },
  logoRow: {
    position: 'absolute',
    top: 8,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
  },
  logoP: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  logoWordmark: {
    width: 110,
    height: 32,
  },
  heroImageWrapper: {
    width: 260,
    height: 280,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -28,
    marginTop: 20,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0B1F41',
    flex: 1,
    marginRight: 6,
  },
  closeIcon: {
    marginLeft: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F7',
  },
  questionContent: {
    paddingBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B1F41',
    marginBottom: 18,
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scaleButton: {
    minWidth: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7DBE6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    marginBottom: 12,
  },
  scaleButtonCompact: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7DBE6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  scaleButtonActive: {
    backgroundColor: '#0B1F41',
  },
  scaleButtonLabeled: {
    minWidth: 68,
    paddingHorizontal: 10,
    height: 48,
  },
  scaleButtonText: {
    fontSize: 16,
    color: '#4D5360',
  },
  scaleButtonTextWrapped: {
    fontSize: 14,
    textAlign: 'center',
  },
  scaleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  choiceSpacer: {
    marginBottom: 12,
  },
  choiceButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#D7DBE6',
    backgroundColor: '#FFFFFF',
  },
  longChoiceButton: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#D7DBE6',
    backgroundColor: '#FFFFFF',
  },
  choiceButtonActive: {
    backgroundColor: '#0B1F41',
    borderColor: '#0B1F41',
  },
  choiceButtonText: {
    fontSize: 16,
    color: '#0B1F41',
  },
  choiceButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  choiceDescription: {
    marginTop: 6,
    color: '#4D5360',
    fontSize: 13,
  },
  shortAnswerInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7DBE6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0B1F41',
    backgroundColor: '#F9FAFC',
  },
  statementBlock: {
    marginBottom: 18,
  },
  statementSpacer: {
    marginBottom: 10,
  },
  statementLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0B1F41',
    marginBottom: 10,
  },
  statementHelper: {
    fontSize: 13,
    color: '#6A738C',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 16,
    color: '#0B1F41',
  },
  navButtonTextDisabled: {
    color: '#8A91A7',
  },
  primaryButton: {
    backgroundColor: '#0B1F41',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: '#A8B0C8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
