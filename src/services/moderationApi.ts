import api from './api';

/**
 * Moderation API - Handles reporting, blocking, and moderation features
 * 
 * Phase 8 - TODO #1: Verify backend endpoints for reporting
 * Phase 8 - TODO #2: Implement block user endpoint on backend
 * Phase 8 - TODO #3: Add moderation history endpoint
 * 
 * Addresses App Store requirements:
 * - 1.4.1: Zero-tolerance policy enforcement
 * - 3.1.1: User-generated content moderation
 * - 3.2.1: Unacceptable content blocking
 */

interface ReportData {
  reportedUserId?: string;
  reportedContentId?: string;
  contentType: 'post' | 'message' | 'comment' | 'user';
  reason: string;
  description?: string;
  timestamp: number;
}

interface BlockData {
  blockedUserId: string;
  timestamp: number;
}

interface ModerationHistoryItem {
  id: string;
  type: 'report' | 'block';
  reason?: string;
  targetId: string;
  targetType: string;
  createdAt: number;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface ModerationStatus {
  canAccess: boolean;
  blockedUsers: string[];
  reportedCount: number;
}

class ModerationApi {
  /**
   * Report a post
   * @param postId - Post UUID
   * @param reason - Reason for report (from predefined list or custom)
   */
  async reportPost(postId: string, reason: string): Promise<any> {
    try {
      console.log('📋 [ModerationApi] Reporting post:', { postId, reason });
      const response = await api.post('/moderation/reports', {
        reportedContentId: postId,
        contentType: 'post',
        reason,
        description: reason,
        timestamp: Date.now(),
      });
      console.log('✅ [ModerationApi] Post reported successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [ModerationApi] Error reporting post:', error);
      throw error;
    }
  }

  /**
   * Report a message in chat
   * @param messageId - Message UUID
   * @param reason - Reason for report
   */
  async reportMessage(messageId: string, reason: string): Promise<any> {
    try {
      console.log('📋 [ModerationApi] Reporting message:', { messageId, reason });
      const response = await api.post('/moderation/reports', {
        reportedContentId: messageId,
        contentType: 'message',
        reason,
        description: reason,
        timestamp: Date.now(),
      });
      console.log('✅ [ModerationApi] Message reported successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [ModerationApi] Error reporting message:', error);
      throw error;
    }
  }

  /**
   * Report a comment on a post
   * @param commentId - Comment UUID
   * @param reason - Reason for report
   */
  async reportComment(commentId: string, reason: string): Promise<any> {
    try {
      console.log('📋 [ModerationApi] Reporting comment:', { commentId, reason });
      const response = await api.post('/moderation/reports', {
        reportedContentId: commentId,
        contentType: 'comment',
        reason,
        description: reason,
        timestamp: Date.now(),
      });
      console.log('✅ [ModerationApi] Comment reported successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [ModerationApi] Error reporting comment:', error);
      throw error;
    }
  }

  /**
   * Report a user for violating guidelines
   * @param userId - User UUID to report
   * @param reason - Reason for report
   */
  async reportUser(userId: string, reason: string): Promise<any> {
    try {
      console.log('📋 [ModerationApi] Reporting user:', { userId, reason });
      const response = await api.post('/moderation/reports', {
        reportedUserId: userId,
        contentType: 'user',
        reason,
        description: reason,
        timestamp: Date.now(),
      });
      console.log('✅ [ModerationApi] User reported successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [ModerationApi] Error reporting user:', error);
      throw error;
    }
  }

