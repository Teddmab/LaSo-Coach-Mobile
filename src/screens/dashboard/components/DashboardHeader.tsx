import React from 'react';
import AppHeader from '../../../components/AppHeader';
import type { User } from '../../../types/auth';

interface DashboardHeaderProps {
  user?: User | null;
  dashboardData?: any;
  onHelpPress: () => void;
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  dashboardData,
  onHelpPress,
  onNotificationPress,
  onProfilePress,
}) => {
  return (
    <AppHeader
      showLogo={true}
      onHelpPress={onHelpPress}
      onNotificationPress={onNotificationPress}
      onProfilePress={onProfilePress}
      avatarSource={dashboardData?.profile?.avatar || user?.avatar}
      avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
    />
  );
};

export default DashboardHeader;

