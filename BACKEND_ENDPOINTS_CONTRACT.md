# Backend Endpoints Contract
## LasoCoach Mobile App - Complete API Specification

**Generated:** January 17, 2026  
**App Version:** v1.0.6 (Build 27)  
**Framework:** React Native + Expo SDK 54 + TypeScript  
**Base URL:** Configured in `src/config/env.ts` (API_BASE_URL)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Profile Management](#profile-management)
3. [Entitlements & Subscriptions](#entitlements--subscriptions)
4. [Nutrition & Meal Plans](#nutrition--meal-plans)
5. [Community & UGC](#community--ugc)
6. [Chat & Messaging](#chat--messaging)
7. [Progress & Achievements](#progress--achievements)
8. [Measurements](#measurements)
9. [Progress Photos](#progress-photos)
10. [Moderation & Safety](#moderation--safety)
11. [Device Management](#device-management)
12. [Notifications](#notifications)
13. [Agenda & Content](#agenda--content)
14. [IAP & Payments](#iap--payments)
15. [FAQ](#faq)

---

## Authentication

### POST /auth/login
**Purpose:** User login with Firebase ID token  
**Called From:** `src/context/FirebaseAuthContext.js`  
**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {firebaseIdToken}
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "jwt-token-for-session"
  }
}
```
**Error Cases:**
- `401 Unauthorized`: Invalid credentials
- `404 Not Found`: User does not exist
- `500 Internal Server Error`: Server-side issue

---

### POST /auth/register
**Purpose:** User registration  
**Called From:** `src/screens/auth/SignUpScreen.tsx`  
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### POST /auth/logout
**Purpose:** Logout user  
**Called From:** `src/context/FirebaseAuthContext.js`  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### POST /auth/refresh-token
**Purpose:** Refresh authentication token  
**Called From:** Axios interceptor in `src/services/api.ts`  
**Request Body:**
```json
{
  "refreshToken": "refresh-token-value"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "token": "new-jwt-token",
    "expiresIn": 3600
  }
}
```

### POST /auth/forgot-password
**Purpose:** Request password reset  
**Request Body:**
```json
{
  "email": "user@example.com"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Reset email sent"
}
```

### POST /auth/verify-reset-token
**Purpose:** Verify password reset token  
**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "email": "user@example.com"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "valid": true
}
```

### POST /auth/complete-reset-password
**Purpose:** Complete password reset  
**Request Body:**
```json
{
  "token": "reset-token",
  "email": "user@example.com",
  "newPassword": "new-password123"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

---

## Profile Management

### GET /auth/profile
**Purpose:** Fetch current user profile  
**Called From:** `src/services/profileApi.ts` → `getProfile()`  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "phoneNumber": "+33612345678",
    "avatar": "https://s3.example.com/avatars/user-uuid.jpg",
    "address": "123 Main St; Apt 4B; Paris; 75001; France",
    "profile": {
      "height": 180,
      "initialWeight": 85,
      "initialWaistSize": 95,
      "currentWeight": 82,
      "currentWaistSize": 92,
      "gender": "male",
      "occupation": "Software Engineer"
    },
    "badgeProgress": {
      "currentBadge": {
        "id": "badge-1",
        "name": "Bronze",
        "description": "Complete 5 meals",
        "currentLevel": 1,
        "isCurrent": true
      },
      "nextBadge": {
        "id": "badge-2",
        "name": "Silver",
        "pointsNeeded": 500
      },
      "summary": {
        "unlockedBadges": 3,
        "totalBadges": 10
      }
    },
    "tasccProgress": {
      "totalPoints": 250,
      "level": 2
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-17T14:22:00Z"
  }
}
```

### PUT /profile
**Purpose:** Update user profile  
**Called From:** `src/services/profileApi.ts` → `updateProfile()`  
**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {firebaseIdToken}
```
**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",
  "phoneNumber": "+33612345678",
  "address": "123 Main St; Apt 4B; Paris; 75001; France",
  "profile": {
    "height": 180,
    "initialWeight": 85,
    "initialWaistSize": 95,
    "gender": "male",
    "occupation": "Software Engineer"
  }
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "profile": {...}
  }
}
```

### POST /profile
**Purpose:** Create user profile (if not exists)  
**Called From:** `src/services/onboardingApi.ts` → `completeProfileSetup()`  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid"
  }
}
```

### DELETE /profile
**Purpose:** Delete user profile and all data  
**Called From:** `src/screens/settings/hooks/useSecurity.ts` → `performAccountDeletion()`  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Profile deleted successfully"
}
```

### PUT /profile/avatar
**Purpose:** Upload user avatar image  
**Called From:** `src/services/profileApi.ts` (multipart upload)  
**Request Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {firebaseIdToken}
```
**Form Data:**
- Field name: `avatar`
- File: Image file (JPEG, PNG)
- Max size: 2MB

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "avatar": "https://s3.example.com/avatars/user-uuid.jpg"
  }
}
```

---

## Entitlements & Subscriptions

### GET /entitlements
**Purpose:** Fetch user's feature entitlements  
**Called From:** `src/services/entitlementsApi.ts` → `getUserEntitlements()`  
**iOS Behavior:** Returns default (no access) in companion mode; skips network call  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "entitlements-uuid",
    "userId": "user-uuid",
    "canAccessNutrition": true,
    "canAccessChat": true,
    "canAccessAdvancedAnalytics": false,
    "canAccessCoachingPlans": true,
    "canAccessDietPlans": true,
    "subscriptionStatus": "ACTIVE",
    "subscriptionExpiresAt": "2024-02-15T23:59:59Z",
    "lastUpdated": "2024-01-17T10:00:00Z"
  }
}
```

### GET /subscription/status
**Purpose:** Get user's subscription status  
**Called From:** `src/screens/NutritionScreen.tsx`  
**iOS Behavior:** Skipped in companion mode  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "subscriptionStatus": "ACTIVE",
    "subscriptionType": "PREMIUM",
    "expiresAt": "2024-02-15T23:59:59Z",
    "autoRenew": true,
    "lastRenewal": "2024-01-15T10:00:00Z"
  }
}
```

### POST /payments/validate-ios-receipt
**Purpose:** Validate iOS App Store receipt (server-side verification)  
**Called From:** `src/services/iapReceiptApi.ts` → `validateiOSReceipt()`  
**Request Body:**
```json
{
  "receiptData": "base64-encoded-receipt",
  "transactionId": "1000000123456789",
  "productId": "com.lasocoa ch.premium.monthly",
  "originalTransactionId": "1000000123456789"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "productId": "com.lascoach.premium.monthly",
    "expiresDate": "2024-02-15T23:59:59Z",
    "bundleId": "com.lascoach.ios",
    "originalPurchaseDate": "2024-01-15T10:00:00Z"
  }
}
```

### POST /payments/validate-android-receipt
**Purpose:** Validate Android Play Store receipt  
**Called From:** `src/services/iapReceiptApi.ts` → `validateAndroidReceipt()`  
**Request Body:**
```json
{
  "purchaseToken": "purchase-token-from-play-store",
  "productId": "com.lascoach.premium.monthly",
  "orderId": "GPA.1234-5678-1234-56789",
  "packageName": "com.lascoach.mobile",
  "transactionReceipt": "receipt-json-string"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "productId": "com.lascoach.premium.monthly",
    "purchaseTime": 1642256400000,
    "expiryTime": 1644848400000
  }
}
```

---

## Nutrition & Meal Plans

### GET /nutrition/plans
**Purpose:** Fetch user's meal plans  
**Called From:** `src/screens/NutritionScreen.tsx`  
**iOS Behavior:** Skipped in companion mode  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "plans": [
      {
        "id": "plan-uuid",
        "name": "Weight Loss Program",
        "description": "12-week customized weight loss plan",
        "duration": 12,
        "unit": "weeks",
        "startDate": "2024-01-15",
        "endDate": "2024-04-15",
        "mealsPerDay": 3,
        "totalMeals": 252,
        "completedMeals": 45,
        "status": "ACTIVE",
        "nutritionGoals": {
          "dailyCalories": 1800,
          "protein": 150,
          "carbs": 180,
          "fat": 60
        }
      }
    ]
  }
}
```

### GET /nutrition/plans/{planId}/progress
**Purpose:** Get specific plan progress  
**Called From:** Nutrition screen components  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "planId": "plan-uuid",
    "totalMeals": 252,
    "completedMeals": 45,
    "progressPercentage": 17.86,
    "daysRemaining": 84,
    "averageMealsPerDay": 3
  }
}
```

### POST /meals/{mealId}/complete
**Purpose:** Mark a meal as completed  
**Called From:** `src/services/nutritionApi.ts` → `completeMeal()`  
**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {firebaseIdToken}
```
**Request Body:**
```json
{
  "nutritionPlanId": "plan-uuid",
  "completionDate": "2024-01-17",
  "planDay": 5,
  "feedback": "Great meal!",
  "rating": 5
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "mealId": "meal-uuid",
    "completed": true,
    "completedAt": "2024-01-17T12:30:00Z",
    "pointsEarned": 10
  }
}
```

### POST /meals/{mealId}/like
**Purpose:** Like a meal  
**Called From:** Nutrition screen UI  
**Request Body:**
```json
{
  "mealId": "meal-uuid"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "mealId": "meal-uuid",
    "liked": true,
    "likeCount": 5
  }
}
```

### POST /meals/{mealId}/dislike
**Purpose:** Dislike a meal  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "mealId": "meal-uuid",
    "liked": false,
    "likeCount": 4
  }
}
```

### DELETE /meals/{mealId}/interaction
**Purpose:** Remove meal interaction (like/dislike)  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Interaction removed"
}
```

---

## Community & UGC

### GET /community/posts?page={page}&limit={limit}&include=user,likes
**Purpose:** Fetch community posts with pagination  
**Called From:** `src/services/communityApi.ts` → `getPosts()`  
**Features:**
- ✅ Includes user data (avatar, name, profile info)
- ✅ Includes likes data
- ✅ Instant filtering of blocked users on client
- ✅ UGC Terms gate before access
- ✅ Zero-tolerance blocking policy

**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `include`: Relations to include (user, likes)

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "posts": [
      {
        "id": "post-uuid",
        "content": "Just completed my first week! Feeling amazing! 💪",
        "userId": "user-uuid",
        "user": {
          "id": "user-uuid",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://s3.example.com/avatars/user-uuid.jpg",
          "email": "john@example.com"
        },
        "media": [
          {
            "id": "media-uuid",
            "url": "https://s3.example.com/posts/post-uuid/image1.jpg",
            "type": "image"
          }
        ],
        "likes": [
          {
            "id": "like-uuid",
            "userId": "liker-uuid"
          }
        ],
        "likeCount": 23,
        "commentCount": 5,
        "createdAt": "2024-01-17T10:30:00Z",
        "updatedAt": "2024-01-17T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 245,
      "totalPages": 25
    }
  }
}
```

### GET /community/posts/{postId}?include=user,likes
**Purpose:** Fetch single post details  
**Expected Response (200 OK):** Same structure as single post from GET /community/posts

### POST /community/posts
**Purpose:** Create a new post  
**Called From:** `src/services/communityApi.ts` → `createPost()`  
**Request Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {firebaseIdToken}
```
**Form Data:**
- Field `content`: Post text (markdown supported)
- Field `media`: Image files (max 5 files, each max 2MB)

**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "post-uuid",
    "content": "My progress update...",
    "userId": "user-uuid",
    "media": [...],
    "createdAt": "2024-01-17T10:30:00Z"
  }
}
```

### POST /community/posts/{postId}/like
**Purpose:** Like a community post  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "postId": "post-uuid",
    "liked": true,
    "likeCount": 24
  }
}
```

---

## Chat & Messaging

### GET /chat/conversations
**Purpose:** Fetch all conversations for current user  
**Called From:** `src/services/chatApi.ts` → `getConversations()`  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "chat-uuid",
      "type": "ONE_TO_ONE",
      "participants": [
        {
          "id": "user-uuid",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://s3.example.com/avatars/user-uuid.jpg"
        },
        {
          "id": "other-user-uuid",
          "firstName": "Jane",
          "lastName": "Smith",
          "avatar": "https://s3.example.com/avatars/other-user-uuid.jpg"
        }
      ],
      "lastMessage": "See you tomorrow!",
      "lastMessageAt": "2024-01-17T14:22:00Z",
      "unreadCount": 0,
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

### GET /chat/conversations/{chatId}/messages?limit={limit}&before={date}
**Purpose:** Fetch messages for a conversation  
**Called From:** `src/services/chatApi.ts` → `getMessages()`  
**Features:**
- ✅ Pagination with limit and before cursor
- ✅ Instant filtering of blocked users' messages
- ✅ Messages from blocked users not displayed
- ✅ Zero-tolerance blocking policy enforced

**Query Parameters:**
- `limit`: Number of messages (default: 50, max: 100)
- `before`: ISO timestamp for pagination (load older messages)

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "message-uuid",
      "chatId": "chat-uuid",
      "senderId": "user-uuid",
      "sender": {
        "id": "user-uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "avatar": "https://s3.example.com/avatars/user-uuid.jpg"
      },
      "content": "Thanks for the support!",
      "createdAt": "2024-01-17T14:22:00Z",
      "readAt": "2024-01-17T14:25:00Z"
    }
  ]
}
```

