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
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    height: 200,
    borderRadius: 12,
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
    backgroundColor: '#C8E6C9',
    padding: 16,
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
    fontWeight: 'bold',
    color: '#2D5016',
  },
});

export default ProgramSessionCard;

