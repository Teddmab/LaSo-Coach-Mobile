# Logger Usage Guide

## Quick Start

```javascript
import { createLogger } from '../utils/logger';

// Create a logger for your component/page
const logger = createLogger('MyComponent');

// Use it
logger.debug('Detailed debug info', { data });
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

## Controlling Logs

### Disable logs for a specific component/page

```javascript
import { disableLogsFor } from '../utils/logger';

// Disable ProgressCard logs
disableLogsFor('ProgressCard');

// Disable DashboardScreen logs
disableLogsFor('DashboardScreen');
```

### Enable logs for a specific component/page

```javascript
import { enableLogsFor } from '../utils/logger';

// Enable ProgressCard logs
enableLogsFor('ProgressCard');
```

### Disable all logs

```javascript
import { disableAllLogs } from '../utils/logger';

disableAllLogs();
```

### Enable all logs

```javascript
import { enableAllLogs } from '../utils/logger';

enableAllLogs();
```

### Change log level

```javascript
import { updateLogConfig } from '../utils/logger';

// Only show errors
updateLogConfig({ level: 'error' });

// Show warnings and errors
updateLogConfig({ level: 'warn' });

// Show info, warnings, and errors
updateLogConfig({ level: 'info' });

// Show everything (default in dev)
updateLogConfig({ level: 'debug' });
```

## Log Levels

- **debug**: Detailed information for development (lowest priority)
- **info**: General information
- **warn**: Warnings that don't break functionality
- **error**: Errors that need attention (highest priority)

## Example Usage in Components

```javascript
import React from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('MyComponent');

const MyComponent = ({ data }) => {
  useEffect(() => {
    logger.debug('Component mounted', { data });
    
    if (!data) {
      logger.warn('No data provided to component');
    }
  }, [data]);
  
  const handleAction = async () => {
    try {
      logger.info('Action started');
      // ... do something
      logger.debug('Action completed successfully');
    } catch (error) {
      logger.error('Action failed', error);
    }
  };
  
  return <View>...</View>;
};
```

## Configuration

Edit `src/utils/logger.js` to configure:

- **Global enable/disable**: `LOG_CONFIG.enabled`
- **Per-component toggles**: `LOG_CONFIG.components`
- **Per-page toggles**: `LOG_CONFIG.pages`
- **Log level**: `LOG_CONFIG.level`
- **Show timestamps**: `LOG_CONFIG.showTimestamp`
- **Show context**: `LOG_CONFIG.showContext`

## Available Components/Pages

The logger is pre-configured for:

**Pages:**
- DashboardScreen
- ProgressScreen
- NutritionScreen
- AchievementsScreen
- ChatScreen
- CommunityScreen
- AgendaScreen
- NotificationsScreen
- ProfileScreen
- SettingsScreen

**Components:**
- ProgressCard
- ProfileCompletionCard
- AchievementsCard
- NutritionCard
- AgoraContentCard
- LAgoraCard
- BottomNavigation
- Avatar
- SubscriptionBanner
- SubscriptionAlert

Add more by editing `LOG_CONFIG` in `src/utils/logger.js`.

