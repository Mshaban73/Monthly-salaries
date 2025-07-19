// --- START OF FILE utils/payrollCalculator.ts ---

// ملاحظة: هذا الملف يبدو قديماً وقد تم استبدال معظم وظائفه بـ attendanceCalculator.ts
// لكن سنقوم بإصلاح أخطاء TypeScript فيه.

const weekDays = [ "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// --- تعديل: تعريف نوع المفاتيح بشكل صريح ---
type DayName = 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة' | 'السبت';

export const dayNameToIndex: { [key in DayName]: number } = {
    'الأحد': 0,
    'الإثنين': 1,
    'الثلاثاء': 2,
    'الأربعاء': 3,
    'الخميس': 4,
    'الجمعة': 5,
    'السبت': 6,
};

export const indexToDayName: { [key: number]: string } = {
    0: 'الأحد',
    1: 'الإثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت',
};


export const calculateWorkDays = (
  month: number,
  year: number,
  restDaysIndices: number[]
) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (!restDaysIndices.includes(dayOfWeek)) {
      workDays++;
    }
  }
  return workDays;
};


export const getDaysInMonth = (month: number, year: number): Date[] => {
    const date = new Date(year, month - 1, 1);
    const days: Date[] = [];
    while (date.getMonth() === month - 1) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
};


export const calculateMonthlySalary = (
  employee: any,
  attendance: { [key: string]: { [key: string]: number } },
  month: number,
  year: number
) => {
  const restDaysIndices = employee.restDays.map((day: string) => dayNameToIndex[day as DayName]);
  const workDaysInMonth = calculateWorkDays(month, year, restDaysIndices);

  const daysInMonth = getDaysInMonth(month, year);
  let attendedDays = 0;
  let overtimeHours = 0;
  let restDayWorkHours = 0;

  daysInMonth.forEach(day => {
    const dateString = day.toISOString().split('T')[0];
    const dayAttendance = attendance[dateString] && attendance[dateString][employee.id];

    if (dayAttendance) {
      attendedDays++;
      const dayOfWeek = day.getDay();
      
      // --- تعديل: التأكد من أننا نتعامل مع الأيام بشكل صحيح ---
      const dayName = indexToDayName[dayOfWeek] as DayName;
      const isRestDay = employee.restDays.includes(dayName);

      if (isRestDay) {
        restDayWorkHours += dayAttendance;
      } else {
        if (dayAttendance > 8) {
          overtimeHours += dayAttendance - 8;
        }
      }
    }
  });

  const dailyRate = employee.salaryType === 'شهري' ? employee.salaryAmount / workDaysInMonth : employee.salaryAmount;
  const baseSalary = employee.salaryType === 'شهري' ? employee.salaryAmount : attendedDays * dailyRate;
  
  const hourlyRate = dailyRate / 8;
  const overtimePay = overtimeHours * hourlyRate * 1.5;
  const restDayPay = restDayWorkHours * hourlyRate * 2;

  const totalSalary = baseSalary + overtimePay + restDayPay;

  return {
    ...employee,
    attendedDays,
    totalSalary,
    overtimeHours,
    overtimePay,
    restDayWorkHours,
    restDayPay
  };
};