import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { MOBILE_MONEY_PROVIDERS, FlatMobileMoneyProvider } from '../config/mobileMoneyConfig';

interface MobileMoneyPaymentFormProps {
  amount: number;
  currency: string;
  onSubmit: (data: MobileMoneyPaymentData) => Promise<void>;
  isLoading?: boolean;
}

export interface MobileMoneyPaymentData {
  phoneNumber: string;
  provider: string;
  amount: number;
  currency: string;
}

const MobileMoneyPaymentForm: React.FC<MobileMoneyPaymentFormProps> = ({
  amount,
  currency,
  onSubmit,
  isLoading = false,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validate phone number based on provider
  const validatePhoneNumber = useCallback((phone: string, provider: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');

    // Provider-specific validation
    switch (provider) {
      case 'Airtel':
        // Airtel: 10-13 digits
        return cleaned.length >= 10 && cleaned.length <= 13;
      case 'Vodacom':
        // Vodacom M-Pesa: 10-12 digits
        return cleaned.length >= 10 && cleaned.length <= 12;
      case 'Orange':
        // Orange Money: 9-13 digits
        return cleaned.length >= 9 && cleaned.length <= 13;
      case 'Safaricom':
        // Safaricom: 10-12 digits
        return cleaned.length >= 10 && cleaned.length <= 12;
      default:
        return cleaned.length >= 10;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const newErrors: { [key: string]: string } = {};

    // Validate phone number
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(phoneNumber, selectedProvider || '')) {
      newErrors.phoneNumber = `Invalid phone number for ${selectedProvider}`;
    }

    // Validate provider
    if (!selectedProvider) {
      newErrors.provider = 'Please select a payment provider';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      await onSubmit({
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        provider: selectedProvider!,
        amount,
        currency,
      });
    } catch (error) {
      Alert.alert('Payment Error', 'Failed to process payment. Please try again.');
    }
  }, [phoneNumber, selectedProvider, validatePhoneNumber, amount, currency, onSubmit]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Mobile Money Payment</Text>

      {/* Amount Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount to Pay</Text>
        <Text style={styles.amountValue}>
          {currency} {amount.toFixed(2)}
        </Text>
      </View>

      {/* Provider Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Select Payment Provider</Text>
        <View style={styles.providerGrid}>
          {MOBILE_MONEY_PROVIDERS.map((provider: FlatMobileMoneyProvider) => (
            <TouchableOpacity
              key={provider.id}
              style={[
                styles.providerButton,
                selectedProvider === provider.name && styles.providerButtonActive,
              ]}
              onPress={() => {
                setSelectedProvider(provider.name);
                setErrors({ ...errors, provider: '' });
              }}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.providerButtonText,
                  selectedProvider === provider.name && styles.providerButtonTextActive,
                ]}
              >
                {provider.name}
              </Text>
              <Text style={styles.providerCountries}>{provider.countryCode}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.provider && <Text style={styles.errorText}>{errors.provider}</Text>}
      </View>

      {/* Phone Number Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Mobile Number</Text>
        <Text style={styles.hint}>
          Enter your {selectedProvider || 'mobile money'} phone number
        </Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="e.g., +256 700 123 456 or 256700123456"
          placeholderTextColor="#999"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            if (errors.phoneNumber) {
              setErrors({ ...errors, phoneNumber: '' });
            }
          }}
          keyboardType="phone-pad"
          editable={!isLoading && selectedProvider !== null}
          maxLength={20}
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>

      {/* Terms & Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 You will receive a prompt on your mobile device to confirm this payment.
        </Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Pay {currency} {amount.toFixed(2)}</Text>
        )}
      </TouchableOpacity>

      {/* Notice */}
      <Text style={styles.notice}>
        Your payment information is securely processed. We support Airtel Money, Vodacom M-Pesa,
        Orange Money, and Safaricom M-Pesa across East and West Africa.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  amountContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  providerButton: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  providerButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  providerButtonTextActive: {
    color: '#007AFF',
  },
  providerCountries: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  notice: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default MobileMoneyPaymentForm;
