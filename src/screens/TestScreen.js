import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

export default function TestScreen() {
  const [buttonPresses, setButtonPresses] = useState(0);

  const handleTestPress = () => {
    setButtonPresses(prev => prev + 1);
    Alert.alert('Success!', `Button pressed ${buttonPresses + 1} times`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>LaSo Coach - Component Test</Text>
        <Text style={styles.subtitle}>Testing our design system components</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Button Variants</Text>
          
          <Button 
            title="Primary Button" 
            onPress={handleTestPress}
            variant="primary"
            size="large"
          />
          
          <Button 
            title="Secondary Button" 
            onPress={handleTestPress}
            variant="secondary"
            size="medium"
          />
          
          <Button 
            title="Outline Button" 
            onPress={handleTestPress}
            variant="outline"
            size="small"
          />
          
          <Button 
            title="Disabled Button" 
            onPress={handleTestPress}
            disabled={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.colorText}>Primary</Text>
          </View>
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.colorText}>Secondary</Text>
          </View>
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.colorText}>Accent</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typography</Text>
          <Text style={[styles.text, { fontSize: TYPOGRAPHY.sizes.xxxl }]}>Extra Large Text</Text>
          <Text style={[styles.text, { fontSize: TYPOGRAPHY.sizes.xl }]}>Large Text</Text>
          <Text style={[styles.text, { fontSize: TYPOGRAPHY.sizes.lg }]}>Medium Text</Text>
          <Text style={[styles.text, { fontSize: TYPOGRAPHY.sizes.md }]}>Regular Text</Text>
          <Text style={[styles.text, { fontSize: TYPOGRAPHY.sizes.sm }]}>Small Text</Text>
        </View>

        <Text style={styles.counter}>Button pressed: {buttonPresses} times</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  section: {
    width: '100%',
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.darkGray,
    marginBottom: SPACING.md,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  colorBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  colorText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.darkGray,
  },
  text: {
    color: COLORS.darkGray,
    marginVertical: SPACING.xs,
  },
  counter: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
}); 