import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from 'react-router-dom';

interface Driver {
  id: number;
  name: string;
  workLocation: string;
  paymentSource: string;
  dayCost: number;
}

type Attendance = {
  [driverId: number]: {
    [date: string]: number;
  };
};

interface TransportCostsProps {
  historicalPayrolls: any[];
  setHistoricalPayrolls: React.Dispatch<React.SetStateAction<any[]>>;
}

const LOCAL_STORAGE_KEY = "transportData_v2";

const generateDateRangeForMonth = (year: number, month: number): string[] => {
  const dates: string[] = [];
  const startDate = new Date(year, month - 2, 26);
  const endDate = new Date(year, month - 1, 25);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // --- START OF THE FIX ---
    // This new formatting avoids timezone issues caused by .toISOString()
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so we add 1
    const dd = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    // --- END OF THE FIX ---

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // For your verification in the console
  if (dates.length > 0) {
    console.log(`CORRECTED -> Month: ${month}/${year}, Range: ${dates[0]} to ${dates[dates.length - 1]}`);
  }
  
  return dates;
};


function TransportCosts({ historicalPayrolls, setHistoricalPayrolls }: TransportCostsProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [attendance, setAttendance] = useState<Attendance>({});
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const navigate = useNavigate();

  const days = generateDateRangeForMonth(selectedYear, selectedMonth);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.drivers) setDrivers(parsed.drivers);
      if (parsed.attendance) setAttendance(parsed.attendance);
    }
  }, []);

  const saveData = () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ drivers, attendance })
    );
    alert("تم حفظ البيانات بنجاح");
  };

  const addDriver = (driver: Driver) => {
    setDrivers((prev) => [...prev, driver]);
  };

  const updateDriver = (updatedDriver: Driver) => {
    setDrivers((prev) =>
      prev.map((driver) =>
        driver.id === updatedDriver.id ? updatedDriver : driver
      )
    );
    setEditingDriver(null);
  };

  const deleteDriver = (driverId: number) => {
    if (window.confirm("هل أنت متأكد من حذف السائق؟")) {
      setDrivers((prev) => prev.filter((driver) => driver.id !== driverId));
      setAttendance((prev) => {
        const updated = { ...prev };
        delete updated[driverId];
        return updated;
      });
    }
  };

  const handleDayChange = (driverId: number, date: string, value: number) => {
    setAttendance((prev) => {
      const updated = { ...prev };
      if (!updated[driverId]) updated[driverId] = {};
      updated[driverId][date] = value;
      return updated;
    });
  };

  const getDriverTotal = (driverId: number) => {
    const records = attendance[driverId] || {};
    const totalDays = Object.entries(records)
      .filter(([date]) => days.includes(date))
      .reduce((acc, [, val]) => acc + Number(val || 0), 0);
    const driver = drivers.find((d) => d.id === driverId);
    return {
      totalDays,
      totalCost: totalDays * (driver?.dayCost || 0),
    };
  };

  const saveTransportCost = () => {
    const monthlyTotal = drivers.reduce((total, driver) => {
      const { totalCost } = getDriverTotal(driver.id);
      return total + totalCost;
    }, 0);

    const existingEntryIndex = historicalPayrolls.findIndex(p => p.year === selectedYear && p.month === selectedMonth);
    if (existingEntryIndex !== -1) {
      const updatedPayrolls = [...historicalPayrolls];
      updatedPayrolls[existingEntryIndex] = {
        ...updatedPayrolls[existingEntryIndex],
        transportCost: monthlyTotal,
      };
      setHistoricalPayrolls(updatedPayrolls);
    } else {
      setHistoricalPayrolls([...historicalPayrolls, {
        year: selectedYear,
        month: selectedMonth,
        transportCost: monthlyTotal,
      }]);
    }
    alert("تم حفظ تكلفة النقل بنجاح!");
    navigate('/history');
  };

  const handleExportExcel = () => {
    const exportData = drivers.map((driver) => {
      const { totalDays, totalCost } = getDriverTotal(driver.id);
      return {
        "اسم السائق": driver.name,
        "موقع العمل": driver.workLocation,
        "جهة الصرف": driver.paymentSource,
        "قيمة اليوم": driver.dayCost,
        "عدد الأيام": totalDays,
        "إجمالي التكلفة": totalCost,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تكلفة النقل");
    XLSX.writeFile(wb, "transport-costs.xlsx");
  };

  const handlePrint = () => {
    const printable = drivers.map((driver) => {
      const { totalDays, totalCost } = getDriverTotal(driver.id);
      return `
        <tr>
          <td>${driver.name}</td>
          <td>${driver.workLocation}</td>
          <td>${driver.paymentSource}</td>
          <td>${driver.dayCost}</td>
          <td>${totalDays}</td>
          <td>${totalCost}</td>
        </tr>`;
    }).join("");

    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <html dir="rtl">
        <head>
          <title>طباعة تكلفة النقل</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
            td, th { border: 1px solid #000; padding: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center;">ملخص تكلفة النقل</h2>
          <table>
            <thead>
              <tr>
                <th>اسم السائق</th>
                <th>موقع العمل</th>
                <th>جهة الصرف</th>
                <th>قيمة اليوم</th>
                <th>عدد الأيام</th>
                <th>إجمالي التكلفة</th>
              </tr>
            </thead>
            <tbody>
              ${printable}
            </tbody>
          </table>
        </body>
        </html>
      `);
      newWindow.document.close();
      newWindow.print();
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex gap-4 items-center">
        <select
          className="border rounded px-2 py-1"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("ar-EG", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <button onClick={saveData} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          حفظ البيانات
        </button>
        <button onClick={handleExportExcel} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          تصدير Excel
        </button>
        <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          طباعة
        </button>
        <button onClick={saveTransportCost} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          حفظ كشف تكلفة النقل
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">
          {editingDriver ? "تعديل بيانات السائق" : "إضافة بيانات سائق / سيارة"}
        </h2>
        <form
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as typeof e.target & {
              name: { value: string };
              workLocation: { value: string };
              paymentSource: { value: string };
              dayCost: { value: string };
            };

            const driverData = {
              id: editingDriver ? editingDriver.id : Date.now(),
              name: form.name.value,
              workLocation: form.workLocation.value,
              paymentSource: form.paymentSource.value,
              dayCost: Number(form.dayCost.value),
            };

            if (editingDriver) {
              updateDriver(driverData);
            } else {
              addDriver(driverData);
            }

            form.name.value = "";
            form.workLocation.value = "";
            form.paymentSource.value = "";
            form.dayCost.value = "";
            setEditingDriver(null);
          }}
        >
          <input
            required
            name="name"
            placeholder="اسم السائق"
            className="input"
            defaultValue={editingDriver?.name || ""}
          />
          <input
            required
            name="workLocation"
            placeholder="موقع العمل"
            className="input"
            defaultValue={editingDriver?.workLocation || ""}
          />
          <input
            required
            name="paymentSource"
            placeholder="جهة الصرف"
            className="input"
            defaultValue={editingDriver?.paymentSource || ""}
          />
          <input
            required
            name="dayCost"
            type="number"
            placeholder="تكلفة اليوم"
            className="input"
            defaultValue={editingDriver?.dayCost || ""}
          />
          <div className="col-span-full">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {editingDriver ? "حفظ التعديل" : "إضافة السائق"}
            </button>
            {editingDriver && (
              <button
                type="button"
                onClick={() => setEditingDriver(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow overflow-auto">
        <h2 className="text-xl font-bold mb-4">تسجيل الحضور وحساب التكلفة</h2>
        <table className="min-w-max table-auto border">
          <thead className="bg-gray-100 text-sm text-gray-700">
            <tr>
              <th className="border px-2 py-1">الاسم</th>
              <th className="border px-2 py-1">موقع العمل</th>
              <th className="border px-2 py-1">جهة الصرف</th>
              <th className="border px-2 py-1">قيمة اليوم</th>
              <th className="border px-2 py-1">عدد الأيام</th>
              <th className="border px-2 py-1">الإجمالي</th>
              {days.map((date) => (
                <th key={date} className="border px-2 py-1 whitespace-nowrap text-center">
                  <div className="text-xs">{new Date(date).toLocaleDateString("ar-EG", { weekday: "short" })}</div>
                  <div className="text-xs text-gray-600">{date.slice(5)}</div>
                </th>
              ))}
              <th className="border px-2 py-1">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 && (
              <tr>
                <td colSpan={7 + days.length} className="text-center text-gray-500 py-8">
                  لم يتم إدخال أي بيانات حتى الآن.
                </td>
              </tr>
            )}
            {drivers.map((driver) => {
              const { totalDays, totalCost } = getDriverTotal(driver.id);
              return (
                <tr key={driver.id} className="text-center">
                  <td className="border px-2 py-1">{driver.name}</td>
                  <td className="border px-2 py-1">{driver.workLocation}</td>
                  <td className="border px-2 py-1">{driver.paymentSource}</td>
                  <td className="border px-2 py-1">{driver.dayCost}</td>
                  <td className="border px-2 py-1 font-bold text-blue-700">{totalDays}</td>
                  <td className="border px-2 py-1 font-bold text-green-700">{totalCost}</td>
                  {days.map((date) => (
                    <td key={date} className="border px-1 py-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="2"
                        value={attendance[driver.id]?.[date] || ""}
                        onChange={(e) =>
                          handleDayChange(driver.id, date, parseFloat(e.target.value || "0"))
                        }
                        className="w-14 text-center border rounded px-1 py-0.5 text-sm"
                      />
                    </td>
                  ))}
                  <td className="border px-2 py-1">
                    <button
                      onClick={() => setEditingDriver(driver)}
                      className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 mr-1"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteDriver(driver.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransportCosts;