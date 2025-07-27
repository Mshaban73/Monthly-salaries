// --- START OF FILE src/utils/attendanceCalculator.ts ---

export const getYearsList = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
};

export const getMonthsList = () => Array.from({ length: 12 }, (_, i) => ({
  name: new Date(0, i).toLocaleString('ar-EG', { month: 'long' }),
  value: i + 1,
}));

export const toYMDString = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ▼▼▼ هذه هي الدالة الصحيحة التي طلبتها ▼▼▼
export const getPayrollDays = (year: number, month: number): Date[] => {
  // الشهر يبدأ من 0 (يناير) إلى 11 (ديسمبر) في JS
  const jsMonth = month - 1;
  let start = new Date(Date.UTC(year, jsMonth - 1, 26));
  let end = new Date(Date.UTC(year, jsMonth, 25));

  // التعامل مع حالة يناير (الشهر 1)
  if (month === 1) {
    start = new Date(Date.UTC(year - 1, 11, 26)); // ديسمبر من العام السابق
    end = new Date(Date.UTC(year, 0, 25)); // يناير من العام الحالي
  }

  const days: Date[] = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    days.push(new Date(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  return days;
};