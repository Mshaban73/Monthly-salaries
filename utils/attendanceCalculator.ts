// --- START OF FILE src/utils/attendanceCalculator.ts ---

import type { Employee, AttendanceRecords, PublicHoliday } from '../App';

const dayNameToIndex: { [key: string]: number } = { 'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };
const OVERTIME_RATES = { WEEKDAY: 1.5, REST_DAY: 2.0, HOLIDAY_BASE: 16 };
const THURSDAY_STANDARD_HOURS = { ADMIN: 3, SITES: 4 };
export function getPayrollDays(year: number, month: number): Date[] { const days: Date[] = []; const startDate = new Date(Date.UTC(year, month - 2, 26)); const endDate = new Date(Date.UTC(year, month - 1, 25)); for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) { days.push(new Date(d)); } return days; }
export const getYearsList = (): number[] => { const currentYear = new Date().getFullYear(); return Array.from({ length: 6 }, (_, i) => currentYear + 1 - i); };
export const getMonthsList = () => { return Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(2000, i, 1).toLocaleString('ar', { month: 'long' }) })); };
export const toYMDString = (date: Date): string => { const year = date.getUTCFullYear(); const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); const day = date.getUTCDate().toString().padStart(2, '0'); return `${year}-${month}-${day}`; };

// --- تعديل: إعادة المحتوى الكامل للدالة ---
export interface AttendanceSummary { actualAttendanceDays: number; weekdayOvertime: { rawHours: number, calculatedValue: number }; thursdayOvertime: { rawHours: number, calculatedValue: number }; restDayOvertime: { rawHours: number, calculatedValue: number }; holidayOvertime: { rawHours: number, calculatedValue: number }; totalOvertimeValue: number; }
export function calculateAttendanceSummary(employee: Employee, attendanceRecords: AttendanceRecords, publicHolidays: PublicHoliday[], payrollDays: Date[]): AttendanceSummary {
    const summary: AttendanceSummary = { actualAttendanceDays: 0, weekdayOvertime: { rawHours: 0, calculatedValue: 0 }, thursdayOvertime: { rawHours: 0, calculatedValue: 0 }, restDayOvertime: { rawHours: 0, calculatedValue: 0 }, holidayOvertime: { rawHours: 0, calculatedValue: 0 }, totalOvertimeValue: 0 };
    const getThursdayStandardHours = (emp: Employee) => emp.isHeadOffice ? THURSDAY_STANDARD_HOURS.ADMIN : THURSDAY_STANDARD_HOURS.SITES;

    payrollDays.forEach(day => {
        const dateStr = toYMDString(day);
        const record = attendanceRecords[dateStr]?.[employee.id];
        const recordedHours = record?.hours;

        if (!recordedHours || recordedHours <= 0) { return; }

        summary.actualAttendanceDays += 1;
        const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === day.getUTCDay()) || '';
        const isRestDay = employee.restDays.includes(dayNameArabic);
        const isHoliday = publicHolidays.some(h => h.date === dateStr);
        
        if (isHoliday) {
            if (employee.salaryType === 'شهري') { summary.holidayOvertime.rawHours += recordedHours; summary.holidayOvertime.calculatedValue += OVERTIME_RATES.HOLIDAY_BASE; }
            else if (isRestDay) { summary.restDayOvertime.rawHours += recordedHours; summary.restDayOvertime.calculatedValue += recordedHours * OVERTIME_RATES.REST_DAY; }
            else {
                let standardHours = dayNameArabic === 'الخميس' ? getThursdayStandardHours(employee) : employee.hoursPerDay;
                const overtime = Math.max(0, recordedHours - standardHours);
                if (overtime > 0) {
                    if (dayNameArabic === 'الخميس') { summary.thursdayOvertime.rawHours += overtime; summary.thursdayOvertime.calculatedValue += overtime * OVERTIME_RATES.WEEKDAY; }
                    else { summary.weekdayOvertime.rawHours += overtime; summary.weekdayOvertime.calculatedValue += overtime * OVERTIME_RATES.WEEKDAY; }
                }
            }
        } else if (isRestDay) { summary.restDayOvertime.rawHours += recordedHours; summary.restDayOvertime.calculatedValue += recordedHours * OVERTIME_RATES.REST_DAY; }
        else if (dayNameArabic === 'الخميس') { const standardHours = getThursdayStandardHours(employee); const overtime = Math.max(0, recordedHours - standardHours); if (overtime > 0) { summary.thursdayOvertime.rawHours += overtime; summary.thursdayOvertime.calculatedValue += overtime * OVERTIME_RATES.WEEKDAY; } }
        else { const overtime = Math.max(0, recordedHours - employee.hoursPerDay); if (overtime > 0) { summary.weekdayOvertime.rawHours += overtime; summary.weekdayOvertime.calculatedValue += overtime * OVERTIME_RATES.WEEKDAY; } }
    });
    summary.totalOvertimeValue = summary.weekdayOvertime.calculatedValue + summary.thursdayOvertime.calculatedValue + summary.restDayOvertime.calculatedValue + summary.holidayOvertime.calculatedValue;
    return summary;
}

