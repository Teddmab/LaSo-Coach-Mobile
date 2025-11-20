# LaSo-Coach iOS - Codebase Structure

## 📱 Pages (Screens)

### 1. **DashboardScreen.js** (`src/screens/DashboardScreen.js`)
   **Main Dashboard/Home Screen** - Central hub of the application
   
   **Components Used:**
   - `BottomNavigation` - Bottom navigation bar
   - `ProgressCard` - User progress overview card
   - `ProfileCompletionCard` - Profile completion status card
   - `AchievementsCard` - Achievements summary card
   - `AgoraContentCard` - Agora content items
   - `LAgoraCard` - Community posts card
   - `NutritionCard` - Nutrition/meal planning card
   - `AgoraIcon` - Agora icon component
   - `Avatar` - User avatar/profile picture
   - `NotificationBadge` - Notification indicator badge
   - `SubscriptionAlert` - Subscription status alert modal
   - `BlurredCard` - Card with blur overlay
   - `SubscriptionBanner` - Subscription banner
   - `MoreMenu` - More options menu overlay
   
   **Sub-screens Rendered:**
   - `ProgressScreen` - When progress tab is active
   - `NutritionScreen` - When nutrition tab is active
   - `AchievementsScreen` - When achievements tab is active
   - `DefisScreen` - When defis tab is active
   - `ChatScreen` - Chat interface
   - `CommunityScreen` - Community feed
   - `AgendaScreen` - Calendar/agenda
   - `NotificationsScreen` - Notifications list
   - `ProfileScreen` - User profile
   - `SettingsScreen` - App settings
   - `FAQScreen` - Frequently asked questions

---

### 2. **AchievementsScreen.js** (`src/screens/AchievementsScreen.js`)
   **Achievements & Challenges Screen** - Displays user achievements, badges, and challenges
   
   **Components Used:**
   - `BlurOverlay` - Blur overlay for restricted content
   - `SubscriptionBanner` - Subscription status banner
   - `Avatar` - User avatar
   - `BadgeUnlockModal` - Modal for badge unlock animations
   - `FloatingPointsAnimation` - Floating points animation component
   
   **Features:**
   - Leaderboard (Top 5 General)
   - User ranking
   - Challenges summary
   - Badges display (grid + featured badge)
   - Challenges tabs (À relever, Acceptés, Complétés)

---

### 3. **DefisScreen.js** (`src/screens/DefisScreen.js`)
   **Defis (Challenges) Screen** - Dedicated challenges page
   
   **Components Used:**
   - `SubscriptionBanner` - Subscription status banner
   - `Avatar` - User avatar
   - `BadgeUnlockModal` - Badge unlock modal
   - `FloatingPointsAnimation` - Points animation
   
   **Features:**
   - Challenges list with tabs
   - Badges section (integrated)
   - Challenge assignment/completion

---

### 4. **ProgressScreen.js** (`src/screens/ProgressScreen.js`)
   **Progress Tracking Screen** - User progress and measurements
   
   **Components Used:**
   - `SubscriptionBanner` - Subscription banner
   - `Avatar` - User avatar
   - `ProgressChart` - Progress visualization chart
   - `BottomNavigation` - Bottom nav
   - `AchievementsCard` - Achievements card
   - `NotificationBadge` - Notification badge
   
   **Features:**
   - Progress charts
   - Measurements tracking
   - Progress photos

---

### 5. **NutritionScreen.js** (`src/screens/NutritionScreen.js`)
   **Nutrition/Meal Planning Screen** - Daily meals and nutrition
   
   **Components Used:**
   - `BlurOverlay` - Blur for restricted content
   - `SubscriptionBanner` - Subscription banner
   - `Avatar` - User avatar
   - `NotificationBadge` - Notification badge
   - `BottomNavigation` - Bottom nav
   
   **Features:**
   - Daily meal plans
   - Meal details with recipes
   - Nutrition information

---

