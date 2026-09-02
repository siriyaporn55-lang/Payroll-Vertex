/**
 * Payroll_Vertex Type Definitions
 * Complete 46 Thai Payroll Columns & View Models
 */

export interface PayrollRecord {
  id: string; // Internal unique ID
  empId: string; // รหัสพนักงาน
  empName: string; // ชื่อพนักงาน
  deptCode: string; // รหัสสังกัด
  deptName?: string; // ชื่อแผนก (optional helper)

  // 1. Working Time & Hours (วันทำงานและล่วงเวลา)
  baseWage: number; // เงินค่าแรง (บาท/วัน หรือ บาท/เดือน)
  workDays: number; // จำนวนวันทำงาน
  normalOtHours: number; // ล่วงเวลาปกติ (ชม.)
  holidayWorkDays: number; // ทำงานวันหยุด (วัน/ชม.)
  holidayOtHours: number; // ล่วงเวลาวันหยุด (ชม.)
  pubHolidayWorkDays: number; // ทำงานวันนักขัตฤกษ์ (วัน/ชม.)
  pubHolidayOtHours: number; // ล่วงเวลาวันนักขัตฤกษ์ (ชม.)

  // 2. Base Wage & OT Calculations (ค่าแรงและโอที)
  workWagePay: number; // ค่าแรงทำงาน
  normalOtPay: number; // ค่าแรงล่วงเวลาปกติ
  holidayWorkPay: number; // ค่าแรงทำงานวันหยุด
  holidayOtPay: number; // ค่าแรงล่วงเวลาวันหยุด
  pubHolidayWorkPay: number; // ค่าแรงทำงานวันนักขัตฤกษ์
  pubHolidayOtPay: number; // ค่าแรงล่วงเวลาวันนักขัตฤกษ์
  totalWorkWage: number; // รวมค่าแรงทำงานทั้งหมด

  // 3. Paid Leaves & Incentives (ค่าลาและเงินจูงใจ)
  annualLeavePay: number; // ค่าลาพักร้อน (จ่าย)
  otherLeavePay: number; // ค่าลาอื่น ๆ (จ่าย)
  pubHolidayPay: number; // ค่าแรงวันหยุดนักขัตฤกษ์
  teamIncentivePay: number; // เงินค่าแรงเหมาทีม(จูงใจ)
  effBonus: number; // EFF
  diligenceAllowance: number; // เบี้ยขยัน
  referralBonus: number; // ค่าแนะนำพนักงาน
  positionAllowance: number; // ค่าตำแหน่ง
  perDiemAllowance: number; // เบี้ยเลี้ยง
  skillAllowance: number; // ค่าทักษะ ฝีมือ
  ssoRefund: number; // คืนเงินประกันสังคม
  otherIncome: number; // เงินได้อื่นๆ
  retirementPay: number; // เงินเกษียณอายุ
  longServiceAward: number; // เงินรางวัลอายุงาน

  // 4. Totals & Deductions (รวมรายได้และเงินหัก)
  totalAdditions: number; // รวมรายได้เพิ่ม
  totalOtherAdditions: number; // รวมรายได้เพิ่มอื่นๆ
  totalDeductions: number; // รวมเงินหัก
  totalOtherDeductions: number; // รวมเงินหัก (อื่นๆ)
  grossIncome: number; // รายได้สุทธิ (ยอดรวมก่อนหักภาษี/ปกส)

  // 5. Social Security, Taxes & Funds (ปกส., ภาษี, กองทุน, กยศ/กรอ)
  ssoBaseAmount: number; // รวมเงินที่คิดประกันสังคม
  ssoContribution: number; // ค่าประกันสังคม
  welfareFundBase: number; // เงินที่นำมาคิดกองทุนสงเคราะห์
  welfareFundContribution: number; // เงินสมทบกองทุนสงเคราะห์
  taxBaseAmount: number; // รวมเงินที่คิดภาษี(ภ.ง.ด.1)
  vacationRefund: number; // คืนเงินพักร้อน
  withholdingTax: number; // ค่าภาษี
  studentLoanKys: number; // กยศ
  studentLoanKro: number; // กรอ

  // 6. Net Take-Home (ค่าแรงสุทธิ)
  netPay: number; // ค่าแรงสุทธิ
}

export type ColumnCategory = 
  | 'all' 
  | 'summary' 
  | 'hours' 
  | 'wages' 
  | 'allowances' 
  | 'deductions' 
  | 'net';

export interface ColumnDefinition {
  key: keyof PayrollRecord;
  labelTh: string;
  labelEn: string;
  category: 'info' | 'hours' | 'wages' | 'allowances' | 'deductions' | 'net';
  type: 'text' | 'number' | 'currency' | 'hours';
  description?: string;
  isImportant?: boolean;
}

export interface PayrollFilterState {
  searchQuery: string;
  selectedDept: string;
  minNetPay: number | '';
  maxNetPay: number | '';
  category: ColumnCategory;
  sortBy: keyof PayrollRecord;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface PayrollSummaryStats {
  totalEmployees: number;
  totalNetPay: number;
  totalWorkWage: number;
  totalAdditions: number;
  totalDeductions: number;
  totalSso: number;
  totalTax: number;
  avgNetPay: number;
  maxNetPay: number;
  minNetPay: number;
  totalOtHours: number;
}
