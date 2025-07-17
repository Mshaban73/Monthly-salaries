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
    details: any;
}

export function calculatePayroll(
    employees: Employee[],
    attendanceRecords: AttendanceRecords,
    month: number,
    year: number,
    monthlyVariables: { [key: string]: { bonus: number; deduction: number } },
    publicHolidays: PublicHoliday[] // Dynamic holidays list of objects
): PayrollReport[] {
    const report: PayrollReport[] = [];

    employees.forEach(employee => {
        const hourlyRate = employee.salaryType === 'يومي' ? employee.salaryAmount / 8 : (employee.salaryAmount / 30) / 8;
        
        let totalOvertimeHours = 0;
        let daysWorked = 0;
        let regularWorkDaysForDaily = 0;

        // فترة الراتب تبدأ من 26 الشهر السابق وتنتهي في 25 الشهر المحدد
        const startDate = new Date(year, month - 2, 26);
        const endDate = new Date(year, month - 1, 25);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay(); // Sunday = 0, ... , Saturday = 6
            const dayNameArabic = Object.keys(dayNameToIndex).find(key => dayNameToIndex[key] === dayOfWeek) || '';
            const isRestDay = employee.restDays.includes(dayNameArabic);
            const isPublicHoliday = publicHolidays.some(h => h.date === dateStr);
            
            const attendance = attendanceRecords[dateStr];
            const workedHours = attendance ? attendance[employee.id.toString()] : undefined;

            if (workedHours !== undefined && workedHours > 0) {
                daysWorked++;

                if (isPublicHoliday) {
                    // عمل يوم عطلة رسمية
                    const extraHours = employee.salaryType === 'شهري' ? 16 : 8;
                    totalOvertimeHours += extraHours;
                    // لا يتم احتساب ساعات العمل الفعلية كإضافي لأن الموظف اليومي سيأخذ يوميته والموظف الشهري يأخذ راتبه
                } else if (dayOfWeek === 5) { // Friday
                    // عمل يوم الجمعة (ساعتين لكل ساعة)
                    totalOvertimeHours += workedHours * 2;
                } else if (isRestDay) {
                     // عمل يوم راحة اسبوعية (غير الجمعة)
                     totalOvertimeHours += workedHours * 2;
                } else {
                    // يوم عمل عادي
                    regularWorkDaysForDaily++;
                    const workLocation = employee.workLocation.toLowerCase();
                    const isManagement = workLocation.includes('إدارة') || workLocation.includes('ادارة');
                    
                    let regularHoursTarget = 8;
                    
                    if (dayOfWeek === 4) { // Thursday
                       // نهاية العمل 12 ظهراً
                       // نفترض أن العمل من 9ص إلى 12م بالإدارة (3 ساعات) ومن 8ص إلى 12م بالمواقع (4 ساعات)
                       const regularHoursOnThursday = isManagement ? 3 : 4;
                       if (workedHours > regularHoursOnThursday) {
                           totalOvertimeHours += (workedHours - regularHoursOnThursday) * 1.5;
                       }
                    } else {
                       if (workedHours > regularHoursTarget) {
                           totalOvertimeHours += (workedHours - regularHoursTarget) * 1.5;
                       }
                    }
                }
            }
        }
        
        const totalOvertimePay = totalOvertimeHours * hourlyRate;
        // راتب الموظف اليومي يحسب بناء على عدد أيام العمل العادية (غير أيام الراحة والعطلات)
        const basePay = employee.salaryType === 'شهري' ? employee.salaryAmount : regularWorkDaysForDaily * employee.salaryAmount;
        const employeeVars = monthlyVariables[employee.id.toString()] || { bonus: 0, deduction: 0 };
        
        const netSalary = basePay + totalOvertimePay + employeeVars.bonus - employeeVars.deduction;

        report.push({
            employee,
            basePay,
            totalOvertimePay,
            bonus: employeeVars.bonus,
            deduction: employeeVars.deduction,
            netSalary,
            details: { daysWorked, totalOvertimeHours, regularWorkDaysForDaily }
        });
    });

    return report;
}