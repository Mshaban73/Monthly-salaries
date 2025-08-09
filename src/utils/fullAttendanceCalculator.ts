// --- START OF FILE src/utils/fullAttendanceCalculator.ts (النسخة النهائية بالمنطق الصحيح 100%) ---

import { toYMDString } from './attendanceCalculator.ts';

type Employee = any;
type BonusDeduction = any;
type AttendanceRecords = { [date: string]: { [employeeId: number]: { hours: number; locations: string[]; } } };
type PublicHoliday = { date: string; name: string; };

const dayNameToIndex: { [key: string]: number } = { 'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };

export const calculateAttendanceSummary = (employee: Employee, attendanceRecords: AttendanceRecords, publicHolidays: PublicHoliday[], payrollDays: Date[]) => {
  let actualAttendanceDays = 0;
  
  let weekdayOvertime = { rawHours: 0, calculatedValue: 0 };
  let thursdayOvertime = { rawHours: 0, calculatedValue: 0 };
  let restDayOvertime = { rawHours: 0, calculatedValue: 0 };
  let holidayOvertime = { rawHours: 0, calculatedValue: 0 };
  let totalRawOvertimeHours = 0;

  const hoursInWorkDay = employee.hours_per_day || 8;
  const dailyRate = employee.salary_type === 'شهري' ? (employee.salary_amount / 30) : employee.salary_amount;
  const hourlyRate = dailyRate / hoursInWorkDay;
  
  const regularOvertimeRate = employee.overtime_rate_regular || 1.5;
  const holidayOvertimeRate = employee.overtime_rate_holiday || 2;
  const restDayOvertimeRate = employee.overtime_rate_friday || 2;

  payrollDays.forEach(day => {
    const dateStr = toYMDString(day);
    const record = attendanceRecords[dateStr]?.[employee.id];

    if (!record || record.hours <= 0) {
      return;
    }

    actualAttendanceDays++;
    
    const dayOfWeekJS = day.getUTCDay();
    const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeekJS) || '';
    
    const isHoliday = publicHolidays.some(h => h.date === dateStr);
    const isRestDay = (employee.rest_days || []).includes(dayNameArabic);

    if (isHoliday) {
      holidayOvertime.rawHours += record.hours;
      holidayOvertime.calculatedValue += record.hours * holidayOvertimeRate;
    } else if (isRestDay) {
      restDayOvertime.rawHours += record.hours;
      restDayOvertime.calculatedValue += record.hours * restDayOvertimeRate;
    } else {
      let workHoursLimit = hoursInWorkDay;
      if (dayNameArabic === 'الخميس' && employee.is_head_office) {
        workHoursLimit = 3;
      }
      
      const overtimeHours = Math.max(0, record.hours - workHoursLimit);
      if (dayNameArabic === 'الخميس' && employee.is_head_office) {
          thursdayOvertime.rawHours += overtimeHours;
          thursdayOvertime.calculatedValue += overtimeHours * regularOvertimeRate;
      } else {
          weekdayOvertime.rawHours += overtimeHours;
          weekdayOvertime.calculatedValue += overtimeHours * regularOvertimeRate;
      }
    }
  });

  const totalOvertimeValueInCalculatedHours = (weekdayOvertime.calculatedValue + thursdayOvertime.calculatedValue + restDayOvertime.calculatedValue + holidayOvertime.calculatedValue);
  const totalOvertimeValue = totalOvertimeValueInCalculatedHours * hourlyRate;
  
  totalRawOvertimeHours = weekdayOvertime.rawHours + thursdayOvertime.rawHours + restDayOvertime.rawHours + holidayOvertime.rawHours;

  // --- التعديل النهائي والحاسم هنا ---
  // نجمع الساعات "المحسوبة" (الموزونة) بدلاً من الساعات الخام
  const overtimeDaysCount = totalOvertimeValueInCalculatedHours / hoursInWorkDay;
  // --- نهاية التعديل ---

  return { 
    actualAttendanceDays, 
    weekdayOvertime, 
    thursdayOvertime, 
    restDayOvertime, 
    holidayOvertime, 
    totalOvertimeValue, 
    totalRawOvertimeHours,
    overtimeDaysCount 
  };
};

// ... باقي الدوال في الملف تبقى كما هي ...
export const calculateLocationSummary = (employee: Employee, attendanceRecords: AttendanceRecords, payrollDays: Date[]) => {
  const summary: { [key: string]: number } = {};
  payrollDays.forEach(day => { /* ... */ });
  return summary;
};
export const calculateCostDistribution = (employee: Employee, /* ... */ ) => {
    const distribution: { [location: string]: any } = {};
    /* ... */
    return distribution;
};