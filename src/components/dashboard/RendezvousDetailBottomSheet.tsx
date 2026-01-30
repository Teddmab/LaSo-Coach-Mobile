import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Avatar from '../Avatar';
import { getStatusMeta, formatDateLabel, formatTimeLabel, getDaysUntil, getMeetingProviderLabel } from '../../screens/agenda/utils/agendaUtils';

interface RendezvousDetailBottomSheetProps {
  visible: boolean;
  rendezvousData: any;
  onClose: () => void;
}

const RendezvousDetailBottomSheet: React.FC<RendezvousDetailBottomSheetProps> = ({
  visible,
  rendezvousData,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  // Ne pas retourner null si visible est true, même si rendezvousData est null
  // On affichera un message indiquant que les détails ne sont pas encore disponibles
  if (!visible) {
    return null;
  }

  const status = rendezvousData?.status || 'PENDING';
  const statusMeta = getStatusMeta(status as any);
  const rendezvousDate = rendezvousData?.scheduledAt ? new Date(rendezvousData.scheduledAt) : null;

  const handleOpenMeetingLink = async (link: string) => {
    try {
      const canOpen = await Linking.canOpenURL(link);
      if (canOpen) {
        await Linking.openURL(link);
      } else {
        console.warn('Cannot open URL:', link);
      }
    } catch (error) {
      console.error('Error opening meeting link:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.keyboardAvoidingView}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={styles.backdrop}
          />
        </TouchableOpacity>
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Détails du rendez-vous</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bgColor }]}>
              <Ionicons name={statusMeta.icon as any} size={16} color={statusMeta.badgeColor} />
              <Text style={[styles.statusBadgeText, { color: statusMeta.badgeColor }]}>
                {statusMeta.badge}
              </Text>
            </View>

            {/* Status Message */}
            <Text style={styles.statusMessage}>{statusMeta.message}</Text>

            {/* Coach Info - Highlighted when assigned */}
            {rendezvousData?.assignedCoach && (
              <View style={styles.coachHighlightCard}>
                <View style={styles.coachHighlightHeader}>
                  <Ionicons name="person-circle" size={24} color={theme.colors.primary} />
                  <Text style={styles.coachHighlightTitle}>Votre coach</Text>
                </View>
                <View style={styles.coachHighlightContent}>
                  <Avatar
                    source={rendezvousData.assignedCoach.avatar ? { uri: rendezvousData.assignedCoach.avatar } : undefined}
                    size={64}
                    fallbackText={rendezvousData.assignedCoach.name?.charAt(0)}
                  />
                  <View style={styles.coachHighlightInfo}>
                    <Text style={styles.coachHighlightName}>{rendezvousData.assignedCoach.name}</Text>
                    {rendezvousData.assignedCoach.email && (
                      <View style={styles.coachHighlightEmailRow}>
                        <Ionicons name="mail-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.coachHighlightEmail}>{rendezvousData.assignedCoach.email}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Details */}
            <View style={styles.detailsSection}>
              {rendezvousData?.subject && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sujet</Text>
                  <Text style={styles.detailValue}>{rendezvousData.subject}</Text>
                </View>
              )}

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
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Durée</Text>
                      <Text style={styles.detailValue}>{rendezvousData.duration || 60} minutes</Text>
                    </View>
                    <View style={styles.countdownBox}>
                      <Ionicons name="time-outline" size={20} color={theme.colors.success} />
                      <Text style={styles.countdownText}>
                        {getDaysUntil(rendezvousDate)} jours restants
                      </Text>
                    </View>
                  </>
                )}

              {rendezvousData?.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesValue}>{rendezvousData.notes}</Text>
                </View>
              )}

              {!rendezvousData && (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="time-outline" size={48} color={theme.colors.text.secondary} />
                  <Text style={styles.emptyStateTitle}>Rendez-vous en attente</Text>
                  <Text style={styles.emptyStateText}>
                    Votre demande de rendez-vous a été envoyée. Les détails seront disponibles une fois qu'un coach vous sera assigné.
                  </Text>
                </View>
              )}

              {rendezvousData?.meetingLink && (
                <View style={styles.meetingSection}>
                  <Text style={styles.meetingLabel}>Lien de réunion</Text>
                  <TouchableOpacity
                    style={styles.meetingLinkButton}
                    onPress={() => handleOpenMeetingLink(rendezvousData.meetingLink)}
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
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdropTouchable: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 16,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: 12,
    gap: 8,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
  },
  notesSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  notesValue: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  coachInfo: {
    marginLeft: 16,
    flex: 1,
  },
  coachLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  coachEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  meetingSection: {
    marginTop: 8,
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
    padding: 14,
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  coachHighlightCard: {
    marginTop: 8,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  coachHighlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  coachHighlightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  coachHighlightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  coachHighlightInfo: {
    flex: 1,
  },
  coachHighlightName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  coachHighlightEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachHighlightEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});

export default RendezvousDetailBottomSheet;

