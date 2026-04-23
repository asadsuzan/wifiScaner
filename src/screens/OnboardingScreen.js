import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { markOnboardingSeen } from '../services/baselineStore';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '🛡️',
    title: 'WiFi Security Scanner',
    subtitle: 'EvilDetector',
    body: 'Protect yourself from Evil Twin attacks and rogue WiFi networks. This app scans your surroundings and identifies potential threats in real time.',
  },
  {
    icon: '👿',
    title: 'What is an Evil Twin?',
    subtitle: 'The Threat',
    body: 'An Evil Twin is a fake WiFi access point that mimics a legitimate one. Attackers use it to intercept your data — passwords, banking info, messages — without you knowing.',
  },
  {
    icon: '🔍',
    title: 'How Detection Works',
    subtitle: 'Smart Analysis',
    body: 'We analyse security protocols, hardware vendors, signal patterns, and channel usage. The app learns your trusted networks over time and alerts you only when something is genuinely suspicious.',
  },
  {
    icon: '📊',
    title: 'Risk Scoring',
    subtitle: '0 – 100 Scale',
    body: 'Every network gets a dynamic risk score:\n\n🟢 0–30: Safe\n🟡 31–60: Medium\n🔴 61–100: High Risk\n\nScores are based on multiple heuristics, not just a single check.',
  },
  {
    icon: '⚠️',
    title: 'Important Disclaimer',
    subtitle: 'Limitations',
    body: 'This app provides heuristic risk analysis, not guaranteed threat detection. No tool can detect every attack. Always use a VPN on public WiFi and avoid entering sensitive data on unknown networks.',
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await markOnboardingSeen();
    onComplete();
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.slideContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.icon}>{slide.icon}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentSlide && styles.dotActive]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsRow}>
        {!isLast && (
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  slideContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  icon: {
    fontSize: 72,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.85,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  dotActive: {
    backgroundColor: '#3b82f6',
    width: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
