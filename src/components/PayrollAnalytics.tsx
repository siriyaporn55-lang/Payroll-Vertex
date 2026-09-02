import React from 'react';
import { 
  Building2, 
  TrendingUp, 
  PieChart, 
  Award, 
  ShieldCheck, 
  Clock,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { PayrollRecord } from '../types';
import { formatCurrency, formatNumber } from '../utils/payrollUtils';

interface PayrollAnalyticsProps {
  records: PayrollRecord[];
  onClose: () => void;
}

export const PayrollAnalytics: React.FC<PayrollAnalyticsProps> = ({ records, onClose }) => {
  // Department aggregation
  const deptStats = React.useMemo(() => {
    const map: Record<string, { count: number; totalNet: number; totalOtHours: number; totalAdditions: number }> = {};
    records.forEach((r) => {
      const dept = r.deptCode || 'อื่นๆ';
      if (!map[dept]) {
        map[dept] = { count: 0, totalNet: 0, totalOtHours: 0, totalAdditions: 0 };
      }
      map[dept].count += 1;
      map[dept].totalNet += r.netPay || 0;
      map[dept].totalOtHours += (r.normalOtHours || 0) + (r.holidayOtHours || 0) + (r.pubHolidayOtHours || 0);
      map[dept].totalAdditions += r.totalAdditions || 0;
    });

    const entries = Object.entries(map).map(([dept, data]) => ({
      dept,
      ...data,
      avgNet: data.count > 0 ? data.totalNet / data.count : 0,
    }));

    return entries.sort((a, b) => b.totalNet - a.totalNet);
  }, [records]);

  // Top OT earners
  const topOtEmployees = React.useMemo(() => {
    return [...records]
      .map((r) => ({
        empId: r.empId,
        empName: r.empName,
        deptCode: r.deptCode,
        otHours: (r.normalOtHours || 0) + (r.holidayOtHours || 0) + (r.pubHolidayOtHours || 0),
        otPay: (r.normalOtPay || 0) + (r.holidayOtPay || 0) + (r.pubHolidayOtPay || 0),
        netPay: r.netPay,
      }))
      .sort((a, b) => b.otHours - a.otHours)
      .slice(0, 5);
  }, [records]);

  // Allowances breakdown total
  const allowanceSummary = React.useMemo(() => {
    let diligence = 0;
    let position = 0;
    let skill = 0;
    let incentives = 0;
    let perDiem = 0;
    let others = 0;

    records.forEach((r) => {
      diligence += r.diligenceAllowance || 0;
      position += r.positionAllowance || 0;
      skill += r.skillAllowance || 0;
      incentives += (r.teamIncentivePay || 0) + (r.effBonus || 0);
      perDiem += r.perDiemAllowance || 0;
      others += (r.annualLeavePay || 0) + (r.pubHolidayPay || 0) + (r.otherIncome || 0) + (r.longServiceAward || 0);
    });

    return [
      { name: 'เบี้ยขยัน', amount: diligence, color: 'bg-amber-500' },
      { name: 'ค่าตำแหน่ง', amount: position, color: 'bg-orange-500' },
      { name: 'ค่าทักษะ ฝีมือ', amount: skill, color: 'bg-emerald-500' },
      { name: 'เหมาทีม & EFF', amount: incentives, color: 'bg-blue-500' },
      { name: 'เบี้ยเลี้ยง', amount: perDiem, color: 'bg-indigo-500' },
      { name: 'อื่นๆ (วันหยุด/อายุงาน)', amount: others, color: 'bg-stone-400' },
    ];
  }, [records]);

  const totalAllowances = allowanceSummary.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 mb-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              สถิติและภาพรวมการจ่ายเงินเดือน (Payroll Analytics)
            </h3>
            <p className="text-xs text-stone-500">
              วิเคราะห์ต้นทุนค่าแรง การจ่ายเงินเพิ่ม และชั่วโมงล่วงเวลาแยกตามแผนก
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-stone-500 hover:text-stone-800 px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
        >
          ปิดส่วนนี้
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* 1. Department Net Pay Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-orange-500" />
            <span>ยอดจ่ายสุทธิตามแผนก</span>
          </h4>

          <div className="space-y-2.5">
            {deptStats.map((item) => {
              const maxNet = deptStats[0]?.totalNet || 1;
              const percent = (item.totalNet / maxNet) * 100;

              return (
                <div key={item.dept} className="p-2.5 bg-orange-50/40 rounded-xl border border-orange-100/60 text-xs">
                  <div className="flex justify-between font-semibold text-stone-800 mb-1">
                    <span>{item.dept} ({item.count} คน)</span>
                    <span className="font-mono text-orange-700">฿{formatCurrency(item.totalNet)}</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>เฉลี่ย ฿{formatCurrency(item.avgNet)}/คน</span>
                    <span>โอที {formatNumber(item.totalOtHours, 1)} ชม.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Allowance Distribution */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-amber-500" />
            <span>สัดส่วนเงินได้เพิ่ม & สวัสดิการ</span>
          </h4>

          <div className="p-4 bg-stone-50/60 rounded-2xl border border-stone-100 space-y-3">
            <div className="text-center pb-2 border-b border-stone-200">
              <span className="text-[11px] text-stone-500">รวมสวัสดิการและเงินเพิ่ม</span>
              <div className="text-xl font-extrabold text-emerald-700 font-mono">
                ฿{formatCurrency(totalAllowances)}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {allowanceSummary.map((item) => {
                const percent = totalAllowances > 0 ? (item.amount / totalAllowances) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                      <span className="text-stone-700">{item.name}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-medium text-stone-900">฿{formatCurrency(item.amount)}</span>
                      <span className="text-[10px] text-stone-400 ml-1.5">({percent.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Top OT Earners */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>พนักงานที่มีชั่วโมงโอทีสูงสุด</span>
          </h4>

          <div className="space-y-2">
            {topOtEmployees.map((emp, i) => (
              <div
                key={emp.empId}
                className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-100 shadow-2xs hover:border-orange-200 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    i === 0 ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-stone-900 block">{emp.empName}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{emp.empId} • {emp.deptCode}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="font-bold text-orange-700">{emp.otHours} ชม.</span>
                  <span className="block text-[10px] text-stone-400">โอที ฿{formatCurrency(emp.otPay)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
