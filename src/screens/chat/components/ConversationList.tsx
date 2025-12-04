import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { Conversation } from '../types';
import { formatDate, getConversationTitle, getConversationAvatar } from '../utils/chatUtils';
import { User } from '../../../types/auth';

interface ConversationListProps {
  conversations: Conversation[];
  activeChatId?: string | null;
  searchText: string;
  currentUser?: User | null;
  onSearchChange: (text: string) => void;
  onConversationPress: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeChatId,
  searchText,
  currentUser,
  onSearchChange,
  onConversationPress,
}) => {
  const filteredConversations = conversations.filter(conv => {
    if (!searchText) return true;
    const title = getConversationTitle(conv, currentUser).toLowerCase();
    const lastMessage = conv.lastMessage?.content?.toLowerCase() || '';
    return title.includes(searchText.toLowerCase()) || lastMessage.includes(searchText.toLowerCase());
  });

  const renderItem = ({ item }: { item: Conversation }) => {
    const title = getConversationTitle(item, currentUser);
    const avatar = getConversationAvatar(item, currentUser);
    const lastMessage = item.lastMessage?.content || 'Aucun message';
    const time = item.lastMessage?.createdAt ? formatDate(item.lastMessage.createdAt) : '';
    const unread = (item.unreadCount || 0) > 0;
    const isActive = activeChatId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.item,
          isActive && styles.activeItem,
        ]}
        onPress={() => onConversationPress(item)}
      >
        <View style={[styles.avatarContainer, { backgroundColor: '#F5F5F5' }]}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {time ? <Text style={styles.time}>{time}</Text> : null}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {lastMessage}
          </Text>
        </View>
        
        {unread && (
          <View style={styles.unreadIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une conversation..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchText}
          onChangeText={onSearchChange}
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={`${conversations.length}-${conversations.map(c => `${c.id}-${c.unreadCount || 0}-${c.lastMessage?.id || ''}`).join(',')}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>Aucune conversation</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 100, // Espace pour la navigation fixe
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  activeItem: {
    backgroundColor: '#F0F7FF',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
});

export default ConversationList;

