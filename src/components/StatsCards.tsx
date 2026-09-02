import React from 'react';
import { 
  Users, 
  Wallet, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  BadgePercent
} from 'lucide-react';
import { PayrollRecord, PayrollSummaryStats } from '../types';
import { formatCurrency, formatNumber } from '../utils/payrollUtils';

interface StatsCardsProps {
  records: PayrollRecord[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ records }) => {
  const stats: PayrollSummaryStats = React.useMemo(() => {
    if (records.length === 0) {
      return {
        totalEmployees: 0,
        totalNetPay: 0,
        totalWorkWage: 0,
        totalAdditions: 0,
        totalDeductions: 0,
        totalSso: 0,
        totalTax: 0,
        avgNetPay: 0,
        maxNetPay: 0,
        minNetPay: 0,
        totalOtHours: 0,
      };
    }

    let totalNetPay = 0;
    let totalWorkWage = 0;
    let totalAdditions = 0;
    let totalDeductions = 0;
    let totalSso = 0;
    let totalTax = 0;
    let maxNet = -Infinity;
    let minNet = Infinity;
    let totalOtHours = 0;

    records.forEach((r) => {
      const net = r.netPay || 0;
      totalNetPay += net;
      totalWorkWage += r.totalWorkWage || 0;
      totalAdditions += r.totalAdditions || 0;
      totalDeductions += r.totalDeductions || 0;
      totalSso += r.ssoContribution || 0;
      totalTax += r.withholdingTax || 0;
      totalOtHours += (r.normalOtHours || 0) + (r.holidayOtHours || 0) + (r.pubHolidayOtHours || 0);

      if (net > maxNet) maxNet = net;
      if (net < minNet) minNet = net;
    });

    const totalEmployees = records.length;
    const avgNetPay = totalEmployees > 0 ? totalNetPay / totalEmployees : 0;

    return {
      totalEmployees,
      totalNetPay,
      totalWorkWage,
      totalAdditions,
      totalDeductions,
      totalSso,
      totalTax,
      avgNetPay,
      maxNetPay: maxNet === -Infinity ? 0 : maxNet,
      minNetPay: minNet === Infinity ? 0 : minNet,
      totalOtHours,
    };
  }, [records]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Total Net Payout (Main Highlight) */}
      <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 rounded-2xl shadow-md shadow-orange-500/15 border border-orange-400 relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-orange-100 uppercase tracking-wide">ยอดจ่ายสุทธิรวม</span>
          <div className="p-2 bg-white/20 backdrop-blur-xs rounded-xl">
            <Wallet className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-black tracking-tight text-white">
            ฿{formatCurrency(stats.totalNetPay)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-orange-100">
            <span>เฉลี่ย ฿{formatCurrency(stats.avgNetPay)}/คน</span>
          </div>
        </div>
      </div>

      {/* 2. Total Employees */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-orange-100 hover:border-orange-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-500">จำนวนพนักงาน</span>
          <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold tracking-tight text-stone-900">
            {formatNumber(stats.totalEmployees)} <span className="text-xs font-normal text-stone-500">คน</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            สถานะพร้อมคำนวณทั้งหมด
          </div>
        </div>
      </div>

      {/* 3. Base & OT Wages */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-orange-100 hover:border-orange-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-500">รวมค่าแรงและโอที</span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold tracking-tight text-stone-900">
            ฿{formatCurrency(stats.totalWorkWage)}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <span>โอทีสะสม {formatNumber(stats.totalOtHours, 1)} ชม.</span>
          </div>
        </div>
      </div>

      {/* 4. Total Additions & Allowances */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-orange-100 hover:border-orange-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-500">รวมรายได้เพิ่ม/เบี้ยขยัน</span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            +฿{formatCurrency(stats.totalAdditions)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            เบี้ยขยัน / ตำแหน่ง / ทักษะ
          </div>
        </div>
      </div>

      {/* 5. Total Deductions & Taxes */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-orange-100 hover:border-orange-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-500">รวมเงินหัก / ปกส. / ภาษี</span>
          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold tracking-tight text-rose-600">
            -฿{formatCurrency(stats.totalDeductions)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
            <span>ปกส: ฿{formatCurrency(stats.totalSso)}</span>
            <span>ภาษี: ฿{formatCurrency(stats.totalTax)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