### POST /chat/conversations/{chatId}/messages
**Purpose:** Send message to conversation  
**Called From:** `src/services/chatApi.ts` → `sendMessage()`  
**Request Body:**
```json
{
  "content": "Hello! How are you doing?"
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "message-uuid",
    "chatId": "chat-uuid",
    "senderId": "user-uuid",
    "content": "Hello! How are you doing?",
    "createdAt": "2024-01-17T14:30:00Z"
  }
}
```

### POST /chat/one-to-one
**Purpose:** Create or get one-to-one chat  
**Called From:** `src/services/chatApi.ts` → `createOneToOneChat()`  
**Request Body:**
```json
{
  "otherUserId": "other-user-uuid"
}
```
**Expected Response (200/201):**
```json
{
  "status": "success",
  "data": {
    "id": "chat-uuid",
    "type": "ONE_TO_ONE",
    "participants": [...]
  }
}
```

### POST /chat/group
**Purpose:** Create group chat  
**Called From:** `src/services/chatApi.ts` → `createGroupChat()`  
**Request Body:**
```json
{
  "name": "Fitness Buddies",
  "userIds": ["user-uuid-1", "user-uuid-2", "user-uuid-3"]
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "chat-uuid",
    "type": "GROUP",
    "name": "Fitness Buddies",
    "participants": [...]
  }
}
```

