export const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'Maintenant';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'il y a quelques secondes';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  } catch (error) {
    return 'Maintenant';
  }
};

