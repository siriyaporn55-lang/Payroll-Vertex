import React from 'react';
import { 
  X, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Calendar, 
  BadgeCheck, 
  User, 
  Clock,
  Download,
  Share2
} from 'lucide-react';
import { PayrollRecord } from '../types';
import { formatCurrency, formatNumber, thaiBahtText } from '../utils/payrollUtils';

interface PayslipModalProps {
  record: PayrollRecord | null;
  allRecords: PayrollRecord[];
  onClose: () => void;
  onSelectRecord: (record: PayrollRecord) => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  record,
  allRecords,
  onClose,
  onSelectRecord,
}) => {
  if (!record) return null;

  const currentIndex = allRecords.findIndex((r) => r.id === record.id);
  const prevRecord = currentIndex > 0 ? allRecords[currentIndex - 1] : null;
  const nextRecord = currentIndex < allRecords.length - 1 ? allRecords[currentIndex + 1] : null;

  // Key earnings items
  const earningsList = [
    { label: 'ค่าแรงทำงานปกติ', hours: `${record.workDays || 0} วัน`, amount: record.workWagePay },
    { label: 'ค่าแรงล่วงเวลาปกติ (1.5 เท่า)', hours: `${record.normalOtHours || 0} ชม.`, amount: record.normalOtPay },
    { label: 'ค่าแรงทำงานวันหยุด', hours: `${record.holidayWorkDays || 0} วัน`, amount: record.holidayWorkPay },
    { label: 'ค่าแรงล่วงเวลาวันหยุด (2/3 เท่า)', hours: `${record.holidayOtHours || 0} ชม.`, amount: record.holidayOtPay },
    { label: 'ค่าแรงทำงานวันนักขัตฤกษ์', hours: `${record.pubHolidayWorkDays || 0} วัน`, amount: record.pubHolidayWorkPay },
    { label: 'ค่าแรงล่วงเวลาวันนักขัตฤกษ์', hours: `${record.pubHolidayOtHours || 0} ชม.`, amount: record.pubHolidayOtPay },
    { label: 'ค่าลาพักร้อน (จ่าย)', amount: record.annualLeavePay },
    { label: 'ค่าลาอื่น ๆ (จ่าย)', amount: record.otherLeavePay },
    { label: 'ค่าแรงวันหยุดนักขัตฤกษ์', amount: record.pubHolidayPay },
    { label: 'เงินค่าแรงเหมาทีม (จูงใจ)', amount: record.teamIncentivePay },
    { label: 'เบี้ย EFF (Efficiency)', amount: record.effBonus },
    { label: 'เบี้ยขยันประจำเดือน', amount: record.diligenceAllowance },
    { label: 'ค่าแนะนำพนักงาน', amount: record.referralBonus },
    { label: 'ค่าตำแหน่ง', amount: record.positionAllowance },
    { label: 'เบี้ยเลี้ยง / ค่าอาหาร', amount: record.perDiemAllowance },
    { label: 'ค่าทักษะ / ความสามารถพิเศษ', amount: record.skillAllowance },
    { label: 'คืนเงินประกันสังคม', amount: record.ssoRefund },
    { label: 'คืนเงินพักร้อน', amount: record.vacationRefund },
    { label: 'เงินรางวัลอายุงาน', amount: record.longServiceAward },
    { label: 'เงินเกษียณอายุ', amount: record.retirementPay },
    { label: 'เงินได้อื่นๆ', amount: record.otherIncome },
  ].filter((item) => (item.amount || 0) > 0);

  // Key deductions items
  const deductionsList = [
    { label: 'เงินสมทบประกันสังคม (5%)', base: `ฐาน ฿${formatCurrency(record.ssoBaseAmount)}`, amount: record.ssoContribution },
    { label: 'ภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.1)', base: `ฐาน ฿${formatCurrency(record.taxBaseAmount)}`, amount: record.withholdingTax },
    { label: 'เงินสมทบกองทุนสงเคราะห์', base: record.welfareFundBase ? `ฐาน ฿${formatCurrency(record.welfareFundBase)}` : undefined, amount: record.welfareFundContribution },
    { label: 'เงินกู้ยืมเพื่อการศึกษา (กยศ.)', amount: record.studentLoanKys },
    { label: 'เงินกู้ยืมเพื่อการศึกษา (กรอ.)', amount: record.studentLoanKro },
    { label: 'เงินหักอื่นๆ', amount: record.totalOtherDeductions },
  ].filter((item) => (item.amount || 0) > 0);

  const totalEarnings = (record.totalWorkWage || 0) + (record.totalAdditions || 0) + (record.totalOtherAdditions || 0);
  const totalDeductions = record.totalDeductions || (record.ssoContribution + record.withholdingTax + (record.welfareFundContribution || 0) + (record.studentLoanKys || 0) + (record.studentLoanKro || 0) + (record.totalOtherDeductions || 0));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-orange-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar (Screen Only) */}
        <div className="print:hidden px-6 py-4 border-b border-orange-100 bg-orange-50/40 flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevRecord && onSelectRecord(prevRecord)}
              disabled={!prevRecord}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>คนก่อนหน้า</span>
            </button>
            <span className="text-xs text-stone-500 font-mono">
              {currentIndex + 1} / {allRecords.length}
            </span>
            <button
              onClick={() => nextRecord && onSelectRecord(nextRecord)}
              disabled={!nextRecord}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>คนถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm shadow-orange-500/25 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์สลิปเงินเดือน / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 print:overflow-visible">
          {/* Payslip Header */}
          <div className="border-b-2 border-orange-500 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
                  PV
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-stone-900">
                    ใบแจ้งเงินเดือน / PAY SLIP
                  </h2>
                  <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                    <span>บริษัท เพย์โรล เวอร์เท็กซ์ แมนูแฟคเจอริ่ง จำกัด</span>
                    <span>•</span>
                    <span className="font-mono text-orange-700">Payroll_Vertex System</span>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-stone-600">
                <div className="font-semibold text-stone-800">งวดการจ่าย: ประจำเดือนปัจจุบัน</div>
                <div className="text-stone-400 mt-0.5">วันที่พิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium text-[11px]">
                  ✓ ชำระผ่านระบบบัญชีธนาคารเรียบร้อย
                </div>
              </div>
            </div>
          </div>

          {/* Employee Profile Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-orange-50/40 rounded-2xl border border-orange-100 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">รหัสพนักงาน</span>
              <span className="font-mono font-bold text-orange-800 text-sm">{record.empId}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">ชื่อ - นามสกุล</span>
              <span className="font-semibold text-stone-900 text-sm">{record.empName}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">รหัสสังกัด / แผนก</span>
              <span className="font-medium text-stone-800">
                {record.deptCode} {record.deptName ? `(${record.deptName})` : ''}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">อัตราค่าจ้าง / วันทำงาน</span>
              <span className="font-medium text-stone-800 font-mono">
                ฿{formatCurrency(record.baseWage)}/วัน ({record.workDays || 0} วัน)
              </span>
            </div>
          </div>

          {/* Ledger Table (Earnings & Deductions) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box: Earnings (รายการรับ) */}
            <div className="border border-emerald-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
              <div className="bg-emerald-50/90 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  รายการได้ (Earnings)
                </span>
                <span className="text-[11px] font-semibold text-emerald-800">จำนวนเงิน (บาท)</span>
              </div>

              <div className="p-3 divide-y divide-stone-100 flex-1 text-xs space-y-1">
                {earningsList.length === 0 ? (
                  <div className="py-4 text-center text-stone-400">ไม่มีรายการเงินได้</div>
                ) : (
                  earningsList.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 hover:bg-stone-50/60 px-1 rounded">
                      <div className="flex flex-col">
                        <span className="text-stone-700">{item.label}</span>
                        {item.hours && <span className="text-[10px] text-stone-400 font-mono">{item.hours}</span>}
                      </div>
                      <span className="font-mono font-medium text-stone-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-emerald-50/60 px-4 py-2.5 border-t border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>รวมเงินได้ทั้งหมด</span>
                <span className="font-mono text-sm">฿{formatCurrency(totalEarnings)}</span>
              </div>
            </div>

            {/* Right Box: Deductions (รายการหัก) */}
            <div className="border border-rose-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
              <div className="bg-rose-50/90 px-4 py-2.5 border-b border-rose-200 flex items-center justify-between">
                <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  รายการหัก (Deductions)
                </span>
                <span className="text-[11px] font-semibold text-rose-800">จำนวนเงิน (บาท)</span>
              </div>

              <div className="p-3 divide-y divide-stone-100 flex-1 text-xs space-y-1">
                {deductionsList.length === 0 ? (
                  <div className="py-4 text-center text-stone-400">ไม่มีรายการเงินหัก</div>
                ) : (
                  deductionsList.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 hover:bg-stone-50/60 px-1 rounded">
                      <div className="flex flex-col">
                        <span className="text-stone-700">{item.label}</span>
                        {item.base && <span className="text-[10px] text-stone-400 font-mono">{item.base}</span>}
                      </div>
                      <span className="font-mono font-medium text-rose-700">
                        -{formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-rose-50/60 px-4 py-2.5 border-t border-rose-200 flex items-center justify-between text-xs font-bold text-rose-900">
                <span>รวมเงินหักทั้งหมด</span>
                <span className="font-mono text-sm">-฿{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay Grand Box */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 rounded-2xl shadow-md border border-orange-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-orange-100 font-medium block">
                ยอดเงินรับสุทธิ (NET TAKE-HOME PAY)
              </span>
              <div className="text-xs text-orange-100/90 mt-1">
                ตัวอักษร: <span className="font-medium text-white">{thaiBahtText(record.netPay)}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-black tracking-tight font-mono">
                ฿{formatCurrency(record.netPay)}
              </div>
            </div>
          </div>

          {/* Signatures & Verification (Print friendly) */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-stone-200 text-xs text-stone-600">
            <div className="text-center space-y-8">
              <p>ลงชื่อ .............................................................. ผู้จ่ายเงิน</p>
              <p className="text-stone-400 text-[11px]">( เจ้าหน้าที่ฝ่ายการเงิน / HR )</p>
            </div>
            <div className="text-center space-y-8">
              <p>ลงชื่อ .............................................................. ผู้รับเงิน</p>
              <p className="text-stone-400 text-[11px]">( {record.empName} )</p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Screen Only) */}
        <div className="print:hidden px-6 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>* เอกสารนี้สร้างขึ้นโดยอัตโนมัติจากระบบ Payroll_Vertex</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-medium transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
