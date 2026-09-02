import React from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { ColumnCategorySelector } from './components/ColumnCategorySelector';
import { PayrollTable } from './components/PayrollTable';
import { PayslipModal } from './components/PayslipModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { PayrollAnalytics } from './components/PayrollAnalytics';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { PayrollRecord, ColumnCategory } from './types';
import { SAMPLE_PAYROLL_DATA } from './data/sampleData';
import { ALL_PAYROLL_COLUMNS } from './data/columns';
import { fetchGoogleSheetPayroll } from './utils/payrollUtils';
import { Sparkles, FileSpreadsheet, PlusCircle, CheckCircle, Info } from 'lucide-react';

export default function App() {
  // Application state
  const [records, setRecords] = React.useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('payroll_vertex_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse cached records', e);
      }
    }
    return SAMPLE_PAYROLL_DATA;
  });

  const [activeSource, setActiveSource] = React.useState<'google_sheet' | 'file' | 'sample' | 'manual'>(() => {
    return (localStorage.getItem('payroll_vertex_source') as any) || 'sample';
  });

  const [activeSheetUrl, setActiveSheetUrl] = React.useState<string>(() => {
    return localStorage.getItem('payroll_vertex_sheet_url') || '';
  });

  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = React.useState<ColumnCategory>('all');
  
  // Visible columns state (default: all 46 columns)
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(() => {
    return ALL_PAYROLL_COLUMNS.map((c) => c.key);
  });

  // Modals state
  const [showGoogleSheetModal, setShowGoogleSheetModal] = React.useState(false);
  const [selectedPayslipRecord, setSelectedPayslipRecord] = React.useState<PayrollRecord | null>(null);
  const [editingRecord, setEditingRecord] = React.useState<PayrollRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [showAnalytics, setShowAnalytics] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);

  // Sync state to LocalStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('payroll_vertex_records', JSON.stringify(records));
      localStorage.setItem('payroll_vertex_source', activeSource);
      if (activeSheetUrl) {
        localStorage.setItem('payroll_vertex_sheet_url', activeSheetUrl);
      }
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [records, activeSource, activeSheetUrl]);

  // Show flash notification
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Category change handler
  const handleSelectCategory = (cat: ColumnCategory) => {
    setCurrentCategory(cat);
    if (cat === 'all') {
      setVisibleColumns(ALL_PAYROLL_COLUMNS.map((c) => c.key));
    } else if (cat === 'summary') {
      setVisibleColumns([
        'empId',
        'empName',
        'deptCode',
        'baseWage',
        'workDays',
        'totalWorkWage',
        'totalAdditions',
        'totalDeductions',
        'ssoContribution',
        'withholdingTax',
        'netPay',
      ]);
    } else if (cat === 'hours') {
      setVisibleColumns([
        'empId',
        'empName',
        'deptCode',
        'workDays',
        'normalOtHours',
        'holidayWorkDays',
        'holidayOtHours',
        'pubHolidayWorkDays',
        'pubHolidayOtHours',
      ]);
    } else if (cat === 'wages') {
      setVisibleColumns([
        'empId',
        'empName',
        'deptCode',
        'baseWage',
        'workWagePay',
        'normalOtPay',
        'holidayWorkPay',
        'holidayOtPay',
        'pubHolidayWorkPay',
        'pubHolidayOtPay',
        'totalWorkWage',
      ]);
    } else if (cat === 'allowances') {
      setVisibleColumns([
        'empId',
        'empName',
        'annualLeavePay',
        'otherLeavePay',
        'pubHolidayPay',
        'teamIncentivePay',
        'effBonus',
        'diligenceAllowance',
        'referralBonus',
        'positionAllowance',
        'perDiemAllowance',
        'skillAllowance',
        'ssoRefund',
        'otherIncome',
        'longServiceAward',
        'totalAdditions',
      ]);
    } else if (cat === 'deductions') {
      setVisibleColumns([
        'empId',
        'empName',
        'ssoBaseAmount',
        'ssoContribution',
        'welfareFundBase',
        'welfareFundContribution',
        'taxBaseAmount',
        'withholdingTax',
        'studentLoanKys',
        'studentLoanKro',
        'totalOtherDeductions',
        'totalDeductions',
      ]);
    } else if (cat === 'net') {
      setVisibleColumns([
        'empId',
        'empName',
        'deptCode',
        'totalWorkWage',
        'totalAdditions',
        'totalDeductions',
        'grossIncome',
        'netPay',
      ]);
    }
  };

  // Toggle single column
  const handleToggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Reset columns
  const handleResetColumns = () => {
    setVisibleColumns(ALL_PAYROLL_COLUMNS.map((c) => c.key));
    setCurrentCategory('all');
  };

  // Select all columns
  const handleSelectAllColumns = () => {
    setVisibleColumns(ALL_PAYROLL_COLUMNS.map((c) => c.key));
  };

  // Refresh Google Sheet Data
  const handleRefreshData = async () => {
    if (activeSource === 'google_sheet' && activeSheetUrl) {
      setIsLoading(true);
      try {
        const freshRecords = await fetchGoogleSheetPayroll(activeSheetUrl);
        setRecords(freshRecords);
        setLastUpdated(new Date());
        showToast(`รีเฟรชข้อมูลจาก Google Sheet เรียบร้อย (${freshRecords.length} รายการ)`);
      } catch (err: any) {
        showToast(`เกิดข้อผิดพลาดในการรีเฟรช: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      setLastUpdated(new Date());
      showToast('อัปเดตสถานะข้อมูลล่าสุดเรียบร้อย');
    }
  };

  // Handle data loaded from Modal
  const handleDataLoaded = (
    loadedRecords: PayrollRecord[],
    source: 'google_sheet' | 'file' | 'sample',
    sheetUrl?: string
  ) => {
    setRecords(loadedRecords);
    setActiveSource(source);
    if (sheetUrl) setActiveSheetUrl(sheetUrl);
    setLastUpdated(new Date());
    showToast(`โหลดข้อมูลสำเร็จ! อัปเดตพนักงานจำนวน ${loadedRecords.length} คน`);
  };

  // Save Employee Record (Add or Update)
  const handleSaveRecord = (savedRecord: PayrollRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === savedRecord.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedRecord;
        return updated;
      }
      return [savedRecord, ...prev];
    });
    setActiveSource('manual');
    showToast(`บันทึกข้อมูลพนักงาน ${savedRecord.empName} เรียบร้อยแล้ว`);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 flex flex-col font-['Prompt',sans-serif]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        records={records}
        activeSource={activeSource}
        sheetUrl={activeSheetUrl}
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onOpenGoogleSheetModal={() => setShowGoogleSheetModal(true)}
        onOpenUploadModal={() => setShowGoogleSheetModal(true)}
        onRefreshData={handleRefreshData}
        onOpenAddModal={() => {
          setEditingRecord(null);
          setIsEditModalOpen(true);
        }}
        onOpenAnalytics={() => setShowAnalytics(!showAnalytics)}
        showAnalytics={showAnalytics}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner Card / Instructions */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-orange-500/15 mb-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-semibold tracking-wide">
                  ระบบคำนวณเงินเดือนมาตรฐาน 46 รายการ
                </span>
                <span className="text-orange-100 text-xs font-mono">• Thai Payroll Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Payroll_Vertex • แพลตฟอร์มเรียกดูและจัดการข้อมูลเงินเดือน
              </h2>
              <p className="text-xs sm:text-sm text-orange-50 leading-relaxed">
                รองรับการเชื่อมต่อกับ Google Sheet โดยตรง หรืออัปโหลดไฟล์ตาราง พร้อมแจกแจงค่าแรงปกติ ล่วงเวลา เบี้ยขยัน ค่าตำแหน่ง ประกันสังคม ภาษี และพิมพ์สลิปเงินเดือน (Payslip) ครบถ้วน
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowGoogleSheetModal(true)}
                className="px-4 py-2 bg-white text-orange-600 hover:bg-orange-50 rounded-xl font-bold text-xs shadow-md shadow-black/10 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>เชื่อมโยง Google Sheet ใหม่</span>
              </button>

              <button
                onClick={() => handleDataLoaded(SAMPLE_PAYROLL_DATA, 'sample')}
                className="px-3.5 py-2 bg-orange-600/60 hover:bg-orange-600/80 text-white rounded-xl font-medium text-xs border border-white/20 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>โหลดชุดข้อมูลตัวอย่าง</span>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Section (Collapsible) */}
        {showAnalytics && (
          <PayrollAnalytics records={records} onClose={() => setShowAnalytics(false)} />
        )}

        {/* 5 KPI Stat Summary Cards */}
        <StatsCards records={records} />

        {/* Column Category Tabs & Customizer */}
        <ColumnCategorySelector
          currentCategory={currentCategory}
          onSelectCategory={handleSelectCategory}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          onResetColumns={handleResetColumns}
          onSelectAllColumns={handleSelectAllColumns}
        />

        {/* Main Payroll Table */}
        <PayrollTable
          records={records}
          visibleColumns={visibleColumns}
          onViewPayslip={(rec) => setSelectedPayslipRecord(rec)}
          onEditRecord={(rec) => {
            setEditingRecord(rec);
            setIsEditModalOpen(true);
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-100 bg-white py-4 mt-auto">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-orange-600">Payroll_Vertex</span>
            <span>•</span>
            <span>ระบบเรียกดูข้อมูลเงินเดือน 46 รายการ</span>
          </div>
          <div>
            พัฒนาด้วยมาตรฐานความปลอดภัย ไม่เก็บข้อมูลลับภายนอก รองรับการส่งออก Excel/CSV และพิมพ์สลิปเงินเดือน
          </div>
        </div>
      </footer>

      {/* Payslip Modal */}
      {selectedPayslipRecord && (
        <PayslipModal
          record={selectedPayslipRecord}
          allRecords={records}
          onClose={() => setSelectedPayslipRecord(null)}
          onSelectRecord={(rec) => setSelectedPayslipRecord(rec)}
        />
      )}

      {/* Google Sheet & Import Modal */}
      <GoogleSheetModal
        isOpen={showGoogleSheetModal}
        onClose={() => setShowGoogleSheetModal(false)}
        onDataLoaded={handleDataLoaded}
      />

      {/* Add / Edit Employee Record Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        record={editingRecord}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveRecord}
      />
    </div>
  );
}
