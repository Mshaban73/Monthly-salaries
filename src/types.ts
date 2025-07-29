// --- START OF FILE src/types.ts (الكامل والشامل والنهائي) ---

// 1. البدلات
export interface Allowance {
  amount: number;
  type: 'شهري' | 'يومي';
}

// 2. الموظفون (كما هو في قاعدة البيانات)
export interface Employee {
  id: number;
  created_at: string;
  name: string;
  job_title: string;
  work_location: string;
  salary_type: 'شهري' | 'يومي';
  salary_amount: number;
  payment_source: string;
  hours_per_day: number;
  rest_days: string[];
  is_head_office: boolean;
  is_active: boolean;
  transport_allowance?: Allowance;
  expatriation_allowance?: Allowance;
  meal_allowance?: Allowance;
  housing_allowance?: Allowance;
}

// 3. السائقون
export interface Driver {
    id: number;
    created_at: string;
    name: string;
    work_location: string;
    payment_source: string;
    day_cost: number;
    is_active: boolean;
}

// 4. العطلات الرسمية
export interface PublicHoliday {
    id: number;
    created_at: string;
    name: string;
    date: string; // YYYY-MM-DD
}

// 5. سجلات الحضور
export interface AttendanceRecord {
    id: number;
    created_at: string;
    employee_id: number;
    date: string; // YYYY-MM-DD
    hours: number;
    location: string;
    status: string;
}

// 6. السلف
export interface Loan {
    id: number;
    employee_id: number;
    total_amount: number;
    installments: number;
    start_date: string; // YYYY-MM
    description?: string;
}

// 7. المكافآت والخصومات
export interface BonusDeduction {
    id: number;
    employee_id: number;
    period: string; // YYYY-MM
    bonus_amount: number;
    deduction_amount: number;
    notes?: string;
}

// 8. كشوف الرواتب التاريخية
export interface HistoricalPayroll {
    id: number;
    created_at: string;
    period: string; // YYYY-MM
    report_data: {
        report: any[]; // يمكن تحسين هذا النوع لاحقًا
    };
    transport_cost_data?: {
        report: any[]; // يمكن تحسين هذا النوع لاحقًا
    };
}

// 9. الصلاحيات
export interface Permission {
    profile_id: string;
    page_id: number;
    can_view: boolean;
    can_add: boolean;
    can_edit: boolean;
    can_delete: boolean;
    pages: {
        id: number;
        name: string;
    };
}

// 10. المستخدم (كما يأتي من Supabase مدمجًا)
export interface UserWithPermissions {
    id: string;
    profiles: {
        id: string;
        email: string;
    };
    permissions: Permission[];
}