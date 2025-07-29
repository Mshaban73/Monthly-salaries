// --- START OF FILE src/components/FilterSummaryModal.tsx (جديد) ---

import React from 'react';
import { X, DollarSign, PackagePlus, PackageMinus } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
}

function StatCard({ title, value, icon, colorClass }: StatCardProps) { 
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center border">
            <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
                {React.cloneElement(icon as React.ReactElement, { className: `h-6 w-6 ${colorClass}` })}
            </div>
            <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    ); 
}

interface FilterSummaryModalProps {
    onClose: () => void;
    totals: {
        grossSalary: number;
        totalAdditions: number;
        totalDeductions: number;
        netSalary: number;
    };
    filterCriteria: {
        location: string;
        source: string;
    };
}

export default function FilterSummaryModal({ onClose, totals, filterCriteria }: FilterSummaryModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-50 p-6 rounded-lg shadow-2xl w-full max-w-4xl animate-fade-in-down" dir="rtl">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">ملخص التقرير المفلتر</h2>
                        <p className="text-sm text-gray-600">
                            موقع العمل: <span className="font-semibold">{filterCriteria.location === 'all' ? 'الكل' : filterCriteria.location}</span> | 
                            جهة الصرف: <span className="font-semibold">{filterCriteria.source === 'all' ? 'الكل' : filterCriteria.source}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={28} /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <StatCard title="إجمالي الرواتب" value={totals.grossSalary.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<DollarSign/>} colorClass="text-gray-600" />
                    <StatCard title="إجمالي الإضافات" value={totals.totalAdditions.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<PackagePlus/>} colorClass="text-yellow-600" />
                    <StatCard title="إجمالي الخصومات" value={totals.totalDeductions.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<PackageMinus/>} colorClass="text-red-600" />
                    <StatCard title="صافي الرواتب النهائية" value={totals.netSalary.toLocaleString('ar-EG', {minimumFractionDigits: 2})} icon={<DollarSign/>} colorClass="text-green-600" />
                </div>
            </div>
        </div>
    );
}