### POST /chat/find-or-create
**Purpose:** Find or create chat with specific participants  
**Request Body:**
```json
{
  "participantIds": ["user-uuid-1", "user-uuid-2"],
  "type": "ONE_TO_ONE"
}
```
**Expected Response (200/201):**
```json
{
  "status": "success",
  "data": {
    "id": "chat-uuid",
    "type": "ONE_TO_ONE",
    "participants": [...]
  }
}
```

### GET /chat/unread/count
**Purpose:** Get total unread message count  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 5
  }
}
```

### PATCH /chat/conversations/{chatId}/read
**Purpose:** Mark conversation as read  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Conversation marked as read"
}
```

---

## Progress & Achievements

### GET /profile
**Purpose:** Fetch full profile including achievements data  
**Called From:** `src/services/achievementsApi.ts` → `getAchievementsSummary()`  
**Expected Response (200 OK):** Profile response with badgeProgress and tasccProgress fields (see Profile Management section)

### GET /mobile/badges
**Purpose:** Get all badges with user progress (simplified mobile endpoint)  
**Called From:** `src/services/badgeApi.ts` → `getAllBadges()`  
**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "badge-1",
        "name": "Bronze",
        "description": "Complete 5 meals",
        "icon": "https://s3.example.com/badges/bronze.png",
        "unlocked": true,
        "currentLevel": 1,
        "totalLevels": 3,
        "progressPercentage": 50
      },
      {
        "id": "badge-2",
        "name": "Silver",
        "description": "Complete 25 meals",
        "icon": "https://s3.example.com/badges/silver.png",
        "unlocked": false,
        "currentLevel": 0,
        "totalLevels": 3,
        "progressPercentage": 0
      }
    ],
    "summary": {
      "totalBadges": 10,
      "unlockedBadges": 3,
      "progressPercentage": 30
    }
  }
}
```

### GET /mobile/badges/summary
**Purpose:** Get lightweight badge summary (fast endpoint)  
**Called From:** Badge widgets  
**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBadges": 10,
      "unlockedBadges": 3,
      "progressPercentage": 30,
      "nextBadgeId": "badge-2",
      "pointsToNextBadge": 250
    }
  }
}
```

