import type { Employee, AttendanceRecords, PublicHoliday } from '../App';

export const dayNameToIndex = {
    'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6
};

export interface PayrollReport {
    employee: Employee;
    basePay: number;
    totalOvertimePay: number;
    bonus: number;
    deduction: number;
    netSalary: number;
    previousDue: number;
    details: {
        daysWorked: number;
        totalOvertimeHours: number;
        regularWorkDaysForDaily: number;
        overtimeDays: number;
    };
}

export function calculatePayroll(
    employees: Employee[],
    attendanceRecords: AttendanceRecords,
    month: number,
    year: number,
    monthlyVariables: { [key: string]: { bonus: number; deduction: number; previousDue?: number } },
    publicHolidays: PublicHoliday[]
): PayrollReport[] {
    const report: PayrollReport[] = [];

    employees.forEach(employee => {
        const hourlyRate = employee.salaryType === 'يومي'
            ? employee.salaryAmount / 8
            : (employee.salaryAmount / 30) / 8;

        let totalOvertimeHours = 0;
        let daysWorked = 0;
        let overtimeDays = 0;
        let regularWorkDaysForDaily = 0;

        const startDate = new Date(year, month - 2, 26);
        const endDate = new Date(year, month - 1, 25);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay(); // 0: Sunday ... 6: Saturday
            const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeek) || '';
            const isRestDay = employee.restDays.includes(dayNameArabic);
            const isPublicHoliday = publicHolidays.some(h => h.date === dateStr);

            const attendance = attendanceRecords[dateStr];
            const workedHours = attendance ? attendance[employee.id.toString()] : undefined;

            if (workedHours !== undefined && workedHours > 0) {
                daysWorked++;

                if (isPublicHoliday) {
                    totalOvertimeHours += employee.salaryType === 'شهري' ? 16 : 8;
                    overtimeDays++;
                } else if (dayOfWeek === 5) { // Friday
                    totalOvertimeHours += workedHours * 2;
                    overtimeDays++;
                } else if (isRestDay) {
                    totalOvertimeHours += workedHours * 2;
                    overtimeDays++;
                } else {
                    const workLocation = employee.workLocation.toLowerCase();
                    const isManagement = workLocation.includes('إدارة') || workLocation.includes('ادارة');
                    let regularHours = 8;

                    if (dayOfWeek === 4) { // Thursday
                        const threshold = isManagement ? 3 : 4;
                        if (workedHours > threshold) {
                            totalOvertimeHours += (workedHours - threshold) * 1.5;
                        }
                    } else {
                        if (workedHours > regularHours) {
                            totalOvertimeHours += (workedHours - regularHours) * 1.5;
                        }
                    }

                    regularWorkDaysForDaily++;
                }
            }
        }

        const totalOvertimePay = totalOvertimeHours * hourlyRate;
        const basePay = employee.salaryType === 'شهري'
            ? employee.salaryAmount
            : regularWorkDaysForDaily * employee.salaryAmount;

        const employeeVars = monthlyVariables[employee.id.toString()] || { bonus: 0, deduction: 0, previousDue: 0 };
        const netSalary = basePay + totalOvertimePay + employeeVars.bonus - employeeVars.deduction + (employeeVars.previousDue || 0);

        report.push({
            employee,
            basePay,
            totalOvertimePay,
            bonus: employeeVars.bonus,
            deduction: employeeVars.deduction,
            netSalary,
            previousDue: employeeVars.previousDue || 0,
            details: {
                daysWorked,
                totalOvertimeHours,
                regularWorkDaysForDaily,
                overtimeDays
            }
        });
    });

    return report;
}
