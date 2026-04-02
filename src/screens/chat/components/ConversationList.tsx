import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { Conversation } from '../types';
import { formatDate, getConversationTitle, getConversationAvatar } from '../utils/chatUtils';
import { User } from '../../../types/auth';
import { formatDateLabel, formatTimeLabel, getDaysUntil } from '../../agenda/utils/agendaUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ConversationListProps {
  conversations: Conversation[];
  activeChatId?: string | null;
  searchText: string;
  currentUser?: User | null;
  onSearchChange: (text: string) => void;
  onConversationPress: (conversation: Conversation) => void;
  rendezvousData?: any | null;
  onFAQPress?: () => void;
  onTakeRendezvous?: () => void;
  onModifyRendezvous?: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeChatId,
  searchText,
  currentUser,
  onSearchChange,
  onConversationPress,
  rendezvousData,
  onFAQPress,
  onTakeRendezvous,
  onModifyRendezvous,
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
          <EmptyConversationsCard 
            rendezvousData={rendezvousData} 
            onFAQPress={onFAQPress}
            onTakeRendezvous={onTakeRendezvous}
            onModifyRendezvous={onModifyRendezvous}
          />
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

// ✅ MODIFICATION: Carte UI pour l'état vide avec message selon le statut du rendez-vous
const EmptyConversationsCard: React.FC<{ rendezvousData?: any | null; onFAQPress?: () => void; onTakeRendezvous?: () => void; onModifyRendezvous?: () => void }> = ({ 
  rendezvousData, 
  onFAQPress,
  onTakeRendezvous,
  onModifyRendezvous
}) => {
  // CAS 2 - RDV PAS ENCORE PRIS
  if (!rendezvousData) {
    return (
      <View style={emptyCardStyles.container}>
        <View style={emptyCardStyles.card}>
          <View style={emptyCardStyles.content}>
            <Text style={emptyCardStyles.title}>
              Vous retrouverez nos échanges ici, une fois votre rendez-vous pris avec LaSoCoach.
            </Text>
            
            {onTakeRendezvous && (
              <TouchableOpacity 
                style={emptyCardStyles.actionButton}
                onPress={onTakeRendezvous}
                activeOpacity={0.7}
              >
                <Text style={emptyCardStyles.actionButtonText}>Prendre un rendez-vous</Text>
              </TouchableOpacity>
            )}
            
            {onFAQPress && (
              <TouchableOpacity 
                style={emptyCardStyles.faqLink}
                onPress={onFAQPress}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle-outline" size={18} color={theme.colors.primary} />
                <Text style={emptyCardStyles.faqLinkText}>
                  Besoin d'aide ? Consultez notre FAQ
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Formater la date du rendez-vous
  const rendezvousDate = rendezvousData?.scheduledAt ? new Date(rendezvousData.scheduledAt) : null;
  const now = new Date();
  const isDatePassed = rendezvousDate && rendezvousDate < now;
  
  // CAS 3 - DATE DU RENDEZ-VOUS PASSÉE
  if (isDatePassed) {
    const formattedDate = rendezvousDate ? formatDateLabel(rendezvousDate) : null;
    const formattedTime = rendezvousDate ? formatTimeLabel(rendezvousDate) : null;
    
    return (
      <View style={emptyCardStyles.container}>
        <View style={emptyCardStyles.card}>
          <View style={emptyCardStyles.content}>
            <Text style={emptyCardStyles.title}>
              Nous n'avons pas pu vous joindre à l'heure prévue.
            </Text>
            <Text style={emptyCardStyles.description}>
              Choisissez une nouvelle date pour reprendre votre rendez-vous.
            </Text>
            
            {rendezvousDate && (
              <View style={emptyCardStyles.detailsContainer}>
                <View style={emptyCardStyles.detailRow}>
                  <Text style={emptyCardStyles.detailLabel}>Rendez-vous initial</Text>
                  <Text style={emptyCardStyles.detailValue}>
                    {formattedDate} à {formattedTime}
                  </Text>
                </View>
                <View style={emptyCardStyles.detailRow}>
                  <Text style={emptyCardStyles.detailLabel}>Statut</Text>
                  <Text style={[emptyCardStyles.detailValue, { color: '#FF3B30' }]}>RDV manqué</Text>
                </View>
              </View>
            )}
            
            {onModifyRendezvous && (
              <TouchableOpacity 
                style={emptyCardStyles.actionButton}
                onPress={onModifyRendezvous}
                activeOpacity={0.7}
              >
                <Text style={emptyCardStyles.actionButtonText}>Modifier mon RDV</Text>
              </TouchableOpacity>
            )}
            
            {onFAQPress && (
              <TouchableOpacity 
                style={emptyCardStyles.faqLink}
                onPress={onFAQPress}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle-outline" size={18} color={theme.colors.primary} />
                <Text style={emptyCardStyles.faqLinkText}>
                  Besoin d'aide ? Consultez notre FAQ
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // CAS 1 - RDV PRIS (date future)
  const formattedDate = rendezvousDate ? formatDateLabel(rendezvousDate) : null;
  const formattedTime = rendezvousDate ? formatTimeLabel(rendezvousDate) : null;
  const daysRemaining = rendezvousDate ? getDaysUntil(rendezvousDate) : null;

  return (
    <View style={emptyCardStyles.container}>
      <View style={emptyCardStyles.card}>
        <View style={emptyCardStyles.content}>
          <Text style={emptyCardStyles.title}>
            Nous vous contacterons via le chat, une fois votre rendez-vous confirmé.
          </Text>
          
          {rendezvousDate && (
            <View style={emptyCardStyles.detailsContainer}>
              <View style={emptyCardStyles.detailRow}>
                <Text style={emptyCardStyles.detailLabel}>Date du rendez-vous</Text>
                <Text style={emptyCardStyles.detailValue}>
                  {formattedDate} à {formattedTime}
                </Text>
              </View>
              {daysRemaining && (
                <View style={emptyCardStyles.detailRow}>
                  <Text style={emptyCardStyles.detailLabel}>Échéance</Text>
                  <Text style={[emptyCardStyles.detailValue, { color: theme.colors.primary }]}>
                    {daysRemaining}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {onFAQPress && (
            <TouchableOpacity 
              style={emptyCardStyles.faqLink}
              onPress={onFAQPress}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={18} color={theme.colors.primary} />
              <Text style={emptyCardStyles.faqLinkText}>
                Besoin d'aide ? Consultez notre FAQ
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const emptyCardStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: SCREEN_WIDTH - 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'left',
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 16,
  },
  faqLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  faqLinkText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConversationList;

