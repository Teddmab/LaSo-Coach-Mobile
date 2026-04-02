import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { ProfileApi } from '../../services/profileApi';
import { getStatusMeta } from '../../screens/agenda/utils/agendaUtils';
import { RendezvousStatus } from '../../screens/agenda/types';

interface ProfileRendezvousSectionProps {
  onEdit?: () => void;
}

const ProfileRendezvousSection: React.FC<ProfileRendezvousSectionProps> = ({
  onEdit,
}) => {
  const [rendezvousData, setRendezvousData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRendezvousData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ProfileApi.getCurrentRendezvous();
      setRendezvousData(data);
    } catch (error) {
      console.log('📅 No rendezvous data available');
      setRendezvousData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRendezvousData();
  }, [fetchRendezvousData]);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRendezvousData();
    }, [fetchRendezvousData])
  );


  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemaining = (dateString: string) => {
    if (!dateString) return 0;
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status metadata based on actual rendezvous status
  const status = (rendezvousData?.status || 'PENDING') as RendezvousStatus;
  const statusMeta = getStatusMeta(status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.title}>Rendez-vous</Text>
        </View>
      </View>

      <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : rendezvousData ? (
            <>
              <View style={styles.rendezvousCard}>
                <View style={[styles.statusBadge, { backgroundColor: statusMeta.bgColor }]}>
                  <Ionicons name={statusMeta.icon as any} size={16} color={statusMeta.badgeColor} />
                  <Text style={[styles.statusText, { color: statusMeta.badgeColor }]}>
                    {statusMeta.badge.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                    <View style={styles.dateTimeText}>
                      <Text style={styles.dateTimeLabel}>Date</Text>
                      <Text style={styles.dateTimeValue}>
                        {formatDate(rendezvousData.scheduledAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dateTimeItem}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                    <View style={styles.dateTimeText}>
                      <Text style={styles.dateTimeLabel}>Heure</Text>
                      <Text style={styles.dateTimeValue}>
                        {formatTime(rendezvousData.scheduledAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {rendezvousData.subject && (
                  <View style={styles.subjectContainer}>
                    <Text style={styles.subjectLabel}>Sujet</Text>
                    <Text style={styles.subjectValue}>{rendezvousData.subject}</Text>
                  </View>
                )}

                {rendezvousData.assignedCoach && (
                  <View style={styles.coachContainer}>
                    <Text style={styles.coachLabel}>Coach assigné</Text>
                    <Text style={styles.coachValue}>
                      {rendezvousData.assignedCoach.name || 'Non assigné'}
                    </Text>
                  </View>
                )}

                {rendezvousData.meetingLink && (
                  <TouchableOpacity
                    style={styles.meetingLinkButton}
                    onPress={() => Linking.openURL(rendezvousData.meetingLink)}
                  >
                    <Ionicons name="videocam-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.meetingLinkText}>Rejoindre la réunion</Text>
                  </TouchableOpacity>
                )}

                {statusMeta.message && (
                  <View style={styles.statusMessageContainer}>
                    <Text style={styles.statusMessageText}>{statusMeta.message}</Text>
                  </View>
                )}

                <View style={styles.daysRemainingContainer}>
                  <Ionicons name="hourglass-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.daysRemainingText}>
                    {getDaysRemaining(rendezvousData.scheduledAt)} jours restants
                  </Text>
                </View>
              </View>

              {onEdit && status !== 'CONFIRMED' && (
                <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                  <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                  <Text style={styles.editButtonText}>Modifier le rendez-vous</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noRendezvousContainer}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.noRendezvousText}>Aucun rendez-vous programmé</Text>
              {onEdit && (
                <TouchableOpacity style={styles.createButton} onPress={onEdit}>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Créer un rendez-vous</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  rendezvousCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusMessageContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statusMessageText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  dateTimeContainer: {
    gap: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeText: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  subjectContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  subjectLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  subjectValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  coachContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  coachLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  coachValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  meetingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  meetingLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  daysRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  daysRemainingText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  noRendezvousContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  noRendezvousText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileRendezvousSection;