  /**
   * Block a user - prevents viewing their content and communication
   * ✅ COMPLIANCE: Notifies developer when user is blocked
   * @param userId - User UUID to block
   */
  async blockUser(userId: string): Promise<any> {
    try {
      console.log('🚫 [ModerationApi] Blocking user:', userId);
      const response = await api.post('/moderation/blocks', {
        blockedUserId: userId,
        timestamp: Date.now(),
      });
      console.log('✅ [ModerationApi] User blocked successfully');
      
      // ✅ COMPLIANCE: Alert developers immediately after block
      // This is a separate call - if it fails, block still succeeds
      try {
        await this.alertDeveloperUserBlocked(userId);
      } catch (alertError) {
        console.warn('⚠️ [ModerationApi] Developer alert failed (non-critical)');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [ModerationApi] Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Unblock a previously blocked user
   * @param userId - User UUID to unblock
   */
  async unblockUser(userId: string): Promise<any> {
    try {
      console.log('🔓 [ModerationApi] Unblocking user:', userId);
      const response = await api.delete(`/moderation/blocks/${userId}`);
      console.log('✅ [ModerationApi] User unblocked successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [ModerationApi] Error unblocking user:', error);
      throw error;
    }
  }

  /**
   * Get list of blocked users
   * @returns List of blocked user IDs
   */
  async getBlockedUsers(): Promise<string[]> {
    try {
      console.log('🔍 [ModerationApi] Fetching blocked users list...');
      const response = await api.get('/moderation/blocks');
      const blockedUsers = response.data?.data?.blockedUsers || [];
      console.log('✅ [ModerationApi] Blocked users retrieved:', blockedUsers.length);
      return blockedUsers;
    } catch (error) {
      console.error('❌ [ModerationApi] Error fetching blocked users:', error);
      return [];
    }
  }

  /**
   * Check if a user is blocked
   * @param userId - User UUID to check
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const blockedUsers = await this.getBlockedUsers();
      return blockedUsers.includes(userId);
    } catch (error) {
      console.error('❌ [ModerationApi] Error checking if user is blocked:', error);
      return false;
    }
  }

  /**
   * Get moderation history (reports and blocks)
   * @param limit - Number of items to return (default: 50)
   */
  async getModerationHistory(limit: number = 50): Promise<ModerationHistoryItem[]> {
    try {
      console.log('📋 [ModerationApi] Fetching moderation history...');
      const response = await api.get(`/moderation/history?limit=${limit}`);
      const history = response.data?.data?.history || [];
      console.log('✅ [ModerationApi] Moderation history retrieved:', history.length);
      return history;
    } catch (error) {
      console.error('❌ [ModerationApi] Error fetching moderation history:', error);
      return [];
    }
  }

  /**
   * Get user moderation status (blocked count, can access, etc.)
   */
  async getModerationStatus(): Promise<ModerationStatus> {
    try {
      console.log('🔍 [ModerationApi] Checking moderation status...');
      const response = await api.get('/moderation/status');
      const status = response.data?.data || {
        canAccess: true,
        blockedUsers: [],
        reportedCount: 0,
      };
      console.log('✅ [ModerationApi] Moderation status:', status);
      return status;
    } catch (error) {
      console.error('❌ [ModerationApi] Error fetching moderation status:', error);
      // Default to allowing access if we can't check status
      return {
        canAccess: true,
        blockedUsers: [],
        reportedCount: 0,
      };
    }
  }

  /**
   * Appeal a content removal (if user disputes moderation decision)
   * @param contentId - Content that was removed
   * @param reason - Reason for appeal
   */
  async appealRemoval(contentId: string, reason: string): Promise<any> {
    try {
      console.log('📤 [ModerationApi] Submitting appeal:', { contentId, reason });
      const response = await api.post('/moderation/appeals', {
        contentId,
        reason,
        timestamp: Date.now(),
      });
      console.log('✅ [ModerationApi] Appeal submitted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [ModerationApi] Error submitting appeal:', error);
      throw error;
    }
  }

  /**
   * Get content status (whether it was removed for moderation)
   * @param contentId - Content UUID
   * @param contentType - Type of content (post, message, comment)
   */
  async getContentStatus(
    contentId: string,
    contentType: 'post' | 'message' | 'comment'
  ): Promise<any> {
    try {
      console.log('🔍 [ModerationApi] Checking content status:', { contentId, contentType });
      const response = await api.get(
        `/moderation/content/${contentType}/${contentId}`
      );
      return response.data?.data || {};
    } catch (error) {
      console.error('❌ [ModerationApi] Error checking content status:', error);
      return {};
    }
  }

  /**
   * ✅ COMPLIANCE: Alert developer about user block for moderation team
   * Used when a user blocks another user - notifies backend for moderation records
   * @param blockedUserId - User UUID being blocked
   * @param reason - Optional reason for block (context for moderation team)
   */
  async alertDeveloperUserBlocked(
    blockedUserId: string,
    reason?: string
  ): Promise<any> {
    try {
      console.log('🚨 [ModerationApi] Alerting developers - user blocked:', {
        blockedUserId,
        reason,
      });
      const response = await api.post('/moderation/developer-alerts', {
        type: 'user_blocked',
        blockedUserId,
        reason: reason || 'User blocked by another user',
        timestamp: Date.now(),
      });
      console.log(
        '✅ [ModerationApi] Developer alert sent - user block notification'
      );
      return response.data;
    } catch (error) {
      console.warn(
        '⚠️ [ModerationApi] Failed to send developer alert (non-critical):',
        error
      );
      // Don't throw - this is a secondary notification
      return null;
    }
  }
}

export default new ModerationApi();
