/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [phone]
 * @property {string} [avatar]
 * @property {string[]} [dietaryRestrictions]
 * @property {boolean} onboardingCompleted
 * @property {string} [currentStep] - "Test" | "Attaque" | "Croisière" | "Stabilisation" | "Consolidation" | "Confirmation"
 * @property {UserProfile} [profile]
 * @property {string} createdAt
 * @property {string} updatedAt
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
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {string} [role]
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} token
 * @property {string} refreshToken
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [avatar]
 * @property {boolean} onboardingCompleted
 * @property {string} [currentStep]
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
 * @property {(email: string, password: string) => Promise<User>} login
 * @property {() => Promise<void>} logout
 * @property {(userData: RegisterData) => Promise<void>} register
 * @property {() => Promise<User | null>} refreshProfile
 * @property {(email: string) => Promise<void>} forgotPassword
 */

export {}; 