### 6. **ProfileScreen.js** (`src/screens/ProfileScreen.js`)
   **User Profile Screen** - User profile management
   
   **Components Used:**
   - `SubscriptionBanner` - Subscription banner
   - `Avatar` - User avatar
   - `NotificationBadge` - Notification badge
   - `SubscriptionScreen` - Subscription management (embedded)
   
   **Features:**
   - Profile information
   - Objectives setting
   - Recommendations
   - Appointments
   - Subscription management

---

### 7. **ChatScreen.js** (`src/screens/ChatScreen.js`)
   **Chat Interface Screen** - Real-time chat with coach/community
   
   **Components Used:**
   - `Avatar` - User avatar
   
   **Features:**
   - Real-time messaging
   - Chat history
   - Message input

---

### 8. **CommunityScreen.js** (`src/screens/CommunityScreen.js`)
   **Community Feed Screen** - Social community posts
   
   **Components Used:**
   - `Avatar` - User avatar
   
   **Features:**
   - Community posts
   - Like/comment functionality
   - Post creation

---

### 9. **AgendaScreen.js** (`src/screens/AgendaScreen.js`)
   **Calendar/Agenda Screen** - User appointments and schedule
   
   **Components Used:**
   - `Avatar` - User avatar
   
   **Features:**
   - Calendar view
   - Appointment management
   - Schedule display

---

### 10. **NotificationsScreen.js** (`src/screens/NotificationsScreen.js`)
   **Notifications Screen** - User notifications list
   
   **Components Used:**
   - `Avatar` - User avatar
   
   **Features:**
   - Notifications list
   - Notification filtering
   - Real-time updates

---

### 11. **SettingsScreen.js** (`src/screens/SettingsScreen.js`)
   **App Settings Screen** - Application settings and preferences
   
   **Components Used:**
   - `SubscriptionBanner` - Subscription banner
   - `Avatar` - User avatar
   
   **Features:**
   - App preferences
   - Account settings
   - Logout functionality

---

### 12. **FAQScreen.js** (`src/screens/FAQScreen.js`)
   **FAQ Screen** - Frequently asked questions
   
   **Components Used:**
   - `Avatar` - User avatar
   - `NotificationBadge` - Notification badge
   
   **Features:**
   - FAQ categories
   - Search functionality
   - Question/answer display

---

### 13. **LoginScreen.js** (`src/screens/LoginScreen.js`)
   **Login Screen** - User authentication login
   
   **Components Used:**
   - None (uses only React Native components and icons)
   
   **Features:**
   - Email/password login
   - Google authentication
   - Password reset link

---

### 14. **RegisterScreen.js** (`src/screens/RegisterScreen.js`)
   **Registration Screen** - New user registration
   
   **Components Used:**
   - None (uses only React Native components and icons)
   
   **Features:**
   - User registration form
   - Google sign-up
   - Email validation

---

### 15. **WelcomeScreen.js** (`src/screens/WelcomeScreen.js`)
   **Welcome/Onboarding Screen** - App introduction
   
   **Components Used:**
   - None (uses only React Native components and icons)
   
   **Features:**
   - App introduction
   - Navigation to login/register

---

### 16. **PasswordResetScreen.js** (`src/screens/PasswordResetScreen.js`)
   **Password Reset Screen** - Password reset functionality
   
   **Components Used:**
   - None (uses only React Native components and icons)
   
   **Features:**
   - Password reset form
   - Password strength indicator

---

### 17. **SubscriptionScreen.js** (`src/screens/SubscriptionScreen.js`)
   **Subscription Management Screen** - Subscription plans and management
   
   **Components Used:**
   - None (uses only React Native components and icons)
   
   **Features:**
   - Subscription plans display
   - In-app purchase handling
   - Subscription activation

---

### 18. **TestScreen.js** (`src/screens/TestScreen.js`)
   **Test Screen** - Development/testing screen
   
   **Components Used:**
   - `Button` - Button component
   
   **Features:**
   - Testing utilities

---

## 🧩 Components Library

### **Core Components** (`src/components/`)

1. **Avatar.js** - User profile picture component
   - Used by: DashboardScreen, AchievementsScreen, DefisScreen, ProgressScreen, NutritionScreen, ProfileScreen, ChatScreen, CommunityScreen, AgendaScreen, NotificationsScreen, SettingsScreen, FAQScreen

