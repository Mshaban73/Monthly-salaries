// --- START OF FILE: src/db.ts ---

import Dexie, { type Table } from 'dexie';
import type { Employee, PublicHoliday, Loan, BonusDeduction, Driver, FinancialItem, AttendanceRecord } from './types';

export class LocalDatabase extends Dexie {
  // تعريف الجداول التي نريد تخزينها محلياً
  employees!: Table<Employee>;
  publicHolidays!: Table<PublicHoliday>;
  loans!: Table<Loan>;
  drivers!: Table<Driver>;
  // يمكننا إضافة جداول أخرى هنا لاحقاً

  constructor() {
    super('SmartPayrollDB'); // هذا هو اسم قاعدة البيانات المحلية
    this.version(1).stores({
      // هنا نعرّف الجداول ومفاتيحها الأساسية (primary key)
      // 'id' هو المفتاح الأساسي، 'name' هو حقل يمكن البحث فيه بسرعة
      employees: 'id, name, is_active',
      publicHolidays: 'id, date',
      loans: 'id, employee_id',
      drivers: 'id, name, is_active',
    });
  }
}

export const db = new LocalDatabase();