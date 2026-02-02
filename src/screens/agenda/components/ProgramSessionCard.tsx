import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgramSession } from '../types';

interface ProgramSessionCardProps {
  session: ProgramSession;
  onDelete?: () => void;
}

const ProgramSessionCard: React.FC<ProgramSessionCardProps> = ({ session, onDelete }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{session.points}pts</Text>
        </View>
        {session.canDelete && onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
            <Text style={styles.deleteText}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {session.image ? (
          <Image source={{ uri: session.image }} style={styles.image} />
        ) : (
          <View style={styles.videoPlaceholder}>
            <View style={styles.playIcon}>
              <View style={styles.playButton} />
              <View style={styles.playButton} />
              <View style={styles.playButton} />
            </View>
          </View>
        )}
        
        <Text style={styles.programTitle}>LE PROGRAMME LASO'COACH ?</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.time}>
          <Ionicons name="time-outline" size={16} color="#4A5568" />
          <Text style={styles.timeText}>{session.time}</Text>
          <Ionicons name="calendar-outline" size={16} color="#4A5568" style={styles.calendarIcon} />
          <Text style={styles.dateText}>{session.day} {session.date}</Text>
        </View>
        <Text style={styles.title}>{session.title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  pointsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    position: 'relative',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  playIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  details: {
    backgroundColor: '#F0F9F4',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 4,
    marginRight: 16,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A5D2E',
    lineHeight: 24,
  },
});

export default ProgramSessionCard;