### GET /mobile/badges/next
**Purpose:** Get next badge information and progress toward it  
**Called From:** Badge progress widgets  
**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "badge-2",
    "name": "Silver",
    "description": "Complete 25 meals",
    "icon": "https://s3.example.com/badges/silver.png",
    "currentPoints": 250,
    "pointsNeeded": 500,
    "pointsToFinishCurrentBadge": 250,
    "progressPercentage": 50
  }
}
```

### GET /mobile/badges/{badgeId}
**Purpose:** Get detailed badge information  
**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "badge": {
      "id": "badge-1",
      "name": "Bronze",
      "description": "Complete 5 meals",
      "icon": "https://s3.example.com/badges/bronze.png",
      "unlocked": true,
      "currentLevel": 1,
      "totalLevels": 3,
      "progressPercentage": 50,
      "requirements": "Complete 5 meals per level",
      "rewards": "10 points per level"
    }
  }
}
```

### GET /progress/overview
**Purpose:** Fetch progress overview dashboard  
**Called From:** `src/screens/ProgressScreen.tsx`  
**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalProgress": 45,
    "weeklyProgress": 8,
    "mealsCompleted": 45,
    "mealsRemaining": 207,
    "streakDays": 12,
    "weight": 82,
    "weightGoal": 75,
    "weightChange": -3,
    "waistSize": 92,
    "measurements": [
      {
        "date": "2024-01-15",
        "weight": 85,
        "waistSize": 95
      }
    ]
  }
}
```

### GET /progress/detailed
**Purpose:** Fetch detailed progress data (for analytics)  
**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dailyProgress": [...],
    "weeklyProgress": [...],
    "monthlyProgress": [...],
    "trends": {...},
    "goals": {...}
  }
}
```

