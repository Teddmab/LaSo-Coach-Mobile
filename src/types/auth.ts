// Types d'authentification

export interface UserProfile {
  initialWeight?: number;
  goalWeight?: number;
  currentPhase?: string;
  hasActiveSubscription?: boolean;
  height?: number;
  targetWeight?: number;
  targetWaistSize?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  region?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
  onboardingCompleted?: boolean;
  currentStep?: string;
  uid?: string;
  emailVerified?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  authReady: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  region?: string;
  language?: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data: {
    emailSent: boolean;
  };
}

export interface VerifyResetTokenResponse {
  success: boolean;
  message: string;
  data: {
    isValid: boolean;
    email: string;
  };
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
  };
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  region?: string;
  language?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  loginWithGoogle: (idToken: string) => Promise<{ user: User | null; error: string | null }>;
  registerWithGoogle: (idToken: string) => Promise<{ user: User | null; error: string | null }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  refreshProfile: () => Promise<User | null>;
  forgotPassword: (email: string) => Promise<void>;
  verifyResetToken: (token: string) => Promise<VerifyResetTokenResponse>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (profileData: ProfileUpdateData) => Promise<User>;
}

