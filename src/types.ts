// --- START OF FILE: src/types.ts ---

export interface Employee {
  id: number; created_at: string; name: string; job_title: string; is_active: boolean;
  salary_type: 'شهري' | 'يومي'; salary_amount: number; work_location: string;
  hours_per_day: number; rest_days: string[]; is_head_office: boolean;
  payment_source: string; transport_allowance?: Allowance; expatriation_allowance?: Allowance;
  meal_allowance?: Allowance; housing_allowance?: Allowance; isEligible?: boolean;
  overtime_rate_regular?: number; overtime_rate_holiday?: number; overtime_rate_friday?: number;
}
export interface Allowance { type: 'شهري' | 'يومي'; amount: number; }
export interface PublicHoliday { id: number; created_at: string; date: string; name: string; }
export interface Loan {
  id: number; created_at: string; employee_id: number; total_amount: number;
  installments: number; installment_amount: number; description?: string;
  start_date: string; status: 'active' | 'paid'; employees?: { name: string }; 
}
export interface BonusDeduction { id: number; employee_id: number; period: string; bonus_amount?: number; deduction_amount?: number; }
export interface AttendanceRecord { id: number; date: string; employee_id: number; hours: number; location: string; status: string; }
export type AttendanceRecords = { [date: string]: { [employeeId: number]: { hours: number; locations: string[]; }; }; };

// --- بداية التعديل ---
export interface PayrollReportItem {
    employee: { id: number; name: string; work_location: string; payment_source: string; };
    basePay: number;
    totalWorkDays: number;
    overtimeDaysCount: number; // <-- إضافة الخاصية الجديدة
    totalOvertimePay: number;
    totalBonuses: number;
    totalAllowances: number;
    manualDeduction: number;
    generalBonus: number;
    loanInstallment: number;
    netSalary: number;
    isEligible: boolean;
}
// --- نهاية التعديل ---

export interface Driver {
  id: number; created_at: string; name: string; daily_rate: number; is_active: boolean;
  work_location: string; payment_source: string;
}
export interface Permission { id?: number; profile_id: string; page_id: number; can_view: boolean; can_add: boolean; can_edit: boolean; can_delete: boolean; pages: { id: number; name: string; }; }
export interface Page { id: number; name: string; }
export interface UserWithPermissions { id: string; profiles: { id: string, email: string }; permissions: Permission[]; }
export interface HistoricalPayroll { id: number; period: string; data: any; created_at: string; }
export interface FinancialItem { id?: number; driver_id: number; period: string; type: 'extra' | 'deduction'; amount: number; description: string; note?: string; }
export interface TransportAttendance { id?: number; driver_id: number; date: string; trips: number; }