### GET /progress/historical?days={days}
**Purpose:** Fetch historical measurements  
**Query Parameters:**
- `days`: Number of days to fetch (default: 30)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "measurements": [
      {
        "date": "2024-01-17",
        "weight": 82.5,
        "waistSize": 91.5
      },
      {
        "date": "2024-01-16",
        "weight": 82.3,
        "waistSize": 91.8
      }
    ]
  }
}
```

---

## Measurements

### GET /onboarding/measurements
**Purpose:** Fetch user's measurement history  
**Called From:** `src/services/measurementsApi.ts` → `getMeasurements()`  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "measurements": [
      {
        "id": "measurement-uuid",
        "weight": 85,
        "waistSize": 95,
        "notes": "Initial measurement",
        "recordedAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

### POST /onboarding/measurements
**Purpose:** Add new measurement  
**Called From:** `src/services/measurementsApi.ts` → `addMeasurement()`  
**Request Body:**
```json
{
  "weight": 82,
  "waistSize": 92,
  "notes": "Weekly check-in"
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "measurement-uuid",
    "weight": 82,
    "waistSize": 92,
    "recordedAt": "2024-01-17T10:30:00Z"
  }
}
```

### PUT /onboarding/measurements/{measurementId}
**Purpose:** Update existing measurement  
**Request Body:**
```json
{
  "weight": 82.5,
  "waistSize": 91.8,
  "notes": "Updated after rechecking"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "measurement-uuid",
    "weight": 82.5,
    "waistSize": 91.8,
    "recordedAt": "2024-01-17T10:30:00Z"
  }
}
```

### DELETE /onboarding/measurements/{measurementId}
**Purpose:** Delete measurement  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Measurement deleted successfully"
}
```

