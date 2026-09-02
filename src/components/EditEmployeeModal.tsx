import React from 'react';
import { X, Save, User, Calculator, Check } from 'lucide-react';
import { PayrollRecord } from '../types';
import { formatCurrency } from '../utils/payrollUtils';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
  onSave: (record: PayrollRecord) => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<Partial<PayrollRecord>>({});

  React.useEffect(() => {
    if (record) {
      setFormData({ ...record });
    } else {
      setFormData({
        empId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        empName: '',
        deptCode: 'PROD-01',
        baseWage: 450,
        workDays: 26,
        normalOtHours: 20,
        holidayWorkDays: 0,
        holidayOtHours: 0,
        pubHolidayWorkDays: 0,
        pubHolidayOtHours: 0,
        diligenceAllowance: 1000,
        positionAllowance: 0,
        skillAllowance: 0,
        ssoRefund: 0,
        otherIncome: 0,
        withholdingTax: 200,
        studentLoanKys: 0,
        studentLoanKro: 0,
      });
    }
  }, [record, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof PayrollRecord, val: any) => {
    const updated = { ...formData, [key]: val };

    // Auto calculate key derived numbers
    const base = Number(updated.baseWage || 0);
    const days = Number(updated.workDays || 0);
    const normOtH = Number(updated.normalOtHours || 0);
    const holDays = Number(updated.holidayWorkDays || 0);
    const holOtH = Number(updated.holidayOtHours || 0);
    const pubHolDays = Number(updated.pubHolidayWorkDays || 0);
    const pubHolOtH = Number(updated.pubHolidayOtHours || 0);

    // Hourly rate = base / 8
    const hourlyRate = base > 0 ? base / 8 : 0;
    const workWagePay = base * days;
    const normalOtPay = normOtH * hourlyRate * 1.5;
    const holidayWorkPay = holDays * base;
    const holidayOtPay = holOtH * hourlyRate * 2.0;
    const pubHolidayWorkPay = pubHolDays * base;
    const pubHolidayOtPay = pubHolOtH * hourlyRate * 2.0;

    const totalWorkWage = workWagePay + normalOtPay + holidayWorkPay + holidayOtPay + pubHolidayWorkPay + pubHolidayOtPay;

    const totalAdditions = (
      Number(updated.annualLeavePay || 0) +
      Number(updated.otherLeavePay || 0) +
      Number(updated.pubHolidayPay || 0) +
      Number(updated.teamIncentivePay || 0) +
      Number(updated.effBonus || 0) +
      Number(updated.diligenceAllowance || 0) +
      Number(updated.referralBonus || 0) +
      Number(updated.positionAllowance || 0) +
      Number(updated.perDiemAllowance || 0) +
      Number(updated.skillAllowance || 0) +
      Number(updated.ssoRefund || 0) +
      Number(updated.otherIncome || 0) +
      Number(updated.retirementPay || 0) +
      Number(updated.longServiceAward || 0)
    );

    const ssoBase = Math.min(15000, Math.max(0, totalWorkWage || 15000));
    const ssoVal = Math.round(ssoBase * 0.05);

    const taxVal = Number(updated.withholdingTax || 0);
    const fundVal = Number(updated.welfareFundContribution || 0);
    const kysVal = Number(updated.studentLoanKys || 0);
    const kroVal = Number(updated.studentLoanKro || 0);
    const otherDeduct = Number(updated.totalOtherDeductions || 0);

    const totalDeductions = ssoVal + taxVal + fundVal + kysVal + kroVal + otherDeduct;
    const grossIncome = totalWorkWage + totalAdditions;
    const netPay = grossIncome - totalDeductions + Number(updated.vacationRefund || 0);

    setFormData({
      ...updated,
      workWagePay,
      normalOtPay,
      holidayWorkPay,
      holidayOtPay,
      pubHolidayWorkPay,
      pubHolidayOtPay,
      totalWorkWage,
      totalAdditions,
      ssoBaseAmount: ssoBase,
      ssoContribution: ssoVal,
      totalDeductions,
      grossIncome,
      netPay,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empName || !formData.empId) return;

    onSave(formData as PayrollRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-orange-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500 text-white rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {record ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มรายการพนักงานใหม่'}
              </h2>
              <p className="text-xs text-stone-500">
                ระบบจะคำนวณค่าแรง โอที ประกันสังคม และยอดสุทธิให้อัตโนมัติ
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">รหัสพนักงาน *</label>
              <input
                type="text"
                required
                value={formData.empId || ''}
                onChange={(e) => handleChange('empId', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-stone-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-semibold mb-1">ชื่อ - นามสกุล *</label>
              <input
                type="text"
                required
                value={formData.empName || ''}
                onChange={(e) => handleChange('empName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-stone-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">รหัสสังกัด / แผนก</label>
              <input
                type="text"
                value={formData.deptCode || ''}
                onChange={(e) => handleChange('deptCode', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-stone-800"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">เงินค่าแรง (บาท/วัน)</label>
              <input
                type="number"
                value={formData.baseWage ?? 0}
                onChange={(e) => handleChange('baseWage', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-stone-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">จำนวนวันทำงาน (วัน)</label>
              <input
                type="number"
                value={formData.workDays ?? 0}
                onChange={(e) => handleChange('workDays', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-stone-800 font-mono"
              />
            </div>
          </div>

          {/* Working hours & OT */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 space-y-2.5">
            <span className="font-bold text-stone-700 block">ชั่วโมงล่วงเวลาและวันหยุด</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-500 mb-1">ล่วงเวลาปกติ (ชม.)</label>
                <input
                  type="number"
                  value={formData.normalOtHours ?? 0}
                  onChange={(e) => handleChange('normalOtHours', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-stone-500 mb-1">ล่วงเวลาวันหยุด (ชม.)</label>
                <input
                  type="number"
                  value={formData.holidayOtHours ?? 0}
                  onChange={(e) => handleChange('holidayOtHours', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-stone-500 mb-1">ล่วงเวลานักขัตฤกษ์ (ชม.)</label>
                <input
                  type="number"
                  value={formData.pubHolidayOtHours ?? 0}
                  onChange={(e) => handleChange('pubHolidayOtHours', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Allowances */}
          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2.5">
            <span className="font-bold text-emerald-900 block">รายได้เพิ่ม & เบี้ยเลี้ยง (บาท)</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-stone-500 mb-1">เบี้ยขยัน</label>
                <input
                  type="number"
                  value={formData.diligenceAllowance ?? 0}
                  onChange={(e) => handleChange('diligenceAllowance', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg border border-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-stone-500 mb-1">ค่าตำแหน่ง</label>
                <input
                  type="number"
                  value={formData.positionAllowance ?? 0}
                  onChange={(e) => handleChange('positionAllowance', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg border border-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-stone-500 mb-1">ค่าทักษะ</label>
                <input
                  type="number"
                  value={formData.skillAllowance ?? 0}
                  onChange={(e) => handleChange('skillAllowance', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg border border-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-stone-500 mb-1">เบี้ยเลี้ยง</label>
                <input
                  type="number"
                  value={formData.perDiemAllowance ?? 0}
                  onChange={(e) => handleChange('perDiemAllowance', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg border border-stone-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Deductions & Net calculation preview */}
          <div className="p-4 bg-orange-500 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-orange-100 uppercase font-medium">คำนวณค่าแรงสุทธิ</span>
              <div className="text-xl font-black font-mono">
                ฿{formatCurrency(formData.netPay)}
              </div>
            </div>
            <div className="text-right text-[11px] text-orange-100">
              <div>รวมค่าแรง: ฿{formatCurrency(formData.totalWorkWage)}</div>
              <div>รวมเงินหัก: ฿{formatCurrency(formData.totalDeductions)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
