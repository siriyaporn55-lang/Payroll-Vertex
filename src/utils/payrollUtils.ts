import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PayrollRecord } from '../types';
import { ALL_PAYROLL_COLUMNS, RAW_THAI_HEADER_MAP } from '../data/columns';

/**
 * Format currency in Thai Baht
 */
export function formatCurrency(amount: number | undefined | null, includeSymbol = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return includeSymbol ? `฿${formatted}` : formatted;
}

/**
 * Format hours or days
 */
export function formatNumber(value: number | undefined | null, decimals = 0): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Convert number to Thai Baht text (เช่น หนึ่งหมื่นสองพันห้าร้อยบาทถ้วน)
 */
export function thaiBahtText(num: number): string {
  if (isNaN(num) || num === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const convertGroup = (nStr: string): string => {
    let res = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1 && parseInt(nStr.charAt(len - 2), 10) !== 0) {
          res += 'เอ็ด';
        } else if (pos === 1 && digit === 1) {
          res += '';
        } else if (pos === 1 && digit === 2) {
          res += 'ยี่';
        } else {
          res += numbers[digit];
        }
        res += units[pos];
      }
    }
    return res;
  };

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(2).split('.');
  let bahtPart = parts[0];
  const satangPart = parts[1];

  let bahtText = '';
  if (parseInt(bahtPart, 10) === 0) {
    bahtText = 'ศูนย์บาท';
  } else {
    // Handle millions
    while (bahtPart.length > 6) {
      const cut = bahtPart.slice(0, -6);
      bahtPart = bahtPart.slice(-6);
      bahtText = convertGroup(cut) + 'ล้าน' + bahtText;
    }
    bahtText += convertGroup(bahtPart) + 'บาท';
  }

  let satangText = '';
  if (parseInt(satangPart, 10) === 0) {
    satangText = 'ถ้วน';
  } else {
    const s1 = parseInt(satangPart.charAt(0), 10);
    const s2 = parseInt(satangPart.charAt(1), 10);
    if (s1 > 0) {
      if (s1 === 1) satangText += 'สิบ';
      else if (s1 === 2) satangText += 'ยี่สิบ';
      else satangText += numbers[s1] + 'สิบ';
    }
    if (s2 > 0) {
      if (s2 === 1 && s1 > 0) satangText += 'เอ็ด';
      else satangText += numbers[s2];
    }
    satangText += 'สตางค์';
  }

  return (isNegative ? 'ลบ' : '') + bahtText + satangText;
}

/**
 * Extract Google Sheet ID and GID from any Google Sheets URL
 */
export function extractGoogleSheetInfo(url: string): { sheetId: string | null; gid: string } {
  try {
    const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    return {
      sheetId: sheetIdMatch ? sheetIdMatch[1] : null,
      gid: gidMatch ? gidMatch[1] : '0',
    };
  } catch {
    return { sheetId: null, gid: '0' };
  }
}

/**
 * Construct Google Sheet CSV endpoint for fetching
 */