export interface LocationSummary { [locationName: string]: number; }
export function calculateLocationSummary(employee: Employee, attendanceRecords: AttendanceRecords, payrollDays: Date[]): LocationSummary {
    const locationCounts: LocationSummary = {};
    payrollDays.forEach(day => {
        const dateStr = toYMDString(day);
        const record = attendanceRecords[dateStr]?.[employee.id];
        if (record && record.hours > 0) {
            const locationForDay = record.location || employee.workLocation || 'غير محدد';
            locationCounts[locationForDay] = (locationCounts[locationForDay] || 0) + 1;
        }
    });
    return locationCounts;
}

export interface LocationCostDetails { basePay: number; overtimePay: number; totalCost: number; days: number; }
export interface EmployeeCostDistribution { [locationName: string]: LocationCostDetails; }
export function calculateCostDistribution(employee: Employee, attendanceRecords: AttendanceRecords, publicHolidays: PublicHoliday[], payrollDays: Date[]): EmployeeCostDistribution {
  const distribution: EmployeeCostDistribution = {};
  const dailyRate = employee.salaryType === 'شهري' ? (employee.salaryAmount / 30) : employee.salaryAmount;
  const hourlyRate = dailyRate / 8;
  const getThursdayStandardHours = (emp: Employee) => emp.isHeadOffice ? THURSDAY_STANDARD_HOURS.ADMIN : THURSDAY_STANDARD_HOURS.SITES;

  payrollDays.forEach(day => {
    const dateStr = toYMDString(day);
    const record = attendanceRecords[dateStr]?.[employee.id];
    const recordedHours = record?.hours;

    if (!recordedHours || recordedHours <= 0) return;

    const location = record?.location || employee.workLocation || 'غير محدد';
    if (!distribution[location]) { distribution[location] = { basePay: 0, overtimePay: 0, totalCost: 0, days: 0 }; }

    distribution[location].days += 1;
    let dailyBasePay = 0;
    let dailyOvertimePay = 0;
    
    if(employee.salaryType === 'يومي') { dailyBasePay = dailyRate; }
    
    const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === day.getUTCDay()) || '';
    const isRestDay = employee.restDays.includes(dayNameArabic);
    const isHoliday = publicHolidays.some(h => h.date === dateStr);
    let overtimeHoursCalculated = 0;

    if (isHoliday) {
      if (employee.salaryType === 'شهري') { overtimeHoursCalculated = OVERTIME_RATES.HOLIDAY_BASE; } 
      else if (isRestDay) { overtimeHoursCalculated = recordedHours * OVERTIME_RATES.REST_DAY; }
    } else if (isRestDay) {
      overtimeHoursCalculated = recordedHours * OVERTIME_RATES.REST_DAY;
    } else {
      const standardHours = dayNameArabic === 'الخميس' ? getThursdayStandardHours(employee) : employee.hoursPerDay;
      const overtimeRaw = Math.max(0, recordedHours - standardHours);
      if (overtimeRaw > 0) { overtimeHoursCalculated = overtimeRaw * OVERTIME_RATES.WEEKDAY; }
    }

    dailyOvertimePay = overtimeHoursCalculated * hourlyRate;
    distribution[location].basePay += dailyBasePay;
    distribution[location].overtimePay += dailyOvertimePay;
    distribution[location].totalCost = distribution[location].basePay + distribution[location].overtimePay;
  });

  if (employee.salaryType === 'شهري') {
    const totalDaysWorked = Object.values(distribution).reduce((sum, loc) => sum + loc.days, 0);
    if(totalDaysWorked > 0){
        Object.keys(distribution).forEach(location => {
            const locationDays = distribution[location].days;
            const proratedBasePay = (employee.salaryAmount / totalDaysWorked) * locationDays;
            distribution[location].basePay = proratedBasePay;
            distribution[location].totalCost = distribution[location].basePay + distribution[location].overtimePay;
        });
    }
  }

  return distribution;
}