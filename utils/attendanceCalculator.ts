// --- START OF FILE src/utils/attendanceCalculator.ts (النسخة النهائية والمعدلة) ---

import type { Employee, AttendanceRecords, PublicHoliday, Loan, BonusDeductionState, GeneralBonusesState, Allowance } from '../App';

const dayNameToIndex: { [key: string]: number } = { 'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };
const OVERTIME_RATES = { WEEKDAY: 1.5, REST_DAY: 2.0, HOLIDAY_BASE: 16 };
const THURSDAY_STANDARD_HOURS = { ADMIN: 3, SITES: 4 };

export function getPayrollDays(year: number, month: number): Date[] {
    const days: Date[] = [];
    const startDate = new Date(Date.UTC(year, month - 2, 26));
    const endDate = new Date(Date.UTC(year, month - 1, 25));
    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
        days.push(new Date(d));
    }
    return days;
}

export const getYearsList = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);
};

export const getMonthsList = () => {
    return Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        name: new Date(2000, i, 1).toLocaleString('ar', { month: 'long' })
    }));
};

export const toYMDString = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export interface AttendanceSummary { actualAttendanceDays: number; weekdayOvertime: { rawHours: number, calculatedValue: number }; thursdayOvertime: { rawHours: number, calculatedValue: number }; restDayOvertime: { rawHours: number, calculatedValue: number }; holidayOvertime: { rawHours: number, calculatedValue: number }; totalOvertimeValue: number; totalRawOvertimeHours: number; } // -- إضافة totalRawOvertimeHours
export function calculateAttendanceSummary(employee: Employee, attendanceRecords: AttendanceRecords, publicHolidays: PublicHoliday[], payrollDays: Date[]): AttendanceSummary {
    const summary: AttendanceSummary = { actualAttendanceDays: 0, weekdayOvertime: { rawHours: 0, calculatedValue: 0 }, thursdayOvertime: { rawHours: 0, calculatedValue: 0 }, restDayOvertime: { rawHours: 0, calculatedValue: 0 }, holidayOvertime: { rawHours: 0, calculatedValue: 0 }, totalOvertimeValue: 0, totalRawOvertimeHours: 0 };
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
    summary.totalRawOvertimeHours = summary.weekdayOvertime.rawHours + summary.thursdayOvertime.rawHours + summary.restDayOvertime.rawHours + summary.holidayOvertime.rawHours; // -- حساب إجمالي الساعات الفعلية
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

// --- تعديل الواجهة لإضافة ساعات الإضافي ---
export interface LocationCostDetails { 
    days: number;
    overtimeHours: number; // --- الحقل الجديد ---
    baseCost: number;
    allowancesCost: number;
    otherAdditions: number;
    totalDeductions: number;
    netCost: number;
}
export interface EmployeeCostDistribution { [locationName: string]: LocationCostDetails; }

// --- تعديل الدالة لإضافة حساب ساعات الإضافي ---
export function calculateCostDistribution(employee: Employee, attendanceRecords: AttendanceRecords, publicHolidays: PublicHoliday[], payrollDays: Date[], bonuses: BonusDeductionState, deductions: BonusDeductionState, loans: Loan[], generalBonuses: GeneralBonusesState, periodKey: string): EmployeeCostDistribution {
  const distribution: EmployeeCostDistribution = {};
  const locationSummary = calculateLocationSummary(employee, attendanceRecords, payrollDays);
  const totalDaysWorked = Object.values(locationSummary).reduce((sum, days) => sum + days, 0);
  
  if (totalDaysWorked === 0 && employee.salaryType !== 'شهري') {
    return {};
  }

  const summary = calculateAttendanceSummary(employee, attendanceRecords, publicHolidays, payrollDays);
  const dailyRate = employee.salaryType === 'شهري' ? (employee.salaryAmount / 30) : employee.salaryAmount;
  const hourlyRate = dailyRate / 8;
  
  const calculateAllowance = (allowance: Allowance | undefined) => {
      if (!allowance) return 0;
      if (allowance.type === 'يومي') {
        return allowance.amount * summary.actualAttendanceDays;
      }
      return allowance.amount;
  };
  
  const basePayTotal = employee.salaryType === 'يومي' ? summary.actualAttendanceDays * dailyRate : employee.salaryAmount;
  const totalAllowances = calculateAllowance(employee.transportAllowance) + calculateAllowance(employee.expatriationAllowance) + calculateAllowance(employee.mealAllowance) + calculateAllowance(employee.housingAllowance);
  const totalOvertimePay = summary.totalOvertimeValue * hourlyRate;
  const manualBonus = bonuses[employee.id] || 0;
  const bonusDays = Number(generalBonuses[periodKey] || '0');
  const generalBonusValue = (employee.salaryType === 'يومي' ? bonusDays * employee.salaryAmount : bonusDays * (employee.salaryAmount / 30));
  
  const totalOtherAdditions = totalOvertimePay + manualBonus + generalBonusValue;

  const manualDeduction = deductions[employee.id] || 0;
  let loanInstallment = 0;
  const [year, month] = periodKey.split('-').map(Number);
  const activeLoan = loans.find(loan => { if (loan.employeeId !== employee.id) return false; const [startYear, startMonth] = loan.startDate.split('-').map(Number); const startDate = new Date(startYear, startMonth - 1); const endDate = new Date(startYear, startMonth - 1 + loan.installments); const currentPeriodDate = new Date(year, month - 1); return currentPeriodDate >= startDate && currentPeriodDate < endDate; });
  if (activeLoan) { loanInstallment = activeLoan.totalAmount / activeLoan.installments; }

  const totalDeductionsValue = manualDeduction + loanInstallment;

  if (totalDaysWorked > 0) {
    for (const location in locationSummary) {
        const locationDays = locationSummary[location];
        const percentage = locationDays / totalDaysWorked;
        
        const locationBaseCost = basePayTotal * percentage;
        const locationAllowancesCost = totalAllowances * percentage;
        const locationOtherAdditions = totalOtherAdditions * percentage;
        const locationTotalDeductions = totalDeductionsValue * percentage;

        distribution[location] = {
            days: locationDays,
            overtimeHours: summary.totalRawOvertimeHours * percentage, // <-- توزيع الساعات الإضافية
            baseCost: locationBaseCost,
            allowancesCost: locationAllowancesCost,
            otherAdditions: locationOtherAdditions,
            totalDeductions: locationTotalDeductions,
            netCost: (locationBaseCost + locationAllowancesCost + locationOtherAdditions) - locationTotalDeductions,
        };
    }
  } else if (employee.salaryType === 'شهري') {
    const location = employee.workLocation || 'غير محدد';
    distribution[location] = {
        days: 0,
        overtimeHours: 0, // <-- لا يوجد ساعات إضافية في حالة عدم الحضور
        baseCost: basePayTotal,
        allowancesCost: totalAllowances,
        otherAdditions: totalOtherAdditions,
        totalDeductions: totalDeductionsValue,
        netCost: (basePayTotal + totalAllowances + totalOtherAdditions) - totalDeductionsValue,
    };
  }
  
  return distribution;
}