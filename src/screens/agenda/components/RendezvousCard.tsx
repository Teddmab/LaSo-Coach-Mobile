import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import Avatar from '../../../components/Avatar';
import { RendezvousData } from '../types';
import { getStatusMeta, formatDateLabel, formatTimeLabel, getDaysUntil, getMeetingProviderLabel } from '../utils/agendaUtils';
import { ShimmerCard } from '../../../components/Shimmer';

interface RendezvousCardProps {
  rendezvousData: RendezvousData | null;
  loading: boolean;
  showForm: boolean;
  onReschedule: () => void;
  onOpenMeetingLink: (link: string) => Promise<void>;
}

const RendezvousCard: React.FC<RendezvousCardProps> = ({
  rendezvousData,
  loading,
  showForm,
  onReschedule,
  onOpenMeetingLink,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <ShimmerCard />
      </View>
    );
  }

  if (showForm || !rendezvousData) {
    return null; // Form will be rendered separately
  }

  const status = rendezvousData.status || 'PENDING';
  const statusMeta = getStatusMeta(status as any);
  const rendezvousDate = rendezvousData.scheduledAt ? new Date(rendezvousData.scheduledAt) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rendez-vous</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusMeta.bgColor }]}>
          <Text style={[styles.statusBadgeText, { color: statusMeta.badgeColor }]}>
            {statusMeta.badge}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sujet</Text>
          <Text style={styles.detailValue}>{rendezvousData.subject}</Text>
        </View>

        {rendezvousDate && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDateLabel(rendezvousDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Heure</Text>
              <Text style={styles.detailValue}>{formatTimeLabel(rendezvousDate)}</Text>
            </View>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownText}>{getDaysUntil(rendezvousDate)}</Text>
            </View>
          </>
        )}

        {rendezvousData.assignedCoach && (
          <View style={styles.coachCard}>
            <Avatar
              source={rendezvousData.assignedCoach.avatar ? { uri: rendezvousData.assignedCoach.avatar } : undefined}
              size={48}
              fallbackText={rendezvousData.assignedCoach.name?.charAt(0)}
            />
            <View style={styles.coachInfo}>
              <Text style={styles.coachName}>{rendezvousData.assignedCoach.name}</Text>
              <Text style={styles.coachEmail}>{rendezvousData.assignedCoach.email}</Text>
            </View>
          </View>
        )}

        {rendezvousData.meetingLink && (
          <View style={styles.meetingSection}>
            <Text style={styles.meetingLabel}>Lien de réunion</Text>
            <TouchableOpacity
              style={styles.meetingLinkButton}
              onPress={() => onOpenMeetingLink(rendezvousData.meetingLink!)}
            >
              <Text style={styles.meetingLinkText} numberOfLines={1}>
                {rendezvousData.meetingLink}
              </Text>
              <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            {rendezvousData.meetingProvider && (
              <View style={styles.providerBadge}>
                <Text style={styles.providerBadgeText}>
                  {getMeetingProviderLabel(rendezvousData.meetingProvider)}
                </Text>
              </View>
            )}
          </View>
        )}

        {status !== 'CONFIRMED' && (
          <TouchableOpacity style={styles.rescheduleButton} onPress={onReschedule}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.rescheduleButtonText}>Modifier</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    // Content styles
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  countdownBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  coachInfo: {
    marginLeft: 12,
    flex: 1,
  },
  coachName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  coachEmail: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  meetingSection: {
    marginTop: 16,
  },
  meetingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  meetingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: 12,
  },
  meetingLinkText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.primary,
    marginRight: 8,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  providerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2196F3',
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
  },
  rescheduleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default RendezvousCard;

