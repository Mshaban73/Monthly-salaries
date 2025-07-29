// --- START OF FILE src/components/PayrollDetailModal.tsx (النهائي مع PDF وتصغير الحجم) ---

import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DetailRow = ({ label, value, colorClass = 'text-gray-900', isBold = false }) => (
    <div className="flex justify-between items-center py-2 px-3 border-b">
        <span className={`font-semibold text-sm ${isBold ? 'text-gray-800' : 'text-gray-600'}`}>{label}</span>
        <span className={`font-mono font-bold ${colorClass} ${isBold ? 'text-base' : 'text-base'}`}>{value}</span>
    </div>
);

export default function PayrollDetailModal({ reportItem, onClose }: { reportItem: any, onClose: () => void }) {
    const modalContentRef = useRef<HTMLDivElement>(null);

    if (!reportItem) return null;

    const handlePrintToPdf = () => {
        const input = modalContentRef.current;
        if (input) {
            html2canvas(input, { scale: 2 }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`payroll-detail-${reportItem.employee.name}.pdf`);
            });
        }
    };
    
    const { employee, basePay, totalOvertimePay, totalAllowances, totalBonuses, generalBonus, loanInstallment, manualDeduction, netSalary, totalWorkDays } = reportItem;

    const totalAdditions = totalOvertimePay + totalAllowances + totalBonuses + generalBonus;
    const totalDeductions = loanInstallment + manualDeduction;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-xl flex flex-col"
                dir="rtl"
                onClick={e => e.stopPropagation()}
            >
                <div ref={modalContentRef} className="p-6">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">تفاصيل راتب</h2>
                            <p className="text-lg text-blue-700 font-semibold">{employee.name}</p>
                        </div>
                        <span className="text-sm text-gray-500">أيام الحضور: {totalWorkDays}</span>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                        <DetailRow label="الراتب الأساسي" value={basePay.toFixed(2)} colorClass="text-gray-800" />
                        
                        <div className="bg-green-50"><DetailRow label="قيمة الإضافي" value={totalOvertimePay.toFixed(2)} colorClass="text-green-700" /></div>
                        <div className="bg-green-50"><DetailRow label="البدلات" value={totalAllowances.toFixed(2)} colorClass="text-green-700" /></div>
                        <div className="bg-green-50"><DetailRow label="المكافآت الخاصة" value={totalBonuses.toFixed(2)} colorClass="text-green-700" /></div>
                        <div className="bg-green-50"><DetailRow label="المنحة العامة" value={generalBonus.toFixed(2)} colorClass="text-green-700" /></div>
                        <DetailRow label="إجمالي المستحقات" value={(basePay + totalAdditions).toFixed(2)} colorClass="text-green-800 font-extrabold" isBold />
                        
                        <div className="bg-red-50"><DetailRow label="قسط السلفة" value={loanInstallment.toFixed(2)} colorClass="text-red-700" /></div>
                        <div className="bg-red-50"><DetailRow label="الخصومات الأخرى" value={manualDeduction.toFixed(2)} colorClass="text-red-700" /></div>
                        <DetailRow label="إجمالي الاستقطاعات" value={totalDeductions.toFixed(2)} colorClass="text-red-800 font-extrabold" isBold />
                        
                        <div className="bg-blue-600 text-white">
                           <DetailRow label="صافي الراتب النهائي" value={netSalary.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })} colorClass="text-white" isBold />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-auto p-4 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={handlePrintToPdf} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <Printer size={18} className="ml-2" />
                        تصدير PDF
                    </button>
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">إغلاق</button>
                </div>
            </div>
        </div>
    );
}