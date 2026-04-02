import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressCardProps {
  initialWeight?: number | null;
  currentWeight: number | string;
  targetWeight?: number | null;
  initialWaistSize?: number | null;
  currentWaistSize: number | string;
  targetWaistSize?: number | null;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  initialWeight,
  currentWeight,
  targetWeight,
  initialWaistSize,
  currentWaistSize,
  targetWaistSize,
}) => {
  return (
    <View style={styles.card}>
      {/* Poids Section */}
      <View style={styles.section}>
        <Text style={styles.title}>Poids</Text>
        <View style={styles.row}>
          <View style={styles.item}>
            <Text style={styles.label}>Initial</Text>
            <Text style={styles.value}>{initialWeight ?? '-'}</Text>
            <Text style={styles.unit}>kg</Text>
          </View>
          
          <View style={styles.item}>
            <Text style={styles.label}>Actuel</Text>
            <Text style={[styles.value, currentWeight !== '-' && styles.currentWeightValue]}>
              {currentWeight}
            </Text>
            <Text style={[styles.unit, currentWeight !== '-' && styles.currentWeightUnit]}>
              kg
            </Text>
          </View>
          
          <View style={styles.item}>
            <Text style={styles.label}>Objectif</Text>
            <Text style={styles.value}>{targetWeight ?? '-'}</Text>
            <Text style={styles.unit}>kg</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Tour de taille Section */}
      <View style={styles.section}>
        <Text style={styles.title}>Tour de taille</Text>
        <View style={styles.row}>
          <View style={styles.item}>
            <Text style={styles.label}>Initial</Text>
            <Text style={styles.value}>{initialWaistSize ?? '-'}</Text>
            <Text style={styles.unit}>cm</Text>
          </View>
          
          <View style={styles.item}>
            <Text style={styles.label}>Actuel</Text>
            <Text style={[styles.value, currentWaistSize !== '-' && styles.currentWaistValue]}>
              {currentWaistSize}
            </Text>
            <Text style={[styles.unit, currentWaistSize !== '-' && styles.currentWaistUnit]}>
              cm
            </Text>
          </View>
          
          <View style={styles.item}>
            <Text style={styles.label}>Objectif</Text>
            <Text style={styles.value}>{targetWaistSize ?? '-'}</Text>
            <Text style={styles.unit}>cm</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  section: {
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  currentWeightValue: {
    color: '#10b981',
  },
  currentWaistValue: {
    color: '#60a5fa',
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  currentWeightUnit: {
    color: '#10b981',
  },
  currentWaistUnit: {
    color: '#60a5fa',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
});

export default ProgressCard;

