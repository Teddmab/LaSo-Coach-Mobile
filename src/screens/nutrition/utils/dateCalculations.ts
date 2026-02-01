/**
 * Date Calculations for Nutrition Plans
 * Shared utilities for calculating plan days and finding menus
 */

/**
 * Calculate which day in the nutrition plan cycle based on calendar date
 * 
 * @param calendarDate - The selected calendar date
 * @param planStartDate - When the plan started (subscription start or plan start)
 * @param planNumDays - Total number of days in the plan cycle (e.g., 3, 7, 14, 21, 30)
 * @returns Plan day number (1-based)
 * 
 * @example
 * // 14-day plan starting Jan 1
 * calculatePlanDayFromDate(new Date('2026-01-08'), new Date('2026-01-01'), 14)
 * // Returns: 8
 * 
 * @example
 * // 3-day cycling plan starting Jan 1, checking Jan 4
 * calculatePlanDayFromDate(new Date('2026-01-04'), new Date('2026-01-01'), 3)
 * // Returns: 1 (cycles back)
 */
export function calculatePlanDayFromDate(
  calendarDate: Date,
  planStartDate: Date,
  planNumDays: number
): number {
  // Normalize dates to midnight for accurate day calculation
  const calDate = new Date(calendarDate);
  calDate.setHours(0, 0, 0, 0);
  
  const startDate = new Date(planStartDate);
  startDate.setHours(0, 0, 0, 0);
  
  // Calculate days elapsed since plan start
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysElapsed = Math.floor((calDate.getTime() - startDate.getTime()) / millisecondsPerDay);
  
  // Handle dates before plan start - return day 1
  if (daysElapsed < 0) {
    return 1;
  }
  
  // If plan has cycling (numDays is defined and > 0), use modulo
  if (planNumDays && planNumDays > 0) {
    // Calculate position in cycle (0-based, then convert to 1-based)
    const planDay = (daysElapsed % planNumDays) + 1;
    return planDay;
  }
  
  // If no cycling, days progress linearly (1, 2, 3, 4...)
  return daysElapsed + 1;
}

/**
 * Find the menu for a specific plan day from an array of menus
 * 
 * @param menus - Array of menu objects from the nutrition plan
 * @param planDay - The plan day number to find (1-based)
 * @returns The menu object that matches the plan day, or first menu as fallback, or null
 * 
 * @example
 * const menus = [{ day: 1, meals: [...] }, { day: 2, meals: [...] }]
 * findMenuForPlanDay(menus, 2)
 * // Returns: { day: 2, meals: [...] }
 */
export function findMenuForPlanDay(
  menus: any[] | undefined | null,
  planDay: number
): any | null {
  // Return null if no menus provided
  if (!menus || menus.length === 0) {
    return null;
  }
  
  // Try to find exact match for the plan day
  const matchedMenu = menus.find((menu: any) => menu.day === planDay);
  
  if (matchedMenu) {
    return matchedMenu;
  }
  
  // Fallback: return first menu if no exact match found
  // This handles cases where plan day is beyond available menus
  return menus[0];
}

/**
 * Calculate days elapsed since a start date
 * 
 * @param currentDate - The current/selected date
 * @param startDate - The reference start date
 * @returns Number of days elapsed (can be negative if currentDate is before startDate)
 */
export function calculateDaysElapsed(
  currentDate: Date,
  startDate: Date
): number {
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((current.getTime() - start.getTime()) / millisecondsPerDay);
}

/**
 * Get plan progress information
 * 
 * @param currentDate - The current/selected date
 * @param planStartDate - When the plan started
 * @param planNumDays - Total days in the plan cycle
 * @returns Object with progress information
 */
export function getPlanProgress(
  currentDate: Date,
  planStartDate: Date,
  planNumDays: number
): {
  daysElapsed: number;
  currentPlanDay: number;
  cycleNumber: number;
  progressInCycle: number; // 0-100 percentage
} {
  const daysElapsed = calculateDaysElapsed(currentDate, planStartDate);
  const currentPlanDay = calculatePlanDayFromDate(currentDate, planStartDate, planNumDays);
  
  // Calculate which cycle we're in (1st, 2nd, 3rd, etc.)
  const cycleNumber = Math.floor(daysElapsed / planNumDays) + 1;
  
  // Calculate progress percentage within current cycle
  const progressInCycle = planNumDays > 0 
    ? Math.round(((currentPlanDay - 1) / planNumDays) * 100)
    : 0;
  
  return {
    daysElapsed,
    currentPlanDay,
    cycleNumber,
    progressInCycle
  };
}
