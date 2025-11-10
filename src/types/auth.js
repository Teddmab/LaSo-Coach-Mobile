/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} role
 * @property {string} status
 * @property {boolean} isActive
 * @property {boolean} isVerified
 * @property {string} [avatar]
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [phoneNumber]
 * @property {string} [address]
 * @property {string} [region]
 * @property {string} [language]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {UserProfile} [profile]
 */

/**
 * @typedef {Object} UserProfile
 * @property {number} [initialWeight]
 * @property {number} [goalWeight]
 * @property {string} [currentPhase]
 * @property {boolean} [hasActiveSubscription]
 */

/**
 * @typedef {Object} AuthState
 * @property {User | null} user
 * @property {string | null} token
 * @property {string | null} refreshToken
 * @property {boolean} isAuthenticated
 * @property {boolean} loading
 * @property {boolean} authReady
 */

/**
 * @typedef {Object} LoginData
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} RegisterData
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} password
 * @property {string} [phoneNumber]
 * @property {string} [address]
 * @property {string} [region]
 * @property {string} [language]
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} role
 * @property {string} token
 * @property {string} status
 * @property {boolean} isActive
 * @property {boolean} isVerified
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {UserProfile} [profile]
 */

/**
 * @typedef {Object} RegisterResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} data
 * @property {User} data.user
 * @property {string} data.token
 * @property {string} data.refreshToken
 */

/**
 * @typedef {Object} ForgotPasswordResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} data
 * @property {boolean} data.emailSent
 */

/**
 * @typedef {Object} VerifyResetTokenResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} data
 * @property {boolean} data.isValid
 * @property {string} data.email
 */

/**
 * @typedef {Object} ResetPasswordResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} data
 * @property {User} data.user
 */

/**
 * @typedef {Object} RefreshTokenResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} data
 * @property {string} data.token
 * @property {string} data.refreshToken
 */

/**
 * @typedef {Object} ProfileUpdateData
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [phoneNumber]
 * @property {string} [address]
 * @property {string} [region]
 * @property {string} [language]
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} [message]
 * @property {any} [data]
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User | null} user
 * @property {boolean} loading
 * @property {boolean} isAuthenticated
 * @property {boolean} authReady
 * @property {(email: string, password: string) => Promise<{user: User | null, error: string | null}>} login
 * @property {(idToken: string) => Promise<{user: User | null, error: string | null}>} loginWithGoogle
 * @property {() => Promise<void>} logout
 * @property {(userData: RegisterData) => Promise<void>} register
 * @property {() => Promise<User | null>} refreshProfile
 * @property {(email: string) => Promise<void>} forgotPassword
 * @property {(token: string) => Promise<VerifyResetTokenResponse>} verifyResetToken
 * @property {(token: string, newPassword: string) => Promise<void>} resetPassword
 * @property {(profileData: ProfileUpdateData) => Promise<User>} updateProfile
 */

export {}; 