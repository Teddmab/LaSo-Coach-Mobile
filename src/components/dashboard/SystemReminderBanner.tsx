import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import {
  fetchLatestSystemReminder,
  dismissReminderKind,
  ReminderPick,
  ReminderKind,
} from '../../services/reminderBannerService';
import {
  translateNotificationTitle,
  translateNotificationMessage,
} from '../../screens/notifications/utils/notificationUtils';

function iconForKind(kind: ReminderKind): keyof typeof Ionicons.glyphMap {
  return kind === 'hydration' ? 'water-outline' : 'moon-outline';
}

function labelForKind(kind: ReminderKind): string {
  return kind === 'hydration' ? 'Hydratation' : 'Sommeil';
}

const SystemReminderBanner: React.FC = () => {
  const [item, setItem] = useState<ReminderPick | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchLatestSystemReminder();
      setItem(next);
    } catch {
      setItem(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void refresh();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [refresh]);

  const onOk = async () => {
    if (!item) return;
    await dismissReminderKind(item.kind);
    setItem(null);
  };

  if (!item) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name={iconForKind(item.kind)} size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.eyebrow}>{labelForKind(item.kind)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {translateNotificationTitle(item.title)}
          </Text>
          {item.body ? (
            <Text style={styles.body} numberOfLines={3}>
              {translateNotificationMessage(item.body)}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.okBtn}
          onPress={onOk}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="OK, masquer ce rappel"
        >
          <Text style={styles.okText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.35)',
    padding: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  okBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  okText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SystemReminderBanner;