---

## Progress Photos

### GET /progress-photos
**Purpose:** Fetch user's progress photos  
**Called From:** `src/services/progressPhotosApi.ts` → `getProgressPhotos()`  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "photo-uuid",
      "url": "https://s3.example.com/progress-photos/user-uuid/photo1.jpg",
      "title": "Week 1 - Front",
      "uploadedAt": "2024-01-15T10:00:00Z",
      "tags": ["front", "week-1"]
    }
  ]
}
```

### POST /progress-photos
**Purpose:** Upload new progress photo  
**Called From:** `src/services/progressPhotosApi.ts` → `addProgressPhoto()`  
**Request Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {firebaseIdToken}
```
**Form Data:**
- Field `photo`: Image file (JPEG, PNG, max 2MB)
- Field `title`: Photo title (optional)
- Field `tags`: Comma-separated tags (optional)

**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "photo-uuid",
    "url": "https://s3.example.com/progress-photos/user-uuid/photo1.jpg",
    "uploadedAt": "2024-01-17T10:30:00Z"
  }
}
```

### PUT /progress-photos/{photoId}
**Purpose:** Update progress photo metadata  
**Request Body:**
```json
{
  "title": "Week 4 - Front View",
  "tags": ["front", "week-4"]
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "photo-uuid",
    "title": "Week 4 - Front View",
    "tags": ["front", "week-4"]
  }
}
```

### DELETE /progress-photos/{photoId}
**Purpose:** Delete progress photo  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Photo deleted successfully"
}
```

---

## Moderation & Safety

### POST /moderation/reports
**Purpose:** Report UGC content (post, message, comment, user)  
**Called From:** `src/services/moderationApi.ts` → `reportPost/reportMessage/reportUser()`  
**Request Body:**
```json
{
  "reportedContentId": "post-uuid",
  "contentType": "post",
  "reason": "Inappropriate content",
  "description": "This post contains hate speech",
  "timestamp": 1705510200000
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "report-uuid",
    "reportedContentId": "post-uuid",
    "contentType": "post",
    "reason": "Inappropriate content",
    "status": "pending",
    "createdAt": "2024-01-17T10:30:00Z"
  }
}
```

### POST /moderation/blocks
**Purpose:** Block a user  
**Called From:** `src/services/moderationApi.ts` → `blockUser()`  
**Features:**
- ✅ Instant content filtering (posts/messages removed)
- ✅ Developer notification sent immediately
- ✅ Block persists across sessions
- ✅ Zero-tolerance enforcement

**Request Body:**
```json
{
  "blockedUserId": "user-to-block-uuid",
  "timestamp": 1705510200000
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "block-uuid",
    "blockedUserId": "user-to-block-uuid",
    "blockedAt": "2024-01-17T10:30:00Z"
  }
}
```

### POST /moderation/developer-alerts
**Purpose:** Alert moderation team when user is blocked  
**Called From:** `src/services/moderationApi.ts` (auto-triggered after blockUser)  
**Request Body:**
```json
{
  "type": "user_blocked",
  "blockedUserId": "user-uuid",
  "reason": "User blocked by another user",
  "timestamp": 1705510200000
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "alert-uuid",
    "type": "user_blocked",
    "blockedUserId": "user-uuid",
    "status": "pending_review",
    "createdAt": "2024-01-17T10:30:00Z"
  }
}
```

---

## Device Management

