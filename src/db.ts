// --- START OF FILE: src/db.ts (النسخة الكاملة والمحدثة) ---

import Dexie, { type Table } from 'dexie';
// استيراد كل الأنواع التي سنستخدمها من المصدر الموحد
import type { 
    Employee, 
    PublicHoliday, 
    Loan, 
    BonusDeduction, 
    Driver, 
    FinancialItem, 
    AttendanceRecord,
    TransportAttendance // استيراد النوع الجديد
} from './types';


export class LocalDatabase extends Dexie {
  // تعريف الجداول مع أنواعها الصحيحة
  employees!: Table<Employee>;
  publicHolidays!: Table<PublicHoliday>;
  loans!: Table<Loan>;
  drivers!: Table<Driver>;
  transportAttendance!: Table<TransportAttendance>; // تم تعريف النوع
  transportFinancials!: Table<FinancialItem>;

  constructor() {
    super('SmartPayrollDB'); // اسم قاعدة البيانات المحلية
    
    // تعريف إصدارات قاعدة البيانات. كلما غيرت البنية، يجب زيادة رقم الإصدار.
    this.version(2).stores({
      // تعريف الجداول ومفاتيحها الأساسية (primary key) والحقول المفهرسة (indexes)
      employees: 'id, name, &is_active', // 'id' مفتاح أساسي, 'name' و 'is_active' مفهرسة
      publicHolidays: 'id, date',
      loans: 'id, employee_id',
      drivers: 'id, name, &is_active',
      
      // الجداول الجديدة التي أضفناها
      // '[driver_id+date]' يعني أن المفتاح الأساسي هو مزيج من هذين الحقلين لضمان عدم التكرار
      transportAttendance: '[driver_id+date]',
      
      // 'id' هو المفتاح الأساسي، '[driver_id+period]' هو فهرس مركب لتسريع البحث
      transportFinancials: 'id, [driver_id+period]',
    });
  }
}

// إنشاء نسخة واحدة من قاعدة البيانات وتصديرها لاستخدامها في كل التطبيق
export const db = new LocalDatabase();