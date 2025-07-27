import React from 'react';
import { X, MapPin } from 'lucide-react';

export default function LocationCostSummaryModal({ data, onClose }) {
    if (!data) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg animate-fade-in-down" dir="rtl">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800">تحليل تكلفة الراتب بالموقع</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <p className="mb-4">الموظف: <span className="font-semibold">{data.employeeName}</span></p>
                <div className="space-y-2">
                    {Object.entries(data.summary).map(([location, {days, cost}]) => (
                        <div key={location} className="grid grid-cols-3 items-center bg-gray-100 p-2 rounded-md">
                            <div className="flex items-center gap-2 col-span-1"><MapPin size={14} className="text-gray-500"/><span className="font-medium text-gray-700">{location}</span></div>
                            <div className="text-center"><span className="font-bold text-blue-600">{days} يوم</span></div>
                            <div className="text-left font-semibold text-green-700">{cost.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}