### POST /devices/register
**Purpose:** Register or update device information  
**Called From:** `src/services/deviceApi.ts` → `registerDevice()` (auto on auth)  
**Request Headers:**
```
Authorization: Bearer {firebaseIdToken}
```
**Request Body:**
```json
{
  "platform": "ios",
  "manufacturer": "Apple",
  "modelName": "iPhone 14 Pro",
  "osName": "iOS",
  "osVersion": "17.2",
  "buildNumber": "21C62",
  "deviceId": "device-uuid-from-expo",
  "deviceToken": "expo-push-notification-token"
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "device-registration-uuid",
    "platform": "ios",
    "modelName": "iPhone 14 Pro",
    "registeredAt": "2024-01-17T10:30:00Z"
  }
}
```

### GET /devices
**Purpose:** List all registered devices for user  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "device-uuid",
      "platform": "ios",
      "modelName": "iPhone 14 Pro",
      "lastSeen": "2024-01-17T14:22:00Z",
      "registeredAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### DELETE /devices/{deviceId}
**Purpose:** Remove registered device  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Device removed successfully"
}
```

---

## Notifications

### GET /notifications?page={page}&limit={limit}&unreadOnly={bool}
**Purpose:** Fetch user notifications  
**Called From:** `src/services/notificationsApi.ts` → `getNotifications()`  
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `unreadOnly`: Filter only unread (default: false)

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": "notification-uuid",
        "type": "meal_completed",
        "title": "Great job!",
        "message": "You completed today's meals",
        "metadata": {
          "mealId": "meal-uuid",
          "points": 10
        },
        "read": false,
        "readAt": null,
        "createdAt": "2024-01-17T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

### GET /notifications/unread/count
**Purpose:** Get unread notification count  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 5
  }
}
```

### PATCH /notifications/{notificationId}/read
**Purpose:** Mark single notification as read  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "notification-uuid",
    "read": true,
    "readAt": "2024-01-17T10:35:00Z"
  }
}
```

### PATCH /notifications/read/all
**Purpose:** Mark all notifications as read  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "All notifications marked as read"
}
```

### POST /notifications
**Purpose:** Create notification (internal use)  
**Request Body:**
```json
{
  "type": "achievement_unlocked",
  "title": "Badge Unlocked!",
  "message": "You unlocked the Bronze badge",
  "metadata": {
    "badgeId": "badge-uuid"
  }
}
```
**Expected Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "notification-uuid",
    "type": "achievement_unlocked",
    "createdAt": "2024-01-17T10:30:00Z"
  }
}
```

---

## Agenda & Content

### GET /content/agenda
**Purpose:** Fetch personalized agenda/schedule for user  
**Called From:** `src/services/agendaApi.ts` → `getAgenda()`  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "agenda": {
      "2024-01-17": [
        {
          "id": "content-uuid",
          "type": "content",
          "title": "Morning Motivation",
          "description": "Start your day with a motivational video",
          "thumbnailUrl": "https://s3.example.com/content/thumb1.jpg",
          "contentUrl": "https://video.example.com/morning-motivation",
          "points": 5,
          "author": "Sonia Kabanda",
          "assignedDate": "2024-01-17",
          "completed": false,
          "completedAt": null,
          "content": {...}
        },
        {
          "id": "rendezvous-uuid",
          "type": "rendezvous",
          "title": "Personal Coaching Session",
          "description": "Your scheduled 1-on-1 coaching session",
          "scheduledAt": "2024-01-17T18:00:00Z",
          "duration": 60,
          "coach": "Sonia Kabanda",
          "notes": "Discuss progress and adjustments"
        }
      ],
      "2024-01-18": [...]
    }
  }
}
```

### POST /content/{contentId}/complete
**Purpose:** Mark content as completed  
**Called From:** `src/services/agendaApi.ts` → `markContentComplete()`  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "content-uuid",
    "completed": true,
    "completedAt": "2024-01-17T10:30:00Z",
    "pointsEarned": 5
  }
}
```

---

## IAP & Payments

### POST /payments/validate-ios-receipt
*See Entitlements & Subscriptions section*

### POST /payments/validate-android-receipt
*See Entitlements & Subscriptions section*

### POST /payments/sync-subscription-status
**Purpose:** Sync subscription status from native store to backend  
**Request Body:**
```json
{
  "userId": "user-uuid",
  "platform": "ios"
}
```
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "subscriptionStatus": "ACTIVE",
    "expiresAt": "2024-02-15T23:59:59Z"
  }
}
```