2. **BottomNavigation.js** - Bottom navigation bar
   - Used by: DashboardScreen, ProgressScreen, NutritionScreen

3. **Button.js** - Reusable button component
   - Used by: TestScreen

4. **CircularProgress.js** - Circular progress indicator
   - Used by: (Standalone component)

5. **ErrorBoundary.js** - Error boundary wrapper
   - Used by: (App-level component)

6. **NetworkStatus.js** - Network connectivity indicator
   - Used by: (App-level component)

7. **NotificationBadge.js** - Notification count badge
   - Used by: DashboardScreen, ProgressScreen, NutritionScreen, ProfileScreen, FAQScreen

### **Badge Components**

8. **BadgeUnlockModal.js** - Modal for badge unlock celebrations
   - Used by: AchievementsScreen, DefisScreen

9. **FloatingPointsAnimation.js** - Floating points animation
   - Used by: AchievementsScreen, DefisScreen

### **Subscription Components**

10. **SubscriptionBanner.js** - Subscription status banner
    - Used by: DashboardScreen, AchievementsScreen, DefisScreen, ProgressScreen, NutritionScreen, ProfileScreen, SettingsScreen

11. **SubscriptionAlert.js** - Subscription alert modal
    - Used by: DashboardScreen

12. **SubscriptionTopAlert.js** - Top subscription alert
    - Used by: (Standalone component)

### **Overlay Components**

13. **BlurOverlay.js** - Blur overlay for restricted content
    - Used by: AchievementsScreen, NutritionScreen

14. **BlurredCard.js** - Card with blur effect
    - Used by: DashboardScreen

### **Navigation Components**

15. **MoreMenu.js** - More options menu overlay
    - Used by: DashboardScreen

### **Dashboard-Specific Components** (`src/components/dashboard/`)

16. **ProgressCard.js** - Progress overview card
    - Used by: DashboardScreen

17. **ProfileCompletionCard.js** - Profile completion status card
    - Used by: DashboardScreen

18. **AchievementsCard.js** - Achievements summary card
    - Used by: DashboardScreen, ProgressScreen

19. **AgoraContentCard.js** - Agora content item card
    - Used by: DashboardScreen

20. **LAgoraCard.js** - Community posts card
    - Used by: DashboardScreen

21. **NutritionCard.js** - Nutrition/meal planning card
    - Used by: DashboardScreen

22. **OnboardingProgressCard.js** - Onboarding progress card
    - Used by: (Standalone component)

### **Chart Components**

23. **ProgressChart.js** - Progress visualization chart
    - Used by: ProgressScreen

### **Icon Components** (`src/components/icons/`)

24. **AgoraIcon.js** - Agora icon component
    - Used by: DashboardScreen

---

## 📊 Summary Statistics

- **Total Pages**: 18 screens
- **Total Components**: 24 components
- **Most Used Component**: `Avatar` (used in 12 screens)
- **Dashboard Components**: 7 specialized dashboard cards

---

## 🔄 Navigation Flow

**Main Navigation Tabs:**
1. Home (DashboardScreen)
2. Progress (ProgressScreen)
3. Nutrition (NutritionScreen)
4. Achievements (AchievementsScreen)
5. Defis (DefisScreen)
6. More (MoreMenu)

**Modal/Overlay Screens:**
- Chat (from Dashboard)
- Community (from Dashboard)
- Agenda (from Dashboard)
- Notifications (from Dashboard)
- Settings (from Dashboard)
- Profile (from Dashboard)
- FAQ (from Dashboard)

**Auth Flow:**
1. WelcomeScreen → LoginScreen / RegisterScreen
2. LoginScreen → DashboardScreen
3. PasswordResetScreen (accessible from LoginScreen)

---

## 📝 Notes

- Most components are reusable and shared across multiple screens
- `Avatar` is the most commonly used component
- Dashboard-specific components are in `src/components/dashboard/`
- Subscription-related components handle subscription status display
- Badge components (BadgeUnlockModal, FloatingPointsAnimation) are used in achievement-related screens

