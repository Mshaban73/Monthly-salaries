// --- START OF FILE: src/types.ts (النسخة النهائية الكاملة والمصححة) ---

// 1. النوع الأساسي للموظف
export interface Employee {
  id: number;
  created_at: string;
  name: string;
  job_title: string;
  is_active: boolean;
  salary_type: 'شهري' | 'يومي';
  salary_amount: number;
  work_location: string;
  hours_per_day: number;
  rest_days: string[];
  is_head_office: boolean;
  payment_source: string;
  transport_allowance?: Allowance;
  expatriation_allowance?: Allowance;
  meal_allowance?: Allowance;
  housing_allowance?: Allowance;
  isEligible?: boolean; // إضافة خاصية اختيارية للاستحقاق
}

// 2. نوع البدلات
export interface Allowance {
  type: 'شهري' | 'يومي';
  amount: number;
}

// 3. نوع الإجازات الرسمية
export interface PublicHoliday {
  id: number;
  created_at: string;
  date: string;
  name: string;
}

// 4. نوع السلف
export interface Loan {
  id: number;
  created_at: string;
  employee_id: number;
  total_amount: number;
  installments: number;
  installment_amount: number;
  description?: string;
  start_date: string;
  status: 'active' | 'paid';
  employees?: { name: string }; 
}

// 5. نوع المكافآت والخصومات اليدوية
export interface BonusDeduction {
  id: number;
  employee_id: number;
  period: string; // تم توحيد الاسم إلى 'period'
  bonus_amount?: number;
  deduction_amount?: number;
}

// 6. نوع سجل الحضور الفردي
export interface AttendanceRecord {
  id: number;
  date: string;
  employee_id: number;
  hours: number;
  location: string;
  status: string;
}

// 7. نوع سجلات الحضور المجمعة
export type AttendanceRecords = {
  [date: string]: {
    [employeeId: number]: {
      hours: number;
      locations: string[];
    };
  };
};

// 8. نوع عناصر تقرير الرواتب
export interface PayrollReportItem {
    employee: {
        id: number;
        name: string;
        work_location: string;
        payment_source: string;
    };
    basePay: number;
    totalWorkDays: number;
    totalOvertimePay: number;
    totalBonuses: number;
    totalAllowances: number;
    manualDeduction: number;
    generalBonus: number;
    loanInstallment: number;
    netSalary: number;
    isEligible: boolean; // إضافة خاصية الاستحقاق
}

// 9. نوع سائقي النقل
export interface Driver {
  id: number;
  created_at: string;
  name: string;
  daily_rate: number;
  is_active: boolean;
  work_location: string;
  payment_source: string;
}

// 10. نوع الصلاحيات
export interface Permission {
  id?: number; 
  profile_id: string;
  page_id: number;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  pages: { id: number; name: string; }; 
}

// 11. نوع الصفحات (للصلاحيات)
export interface Page {
    id: number;
    name: string;
}

// 12. نوع المستخدم مع صلاحياته
export interface UserWithPermissions {
    id: string;
    profiles: { id: string, email: string };
    permissions: Permission[];
}

// 13. نوع بيانات الرواتب التاريخية
export interface HistoricalPayroll {
  id: number;
  period: string;
  data: any;
  created_at: string;
}

// 14. نوع السجلات المالية (للسائقين) - تم تصحيحه
export interface FinancialItem {
  id?: number;
  driver_id: number;
  period: string;
  type: 'extra' | 'deduction';
  amount: number;
  description: string;
  note?: string; // يتوافق الآن مع ما يتوقعه FinancialsModal
}

// --- END OF FILE: src/types.ts ---