// Clean rewritten implementation (previous file had duplicated / malformed content)
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

// Step definitions & static points (web spec parity)
const STEP_DEFS = [
  { id: 1, key: 'profile_setup', label: 'Mon Profil', points: 100 },
  { id: 2, key: 'goals_setup', label: 'Mes Objectifs', points: 30 },
  { id: 3, key: 'recommendations', label: 'Recommandations', points: 20 },
  { id: 4, key: 'rendezvous', label: 'Rendez-vous', points: 25 },
];
const TOTAL_POINTS = 175; // 100 + 30 + 20 + 25

/**
 * ProfileCompletionCard
 * Props kept for backwards compatibility with DashboardScreen usage; some are unused.
 */
const ProfileCompletionCard = ({
  onboardingData,
  onStepPress,
  rendezvousStatus, // null | PENDING | ASSIGNED | CONFIRMED
  rendezvousScheduledAt,
  // unused but accepted to avoid prop warnings
  onCompleteProfile,
  subscriptionData,
  onSubscriptionRenew,
}) => {
  if (!onboardingData) return null;
  if (rendezvousStatus === 'CONFIRMED') return null; // Hidden entirely when confirmed

  const completedStepsRaw = onboardingData?.data?.completedSteps || [];
  const normalizedCompleted = completedStepsRaw.map(s => (s === 'appointment' ? 'rendezvous' : s));
  const currentStep = onboardingData?.data?.currentStep || 'profile_setup';

  const steps = useMemo(
    () =>
      STEP_DEFS.map(def => {
        const isRendezvous = def.key === 'rendezvous';
        const baseCompleted = normalizedCompleted.includes(def.key);
        let status = 'default';
        if (isRendezvous) {
          if (rendezvousStatus === 'PENDING') status = 'pending';
          else if (rendezvousStatus === 'ASSIGNED') status = 'assigned';
          else if (baseCompleted) status = 'completed';
        } else if (baseCompleted) status = 'completed';
        else if (currentStep === def.key) status = 'active';
        return { ...def, status };
      }),
    [normalizedCompleted, currentStep, rendezvousStatus]
  );

  const [selectedStepKey, setSelectedStepKey] = useState(null);
  const toggleSelect = stepKey =>
    setSelectedStepKey(prev => (prev === stepKey ? null : stepKey));

  const handleTilePress = step => {
    toggleSelect(step.key);
    if (onStepPress) onStepPress(step.id);
  };

  const rendezvousMessage = () => {
    if (rendezvousStatus === 'PENDING')
      return 'Votre rendez-vous est en attente. Un coach confirmera bientôt la date.';
    if (rendezvousStatus === 'ASSIGNED') {
      if (rendezvousScheduledAt) {
        try {
          const d = new Date(rendezvousScheduledAt);
          return `Un coach a été assigné pour le ${d.toLocaleDateString()}. Préparez vos questions.`;
        } catch {
          return 'Un coach a été assigné à votre rendez-vous. Préparez vos questions.';
        }
      }
      return 'Un coach a été assigné à votre rendez-vous. Préparez vos questions.';
    }
    return 'Planifiez votre rendez-vous pour débloquer 25 points supplémentaires.';
  };

  const baseMessage = 'Terminez les 4 étapes pour activer votre coaching personnalisé.';
  const helperText = (() => {
    const key = selectedStepKey;
    if (!key) return baseMessage;
    if (key === 'rendezvous') return rendezvousMessage();
    switch (key) {
      case 'profile_setup':
        return 'Complétez votre profil pour commencer votre parcours.';
      case 'goals_setup':
        return 'Définissez vos objectifs pour personnaliser votre coaching.';
      case 'recommendations':
        return 'Découvrez vos recommandations adaptées.';
      default:
        return baseMessage;
    }
  })();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="person-circle" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.title}>Complétez votre profil</Text>
      </View>
      <View style={styles.stepsRow}>
        {steps.map(step => {
          const isRendezvous = step.key === 'rendezvous';
            const tileStyles = [styles.stepTile];
            if (step.status === 'completed') tileStyles.push(styles.stepTileCompleted);
            else if (step.status === 'active') tileStyles.push(styles.stepTileActive);
            else if (step.status === 'pending') tileStyles.push(styles.stepTilePending);
            else if (step.status === 'assigned') tileStyles.push(styles.stepTileAssigned);

          let badgeContent = null;
          if (isRendezvous && (step.status === 'pending' || step.status === 'assigned')) {
            badgeContent = (
              <ActivityIndicator
                size="small"
                color={step.status === 'pending' ? '#C39200' : '#D46A00'}
              />
            );
          } else if (step.status === 'completed') {
            badgeContent = <Ionicons name="checkmark" size={18} color="#FFFFFF" />;
          } else if (step.status === 'active') {
            badgeContent = <Ionicons name="radio-button-on" size={18} color={theme.colors.primary} />;
          } else {
            badgeContent = (
              <Ionicons
                name="ellipse-outline"
                size={18}
                color={theme.colors.text.secondary}
              />
            );
          }

          return (
            <TouchableOpacity
              key={step.key}
              style={tileStyles}
              onPress={() => handleTilePress(step)}
              activeOpacity={0.75}
            >
              <View style={styles.badgeWrapper}>
                <View style={[styles.badge, step.status === 'completed' && styles.badgeCompleted]}>
                  {badgeContent}
                </View>
              </View>
              <Text style={styles.stepNumber}>{`ÉTAPE ${step.id}`}</Text>
              <Text
                style={[styles.stepLabel, step.status === 'completed' && styles.stepLabelCompleted]}
                numberOfLines={2}
              >
                {step.label}
              </Text>
              <View
                style={[
                  styles.pointsPill,
                  isRendezvous &&
                    (step.status === 'pending' || step.status === 'assigned') &&
                    styles.pointsPillWarn,
                ]}
              >
                <Text style={styles.pointsPillText}>+{step.points} pts</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.helperText}>{helperText}</Text>
      <View style={styles.incentiveWrapper}>
        <Text style={styles.incentivePill}>{TOTAL_POINTS} points offerts</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F2F4',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E7EA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    marginRight: 12,
    position: 'relative',
  },
  stepTileCompleted: { backgroundColor: 'rgba(76,175,80,0.12)', borderColor: theme.colors.success },
  stepTileActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(76,175,80,0.05)' },
  stepTilePending: { backgroundColor: 'rgba(255,193,7,0.15)', borderColor: '#FFC107' },
  stepTileAssigned: { backgroundColor: 'rgba(255,152,0,0.18)', borderColor: '#FF9800' },
  badgeWrapper: { position: 'absolute', top: -10, left: 12, zIndex: 2 },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6E9EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCompleted: { backgroundColor: theme.colors.success },
  stepNumber: { marginTop: 22, fontSize: 11, fontWeight: '600', color: '#1A1D21', letterSpacing: 0.5 },
  stepLabel: { marginTop: 4, fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, minHeight: 34 },
  stepLabelCompleted: { color: theme.colors.success },
  pointsPill: {
    marginTop: 8,
    backgroundColor: 'rgba(76,175,80,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pointsPillWarn: { backgroundColor: 'rgba(255,152,0,0.18)' },
  pointsPillText: { fontSize: 11, fontWeight: '600', color: theme.colors.success },
  helperText: { marginTop: 18, fontSize: 13, color: theme.colors.text.secondary },
  incentiveWrapper: { marginTop: 14 },
  incentivePill: {
    backgroundColor: 'rgba(205,230,150,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderRadius: 18,
    fontSize: 13,
    fontWeight: '600',
    color: '#2F4A00',
  },
});

export default ProfileCompletionCard;