export function getGoogleSheetCsvUrl(urlOrId: string, gid = '0'): string {
  if (urlOrId.startsWith('http://') || urlOrId.startsWith('https://')) {
    const info = extractGoogleSheetInfo(urlOrId);
    if (info.sheetId) {
      return `https://docs.google.com/spreadsheets/d/${info.sheetId}/gviz/tq?tqx=out:csv&gid=${info.gid || '0'}`;
    }
    return urlOrId;
  }
  return `https://docs.google.com/spreadsheets/d/${urlOrId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

/**
 * Clean and convert raw text cell to number
 */
export function parseNumberCell(val: unknown): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/,/g, '').replace(/฿/g, '').trim();
  if (!str || str === '-' || str === 'N/A') return 0;
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse Raw Table Matrix or CSV Rows into typed PayrollRecord array
 */
export function parsePayrollMatrix(headers: string[], rows: (string | number)[][]): PayrollRecord[] {
  // Build header mapping
  const colIndexMap: Partial<Record<keyof PayrollRecord, number>> = {};
  
  headers.forEach((rawHeader, idx) => {
    const cleanHeader = String(rawHeader || '').trim();
    if (RAW_THAI_HEADER_MAP[cleanHeader]) {
      colIndexMap[RAW_THAI_HEADER_MAP[cleanHeader]] = idx;
    } else {
      // Fuzzy matching
      for (const [thaiKey, recordKey] of Object.entries(RAW_THAI_HEADER_MAP)) {
        if (cleanHeader.toLowerCase().includes(thaiKey.toLowerCase()) || thaiKey.toLowerCase().includes(cleanHeader.toLowerCase())) {
          if (colIndexMap[recordKey] === undefined) {
            colIndexMap[recordKey] = idx;
          }
        }
      }
    }
  });

  const records: PayrollRecord[] = [];

  rows.forEach((row, rowIndex) => {
    if (!row || row.length === 0) return;
    
    // Check if row has at least an empId or empName
    const getVal = (key: keyof PayrollRecord) => {
      const idx = colIndexMap[key];
      if (idx !== undefined && row[idx] !== undefined) {
        return row[idx];
      }
      return undefined;
    };

    const empId = String(getVal('empId') || (row[0] !== undefined ? row[0] : `EMP-${rowIndex + 1}`)).trim();
    const empName = String(getVal('empName') || (row[1] !== undefined ? row[1] : `พนักงาน ${rowIndex + 1}`)).trim();
    const deptCode = String(getVal('deptCode') || (row[2] !== undefined ? row[2] : 'D01')).trim();

    if (!empId && !empName) return; // empty row

    // Extract all numbers
    const baseWage = parseNumberCell(getVal('baseWage'));
    const workDays = parseNumberCell(getVal('workDays'));
    const normalOtHours = parseNumberCell(getVal('normalOtHours'));
    const holidayWorkDays = parseNumberCell(getVal('holidayWorkDays'));
    const holidayOtHours = parseNumberCell(getVal('holidayOtHours'));
    const pubHolidayWorkDays = parseNumberCell(getVal('pubHolidayWorkDays'));
    const pubHolidayOtHours = parseNumberCell(getVal('pubHolidayOtHours'));

    const workWagePay = parseNumberCell(getVal('workWagePay'));
    const normalOtPay = parseNumberCell(getVal('normalOtPay'));
    const holidayWorkPay = parseNumberCell(getVal('holidayWorkPay'));
    const holidayOtPay = parseNumberCell(getVal('holidayOtPay'));
    const pubHolidayWorkPay = parseNumberCell(getVal('pubHolidayWorkPay'));
    const pubHolidayOtPay = parseNumberCell(getVal('pubHolidayOtPay'));
    
    let totalWorkWage = parseNumberCell(getVal('totalWorkWage'));
    if (totalWorkWage === 0 && (workWagePay > 0 || normalOtPay > 0 || holidayWorkPay > 0)) {
      totalWorkWage = workWagePay + normalOtPay + holidayWorkPay + holidayOtPay + pubHolidayWorkPay + pubHolidayOtPay;
    }

    const annualLeavePay = parseNumberCell(getVal('annualLeavePay'));
    const otherLeavePay = parseNumberCell(getVal('otherLeavePay'));
    const pubHolidayPay = parseNumberCell(getVal('pubHolidayPay'));
    const teamIncentivePay = parseNumberCell(getVal('teamIncentivePay'));
    const effBonus = parseNumberCell(getVal('effBonus'));
    const diligenceAllowance = parseNumberCell(getVal('diligenceAllowance'));
    const referralBonus = parseNumberCell(getVal('referralBonus'));
    const positionAllowance = parseNumberCell(getVal('positionAllowance'));
    const perDiemAllowance = parseNumberCell(getVal('perDiemAllowance'));
    const skillAllowance = parseNumberCell(getVal('skillAllowance'));
    const ssoRefund = parseNumberCell(getVal('ssoRefund'));
    const otherIncome = parseNumberCell(getVal('otherIncome'));
    const retirementPay = parseNumberCell(getVal('retirementPay'));
    const longServiceAward = parseNumberCell(getVal('longServiceAward'));

    let totalAdditions = parseNumberCell(getVal('totalAdditions'));
    if (totalAdditions === 0) {
      totalAdditions = annualLeavePay + otherLeavePay + pubHolidayPay + teamIncentivePay + 
        effBonus + diligenceAllowance + referralBonus + positionAllowance + perDiemAllowance + 
        skillAllowance + ssoRefund + otherIncome + retirementPay + longServiceAward;
    }
    
    const totalOtherAdditions = parseNumberCell(getVal('totalOtherAdditions'));
    const totalDeductions = parseNumberCell(getVal('totalDeductions'));
    const totalOtherDeductions = parseNumberCell(getVal('totalOtherDeductions'));
    
    let grossIncome = parseNumberCell(getVal('grossIncome'));
    if (grossIncome === 0) {
      grossIncome = totalWorkWage + totalAdditions + totalOtherAdditions;
    }

    const ssoBaseAmount = parseNumberCell(getVal('ssoBaseAmount')) || Math.min(15000, totalWorkWage || 15000);
    const ssoContribution = parseNumberCell(getVal('ssoContribution')) || Math.round(ssoBaseAmount * 0.05);
    const welfareFundBase = parseNumberCell(getVal('welfareFundBase'));
    const welfareFundContribution = parseNumberCell(getVal('welfareFundContribution'));
    const taxBaseAmount = parseNumberCell(getVal('taxBaseAmount'));
    const vacationRefund = parseNumberCell(getVal('vacationRefund'));
    const withholdingTax = parseNumberCell(getVal('withholdingTax'));
    const studentLoanKys = parseNumberCell(getVal('studentLoanKys'));
    const studentLoanKro = parseNumberCell(getVal('studentLoanKro'));

    let netPay = parseNumberCell(getVal('netPay'));
    if (netPay === 0) {
      const calculatedDeductions = totalDeductions > 0 ? totalDeductions : (ssoContribution + withholdingTax + welfareFundContribution + studentLoanKys + studentLoanKro + totalOtherDeductions);
      netPay = grossIncome - calculatedDeductions + vacationRefund;
    }

    records.push({
      id: `emp-${empId}-${rowIndex}`,
      empId,
      empName,
      deptCode,
      baseWage,
      workDays,
      normalOtHours,
      holidayWorkDays,
      holidayOtHours,
      pubHolidayWorkDays,
      pubHolidayOtHours,
      workWagePay,
      normalOtPay,
      holidayWorkPay,
      holidayOtPay,
      pubHolidayWorkPay,
      pubHolidayOtPay,
      totalWorkWage,
      annualLeavePay,
      otherLeavePay,
      pubHolidayPay,
      teamIncentivePay,
      effBonus,
      diligenceAllowance,
      referralBonus,
      positionAllowance,
      perDiemAllowance,
      skillAllowance,
      ssoRefund,
      otherIncome,
      retirementPay,
      longServiceAward,
      totalAdditions,
      totalOtherAdditions,
      totalDeductions: totalDeductions > 0 ? totalDeductions : (ssoContribution + withholdingTax + welfareFundContribution + studentLoanKys + studentLoanKro),
      totalOtherDeductions,
      grossIncome,
      ssoBaseAmount,
      ssoContribution,
      welfareFundBase,
      welfareFundContribution,
      taxBaseAmount,
      vacationRefund,
      withholdingTax,
      studentLoanKys,
      studentLoanKro,
      netPay
    });
  });

  return records;
}

/**
 * Parse CSV / TSV string directly
 */
export function parseCsvContent(csvString: string): PayrollRecord[] {
  const result = Papa.parse<string[]>(csvString.trim(), {
    header: false,
    skipEmptyLines: true,
  });

  if (!result.data || result.data.length === 0) return [];

  const [headers, ...rows] = result.data;
  return parsePayrollMatrix(headers, rows);
}

/**
 * Fetch Google Sheet via public CSV URL
 */
export async function fetchGoogleSheetPayroll(urlOrId: string, gid = '0'): Promise<PayrollRecord[]> {
  const csvUrl = getGoogleSheetCsvUrl(urlOrId, gid);
  
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดข้อมูลจาก Google Sheet ได้ (สถานะ: ${response.status} ${response.statusText}) โปรดตรวจสอบว่าได้ตั้งค่าแชร์ลิงก์เป็น 'ทุกคนที่มีลิงก์มีสิทธิ์ดู' หรือ Publish to Web แล้ว`);
  }

  const csvText = await response.text();
  if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
    throw new Error('ลิงก์ Google Sheet ไม่ได้เปิดสิทธิ์เข้าถึงสาธารณะ หรือลิงก์ไม่ถูกต้อง โปรดตั้งค่า Share -> Anyone with the link can view');
  }

  const records = parseCsvContent(csvText);
  if (records.length === 0) {
    throw new Error('ไม่พบข้อมูลพนักงานใน Google Sheet หรือรูปแบบตารางไม่ตรงกับ 46 คอลัมน์ที่กำหนด');
  }

  return records;
}

/**
 * Export Records to Excel (.xlsx)
 */
export function exportToExcel(records: PayrollRecord[], fileName = 'Payroll_Vertex_Export.xlsx') {
  const headers = ALL_PAYROLL_COLUMNS.map(c => c.labelTh);
  const dataRows = records.map(rec => {
    return ALL_PAYROLL_COLUMNS.map(col => rec[col.key] ?? '');
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  
  // Set column widths
  ws['!cols'] = ALL_PAYROLL_COLUMNS.map(col => ({
    wch: Math.max(col.labelTh.length * 2, 14),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'รายงานเงินเดือน');
  XLSX.writeFile(wb, fileName);
}

/**
 * Export Records to CSV with UTF-8 BOM
 */
export function exportToCsv(records: PayrollRecord[], fileName = 'Payroll_Vertex_Export.csv') {
  const headers = ALL_PAYROLL_COLUMNS.map(c => `"${c.labelTh.replace(/"/g, '""')}"`).join(',');
  const rows = records.map(rec => {
    return ALL_PAYROLL_COLUMNS.map(col => {
      const val = rec[col.key];
      if (typeof val === 'number') return val;
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