---

## FAQ

### GET /faqs/public
**Purpose:** Fetch all publicly available FAQs  
**Called From:** `src/services/faqApi.ts` → `getFAQs()`  
**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "faq-uuid",
      "question": "How do I track my progress?",
      "answer": "You can track your progress in the Progress section...",
      "category": "Getting Started",
      "order": 1
    },
    {
      "id": "faq-uuid-2",
      "question": "Can I cancel my subscription?",
      "answer": "Yes, you can cancel anytime from Settings...",
      "category": "Subscription",
      "order": 2
    }
  ]
}
```

---

## Error Handling

### Standard Error Response Format

All endpoints follow this error response format:

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'email' is required",
    "details": {
      "field": "email",
      "rule": "required"
    }
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Example Scenario |
|------|---------|------------------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid Firebase token |
| 403 | Forbidden | User lacks permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Data conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side issue |

---

## Authentication Headers

All authenticated endpoints require:

```
Authorization: Bearer {firebaseIdToken}
```

Where `firebaseIdToken` is obtained from Firebase Authentication and automatically included via axios interceptor in `src/services/api.ts`.

---

## Response Formats

### Success Response (Standard)
```json
{
  "status": "success",
  "data": { /* endpoint-specific data */ }
}
```

### Alternative Success Response
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

## Integration Notes

### iOS Companion Mode
Several endpoints are **skipped on iOS** when `IOS_COMPANION_MODE = true`:
- `/entitlements` - Returns default (no access)
- `/nutrition/plans` - Skipped entirely
- `/subscriptions/current` - Skipped entirely
- Premium content endpoints
- Payment validation endpoints

### Rate Limiting
- Default rate limit: 1000 requests/hour per user
- 429 status code indicates rate limit exceeded
- Include `Retry-After` header in response

### Caching
- Profile data: Cached 30 minutes client-side
- Meal plans: Cached 5 minutes client-side
- Community posts: No caching (real-time)
- Achievements: Cached 5 minutes client-side

### Websocket Events (for real-time features)
*Optional: If implementing real-time updates*
- `chat.message_received`
- `chat.typing`
- `notification.new`
- `moderation.alert`

---

## Files Reference

### Service Implementations
- [entitlementsApi.ts](src/services/entitlementsApi.ts)
- [chatApi.ts](src/services/chatApi.ts)
- [communityApi.ts](src/services/communityApi.ts)
- [profileApi.ts](src/services/profileApi.ts)
- [nutritionApi.ts](src/services/nutritionApi.ts)
- [moderationApi.ts](src/services/moderationApi.ts)
- [measurementsApi.ts](src/services/measurementsApi.ts)
- [progressPhotosApi.ts](src/services/progressPhotosApi.ts)
- [deviceApi.ts](src/services/deviceApi.ts)
- [achievementsApi.ts](src/services/achievementsApi.ts)
- [badgeApi.ts](src/services/badgeApi.ts)
- [agendaApi.ts](src/services/agendaApi.ts)
- [onboardingApi.ts](src/services/onboardingApi.ts)
- [progressApi.ts](src/services/progressApi.ts)
- [notificationsApi.ts](src/services/notificationsApi.ts)
- [faqApi.ts](src/services/faqApi.ts)
- [iapReceiptApi.ts](src/services/iapReceiptApi.ts)

### Configuration
- [apiConfig.ts](src/config/apiConfig.ts) - Centralized endpoint definitions
- [env.ts](src/config/env.ts) - Environment configuration

### Interceptors & Middleware
- [api.ts](src/services/api.ts) - Axios instance with Firebase token injection and 401 retry logic

---

## Contact & Support

**For API questions or discrepancies:**
- Review the specific service file (e.g., `src/services/nutritionApi.ts`)
- Check `apiConfig.ts` for endpoint definitions
- Refer to comment blocks in service methods for implementation notes
- Contact: [Backend Team]

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 17, 2026 | Initial complete API contract documentation |

