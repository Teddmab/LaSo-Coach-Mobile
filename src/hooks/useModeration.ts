import { useState, useCallback, useEffect } from 'react';
import moderationApi, { ModerationStatus } from '../services/moderationApi';

/**
 * useModeration - React hook for managing user moderation (blocks, reports)
 * 
 * Phase 8 - TODO #4: Cache blocked users list for performance
 * Phase 8 - TODO #5: Add local notification when content is removed
 * 
 * Provides:
 * - Block/unblock user functionality
 * - Report content/user functionality
 * - Blocked users list caching
 * - Moderation status checking
 * - Content access validation
 */

export interface UseModerationReturn {
  blockedUsers: string[];
  blocksLoading: boolean;
  isUserBlocked: (userId: string) => boolean;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  reportContent: (
    contentId: string,
    contentType: 'post' | 'message' | 'comment',
    reason: string
  ) => Promise<void>;
  reportUser: (userId: string, reason: string) => Promise<void>;
  moderationStatus: ModerationStatus | null;
  statusLoading: boolean;
  checkModerationStatus: () => Promise<void>;
}

export const useModeration = (): UseModerationReturn => {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Load blocked users on mount
  useEffect(() => {
    const loadBlockedUsers = async () => {
      try {
        console.log('🔍 [useModeration] Loading blocked users...');
        setBlocksLoading(true);
        const blocked = await moderationApi.getBlockedUsers();
        setBlockedUsers(blocked);
        console.log('✅ [useModeration] Blocked users loaded:', blocked.length);
      } catch (error) {
        console.error('❌ [useModeration] Error loading blocked users:', error);
        setBlockedUsers([]);
      } finally {
        setBlocksLoading(false);
      }
    };

    loadBlockedUsers();
  }, []);

  // Load moderation status on mount
  useEffect(() => {
    const loadModerationStatus = async () => {
      try {
        console.log('🔍 [useModeration] Checking moderation status...');
        setStatusLoading(true);
        const status = await moderationApi.getModerationStatus();
        setModerationStatus(status);
        console.log('✅ [useModeration] Moderation status loaded');
      } catch (error) {
        console.error('❌ [useModeration] Error loading moderation status:', error);
      } finally {
        setStatusLoading(false);
      }
    };

    loadModerationStatus();
  }, []);

  const isUserBlockedLocal = useCallback(
    (userId: string): boolean => {
      return blockedUsers.includes(userId);
    },
    [blockedUsers]
  );

  const blockUserLocal = useCallback(
    async (userId: string): Promise<void> => {
      try {
        console.log('🚫 [useModeration] Blocking user:', userId);
        await moderationApi.blockUser(userId);
        setBlockedUsers((prev) => [...prev, userId]);
        console.log('✅ [useModeration] User blocked');
      } catch (error) {
        console.error('❌ [useModeration] Error blocking user:', error);
        throw error;
      }
    },
    []
  );

  const unblockUserLocal = useCallback(
    async (userId: string): Promise<void> => {
      try {
        console.log('🔓 [useModeration] Unblocking user:', userId);
        await moderationApi.unblockUser(userId);
        setBlockedUsers((prev) => prev.filter((id) => id !== userId));
        console.log('✅ [useModeration] User unblocked');
      } catch (error) {
        console.error('❌ [useModeration] Error unblocking user:', error);
        throw error;
      }
    },
    []
  );

  const reportContentLocal = useCallback(
    async (
      contentId: string,
      contentType: 'post' | 'message' | 'comment',
      reason: string
    ): Promise<void> => {
      try {
        console.log('📋 [useModeration] Reporting content:', {
          contentId,
          contentType,
          reason,
        });

        if (contentType === 'post') {
          await moderationApi.reportPost(contentId, reason);
        } else if (contentType === 'message') {
          await moderationApi.reportMessage(contentId, reason);
        } else if (contentType === 'comment') {
          await moderationApi.reportComment(contentId, reason);
        }

        console.log('✅ [useModeration] Content reported');
      } catch (error) {
        console.error('❌ [useModeration] Error reporting content:', error);
        throw error;
      }
    },
    []
  );

  const reportUserLocal = useCallback(
    async (userId: string, reason: string): Promise<void> => {
      try {
        console.log('📋 [useModeration] Reporting user:', { userId, reason });
        await moderationApi.reportUser(userId, reason);
        console.log('✅ [useModeration] User reported');
      } catch (error) {
        console.error('❌ [useModeration] Error reporting user:', error);
        throw error;
      }
    },
    []
  );

  const checkModerationStatusLocal = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 [useModeration] Refreshing moderation status...');
      setStatusLoading(true);
      const status = await moderationApi.getModerationStatus();
      setModerationStatus(status);
      console.log('✅ [useModeration] Moderation status refreshed');
    } catch (error) {
      console.error('❌ [useModeration] Error refreshing status:', error);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  return {
    blockedUsers,
    blocksLoading,
    isUserBlocked: isUserBlockedLocal,
    blockUser: blockUserLocal,
    unblockUser: unblockUserLocal,
    reportContent: reportContentLocal,
    reportUser: reportUserLocal,
    moderationStatus,
    statusLoading,
    checkModerationStatus: checkModerationStatusLocal,
  };
};
