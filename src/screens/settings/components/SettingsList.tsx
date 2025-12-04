import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsItem, ExpandedSections } from '../types';

interface SettingsListProps {
  items: SettingsItem[];
  expandedSections: ExpandedSections;
  onItemPress: (itemId: string) => void;
  onSubItemPress: (subItemId: string) => void;
}

const SettingsList: React.FC<SettingsListProps> = ({
  items,
  expandedSections,
  onItemPress,
  onSubItemPress,
}) => {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={item.id}>
          <TouchableOpacity
            style={[
              styles.item,
              index === items.length - 1 && !item.expandable && styles.lastItem,
            ]}
            onPress={() => onItemPress(item.id)}
          >
            <View style={styles.icon}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Ionicons
              name={
                item.expandable
                  ? expandedSections[item.id]
                    ? 'chevron-up'
                    : 'chevron-down'
                  : 'chevron-forward'
              }
              size={20}
              color="#C0C0C0"
            />
          </TouchableOpacity>

          {/* Expandable Sub-items */}
          {item.expandable && expandedSections[item.id] && item.subItems && (
            <View style={styles.subItemsContainer}>
              {item.subItems.map((subItem, subIndex) => (
                <TouchableOpacity
                  key={subItem.id}
                  style={[
                    styles.subMenuItem,
                    subIndex === item.subItems!.length - 1 && styles.lastSubMenuItem,
                  ]}
                  onPress={() => onSubItemPress(subItem.id)}
                >
                  <View style={styles.subMenuIcon}>
                    <View style={styles.subMenuDot} />
                  </View>
                  <Text style={styles.subMenuTitle}>{subItem.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#424242',
  },
  subItemsContainer: {
    backgroundColor: '#FAFAFA',
    paddingLeft: 20,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastSubMenuItem: {
    borderBottomWidth: 0,
  },
  subMenuIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subMenuDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  subMenuTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
});

export default SettingsList;

