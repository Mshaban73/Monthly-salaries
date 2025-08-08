// --- START OF FILE src/utils/fullAttendanceCalculator.ts (نسخة جديدة للمراجعة والتشخيص) ---

import { toYMDString } from './attendanceCalculator.ts';

type Employee = any; 
type BonusDeduction = any;
type AttendanceRecords = { [date: string]: { [employeeId: number]: { hours: number; locations: string[]; } } };
type PublicHoliday = { date: string; name: string; };

const dayNameToIndex: { [key: string]: number } = { 'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };

export const calculateAttendanceSummary = (employee: Employee, attendanceRecords: AttendanceRecords, publicHolidays: PublicHoliday[], payrollDays: Date[]) => {
  let actualAttendanceDays = 0;
  let totalRawOvertimeHours = 0;
  let totalOvertimeValue = 0;

  // تعريف قيم ثابتة من بيانات الموظف لتجنب الأخطاء
  const hoursInWorkDay = employee.hours_per_day || 8;
  const restDaysArray = employee.rest_days || [];
  const dailyRate = employee.salary_type === 'شهري' ? (employee.salary_amount / 30) : employee.salary_amount;
  const hourlyRate = dailyRate / hoursInWorkDay;
  
  // تعريف معاملات الأجر الإضافي
  const regularOvertimeRate = employee.overtime_rate_regular || 1.5;
  const holidayOvertimeRate = employee.overtime_rate_holiday || 2;
  const restDayOvertimeRate = employee.overtime_rate_friday || 2;

  payrollDays.forEach(day => {
    const dateStr = toYMDString(day);
    const record = attendanceRecords[dateStr]?.[employee.id];

    // تخطي اليوم إذا لم يكن هناك سجل حضور
    if (!record || record.hours <= 0) {
      return;
    }

    actualAttendanceDays++;
    
    const dayOfWeekJS = day.getUTCDay();
    const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeekJS) || '';
    
    const isHoliday = publicHolidays.some(h => h.date === dateStr);
    const isRestDay = restDaysArray.includes(dayNameArabic);
    
    let overtimeHoursThisDay = 0;
    let overtimePayThisDay = 0;

    if (isHoliday) {
      // 1. حساب إضافي العطلات
      overtimeHoursThisDay = record.hours;
      overtimePayThisDay = overtimeHoursThisDay * holidayOvertimeRate * hourlyRate;
    } else if (isRestDay) {
      // 2. حساب إضافي أيام الراحة
      overtimeHoursThisDay = record.hours;
      overtimePayThisDay = overtimeHoursThisDay * restDayOvertimeRate * hourlyRate;
    } else {
      // 3. حساب إضافي أيام العمل العادية (بما في ذلك الخميس)
      let workHoursLimit = hoursInWorkDay; // ساعات العمل العادية
      
      // حالة خاصة بالخميس لموظفي الإدارة
      if (dayNameArabic === 'الخميس' && employee.is_head_office) {
        workHoursLimit = 3;
      }
      
      overtimeHoursThisDay = Math.max(0, record.hours - workHoursLimit);
      overtimePayThisDay = overtimeHoursThisDay * regularOvertimeRate * hourlyRate;
    }

    // تجميع النتائج النهائية
    totalRawOvertimeHours += overtimeHoursThisDay;
    totalOvertimeValue += overtimePayThisDay;
  });
  
  // حساب مكافئ أيام الإضافي
  const overtimeDaysCount = totalRawOvertimeHours / hoursInWorkDay;

  return { 
    actualAttendanceDays, 
    totalOvertimeValue, 
    totalRawOvertimeHours,
    overtimeDaysCount 
  };
};


// ... باقي الدوال في الملف تبقى كما هي (بدون تغيير) ...
export const calculateLocationSummary = (employee: Employee, attendanceRecords: AttendanceRecords, payrollDays: Date[]) => {
  const summary: { [key: string]: number } = {};
  payrollDays.forEach(day => {
      const dateStr = toYMDString(day);
      const record = attendanceRecords[dateStr]?.[employee.id];
      if (record?.hours && record.hours > 0) {
          const locations = record.locations && record.locations.length > 0 ? record.locations : [employee.work_location || 'غير محدد'];
          locations.forEach(location => {
            summary[location] = (summary[location] || 0) + (1 / locations.length);
          });
      }
  });
  return summary;
};
export const calculateCostDistribution = (
    employee: Employee, 
    attendanceRecords: AttendanceRecords, 
    payrollDays: Date[], 
    bonuses: BonusDeduction[], 
    excludedEmployees: Set<number>, 
    generalBonusDays: number, 
    totalOvertimePay: number, 
    loanInstallment: number
) => {
    const distribution: { [location: string]: any } = {};
    const locationSummary = calculateLocationSummary(employee, attendanceRecords, payrollDays);
    const totalWorkDays = Object.values(locationSummary).reduce((sum: number, days: number) => sum + days, 0);

    if (totalWorkDays === 0 && employee.salary_type === 'شهري') {
        const location = employee.work_location || 'غير محدد';
        distribution[location] = { days: 0, baseCost: employee.salary_amount, allowancesCost: 0, otherAdditions: 0, totalDeductions: 0, netCost: employee.salary_amount };
        return distribution;
    }

    Object.entries(locationSummary).forEach(([location, days]) => {
        const daysRatio = totalWorkDays > 0 ? (days / totalWorkDays) : 0;
        const bdRecord = bonuses.find(r => r.employee_id === employee.id);
        const dailyRate = employee.salary_type === 'شهري' ? (employee.salary_amount / 30) : employee.salary_amount;
        
        const baseCost = employee.salary_type === 'يومي' ? (days * dailyRate) : (employee.salary_amount * daysRatio);
        
        const allowancesCost = [employee.transport_allowance, employee.expatriation_allowance, employee.meal_allowance, employee.housing_allowance]
            .reduce((acc, allowance) => {
                if (!allowance) return acc;
                const amount = (allowance.type === 'يومي' ? allowance.amount * days : (allowance.amount * daysRatio));
                return acc + amount;
            }, 0);
        
        const manualBonus = (bdRecord?.bonus_amount || 0) * daysRatio;
        const generalBonusValue = excludedEmployees.has(employee.id) ? 0 : (generalBonusDays * dailyRate * daysRatio);
        const otherAdditions = manualBonus + generalBonusValue + (totalOvertimePay * daysRatio);

        const manualDeduction = (bdRecord?.deduction_amount || 0) * daysRatio;
        const distributedLoanInstallment = loanInstallment * daysRatio;
        const totalDeductions = manualDeduction + distributedLoanInstallment;
        
        const netCost = baseCost + allowancesCost + otherAdditions - totalDeductions;
        
        distribution[location] = { days, baseCost, allowancesCost, otherAdditions, totalDeductions, netCost };
    });

    return distribution;
};