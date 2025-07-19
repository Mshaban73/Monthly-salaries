// --- START OF FILE src/utils/attendanceCalculator.ts ---

import type { Employee, AttendanceRecords, PublicHoliday } from '../App';

const dayNameToIndex: { [key: string]: number } = { 'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };
const OVERTIME_RATES = { WEEKDAY: 1.5, REST_DAY: 2.0, HOLIDAY_BASE: 16 };
const THURSDAY_STANDARD_HOURS = { ADMIN: 3, SITES: 4 };

// --- تعديل: إنشاء دالة موحدة ودقيقة لحساب أيام كشف الراتب ---
export function getPayrollDays(year: number, month: number): Date[] {
    const days: Date[] = [];
    // نبدأ من اليوم 26 من الشهر قبل السابق
    // ملاحظة: شهر جافاسكريبت يبدأ من 0، لذا month - 2 صحيح
    const startDate = new Date(Date.UTC(year, month - 2, 26));
    
    // ننتهي في اليوم 25 من الشهر المحدد
    const endDate = new Date(Date.UTC(year, month - 1, 25));

    // نستخدم حلقة آمنة تتجنب مشاكل التوقيت الصيفي
    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
        days.push(new Date(d));
    }
    return days;
}

// --- تعديل: إنشاء دالة موحدة لإنشاء قائمة السنوات الديناميكية ---
export const getYearsList = (): number[] => {
    const currentYear = new Date().getFullYear();
    // نعرض السنة الحالية، سنة قادمة، و4 سنوات سابقة
    return Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);
};

// --- تعديل: إنشاء دالة موحدة لإنشاء قائمة الأشهر ---
export const getMonthsList = () => {
    return Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        name: new Date(2000, i, 1).toLocaleString('ar', { month: 'long' })
    }));
};

// --- تعديل: دالة تحويل التاريخ إلى نص بشكل آمن وموحد ---
export const toYMDString = (date: Date): string => {
    // هذه الدالة تتجاهل المنطقة الزمنية وتأخذ التاريخ كما هو
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export interface AttendanceSummary { actualAttendanceDays: number; weekdayOvertime: { rawHours: number, calculatedValue: number }; thursdayOvertime: { rawHours: number, calculatedValue: number }; restDayOvertime: { rawHours: number, calculatedValue: number }; holidayOvertime: { rawHours: number, calculatedValue: number }; totalOvertimeValue: number; }

export function calculateAttendanceSummary(employee: Employee, attendanceRecords: AttendanceRecords, publicHolidays: PublicHoliday[], payrollDays: Date[]): AttendanceSummary {
    const summary: AttendanceSummary = { actualAttendanceDays: 0, weekdayOvertime: { rawHours: 0, calculatedValue: 0 }, thursdayOvertime: { rawHours: 0, calculatedValue: 0 }, restDayOvertime: { rawHours: 0, calculatedValue: 0 }, holidayOvertime: { rawHours: 0, calculatedValue: 0 }, totalOvertimeValue: 0 };
    const getThursdayStandardHours = (emp: Employee) => emp.isHeadOffice ? THURSDAY_STANDARD_HOURS.ADMIN : THURSDAY_STANDARD_HOURS.SITES;

    payrollDays.forEach(day => {
        // --- تعديل: استخدام دالة toYMDString الموحدة ---
        const dateStr = toYMDString(day);
        const recordedHours = attendanceRecords[dateStr]?.[employee.id];
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