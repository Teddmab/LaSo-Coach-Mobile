import { Conversation, Participant } from '../types';
import { User } from '../../../types/auth';

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export const getConversationTitle = (conversation: Conversation, currentUser?: User | null): string => {
  // For group chats, use the group name
  if (conversation.type === 'GROUP' && conversation.name) {
    return conversation.name;
  }
  
  // For one-to-one chats, extract name from participants
  const participants = conversation.participants || 
                      conversation.participantUsers || 
                      conversation.users ||
                      [];
  
  if (Array.isArray(participants) && participants.length > 0) {
    const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;
    
    // Filter out current user
    const otherParticipants = participants.filter((p: Participant) => {
      if (!currentUserIdStr) return true;
      
      const participantId = p.id || 
                           p.userId || 
                           p.user?.id || 
                           p.participantId ||
                           (p.user && (p.user.id || p.user.userId));
      
      if (!participantId) return true;
      
      return String(participantId) !== currentUserIdStr;
    });
    
    if (otherParticipants.length > 0) {
      // Prioritize admin/coach participants
      const adminParticipant = otherParticipants.find((p: Participant) => {
        const role = p.role || p.user?.role || (p as any).userRole || p.user?.userRole;
        return role === 'ADMIN' || role === 'COACH' || role === 'admin' || role === 'coach';
      }) || otherParticipants[0];
      
      // Extract name from participant
      const participant = adminParticipant.user || adminParticipant;
      
      let name = participant?.name || 
                 participant?.firstName || 
                 (participant as any)?.fullName ||
                 adminParticipant?.name ||
                 adminParticipant?.firstName ||
                 null;
      
      // Combine firstName and lastName if available
      if (!name && participant?.firstName && participant?.lastName) {
        name = `${participant.firstName} ${participant.lastName}`.trim();
      }
      if (!name && adminParticipant?.firstName && adminParticipant?.lastName) {
        name = `${adminParticipant.firstName} ${adminParticipant.lastName}`.trim();
      }
      
      // Fallback to email username
      if (!name) {
        const email = participant?.email || adminParticipant?.email;
        if (email) {
          name = email.split('@')[0] || email;
        }
      }
      
      // Clean up any "Chat with" prefix
      if (name && typeof name === 'string') {
        name = name.replace(/^Chat with\s+/i, '').trim();
      }
      
      if (name) {
        return name;
      }
    }
  }
  
  // Last resort: Try to get name from last message sender
  if (conversation.lastMessage && conversation.lastMessage.sender) {
    const sender = conversation.lastMessage.sender;
    let name = sender.name || sender.firstName || null;
    if (!name && sender.firstName && (sender as any).lastName) {
      name = `${sender.firstName} ${(sender as any).lastName}`.trim();
    }
      if (name) {
        const senderId = sender.id || (sender as any).userId;
        const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;
        if (senderId && currentUserIdStr && String(senderId) !== currentUserIdStr) {
          return name.replace(/^Chat with\s+/i, '').trim();
        }
      }
  }
  
  return 'Chat';
};

export const getConversationAvatar = (conversation: Conversation, currentUser?: User | null): string => {
  if (conversation.type === 'GROUP') {
    return conversation.name?.charAt(0).toUpperCase() || 'G';
  }
  
  if (conversation.participants && conversation.participants.length > 0) {
    const otherParticipants = conversation.participants.filter((p: Participant) => {
      const participantId = p.id || p.userId || p.user?.id;
      const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;
      return participantId && currentUserIdStr ? String(participantId) !== currentUserIdStr : true;
    });
    
    if (otherParticipants.length > 0) {
      // Prioritize admin/coach participants
      const adminParticipant = otherParticipants.find((p: Participant) => {
        const role = p.role || p.user?.role;
        return role === 'ADMIN' || role === 'COACH' || role === 'admin' || role === 'coach';
      }) || otherParticipants[0];
      
      const name = adminParticipant?.name || 
                   adminParticipant?.firstName || 
                   adminParticipant?.email?.split('@')[0] ||
                   'A';
      
      return name.charAt(0).toUpperCase();
    }
  }
  
  return 'A'; // Default to 'A' for Admin
};

