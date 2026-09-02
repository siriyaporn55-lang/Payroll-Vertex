import React from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  RefreshCw, 
  Plus, 
  Database,
  Printer,
  FileText
} from 'lucide-react';
import { PayrollRecord } from '../types';
import { exportToExcel, exportToCsv } from '../utils/payrollUtils';

interface NavbarProps {
  records: PayrollRecord[];
  activeSource: 'google_sheet' | 'file' | 'sample' | 'manual';
  sheetUrl?: string;
  lastUpdated: Date;
  isLoading: boolean;
  onOpenGoogleSheetModal: () => void;
  onOpenUploadModal: () => void;
  onRefreshData: () => void;
  onOpenAddModal: () => void;
  onOpenAnalytics: () => void;
  showAnalytics: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  records,
  activeSource,
  lastUpdated,
  isLoading,
  onOpenGoogleSheetModal,
  onOpenUploadModal,
  onRefreshData,
  onOpenAddModal,
  onOpenAnalytics,
  showAnalytics,
}) => {
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const getSourceBadge = () => {
    switch (activeSource) {
      case 'google_sheet':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Google Sheet เชื่อมต่อแล้ว
          </span>
        );
      case 'file':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <FileSpreadsheet className="w-3 h-3 text-amber-600" />
            ไฟล์นำเข้า (CSV/Excel)
          </span>
        );
      case 'sample':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            <Database className="w-3 h-3 text-orange-600" />
            ข้อมูลจำลอง (Sample Data)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
            แก้ไขด้วยตนเอง
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm transition-all">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 ring-2 ring-orange-200">
              <span className="text-xl font-black tracking-tighter">PV</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Payroll_Vertex
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/80 rounded-md">
                  v2.0 Thai Payroll
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden md:block">
                ระบบเรียกดูและคำนวณเงินเดือนพนักงาน 46 รายการ (Google Sheet Integrated)
              </p>
            </div>
          </div>

          {/* Center Status info */}
          <div className="hidden lg:flex items-center gap-3">
            {getSourceBadge()}
            <span className="text-xs text-stone-400">|</span>
            <span className="text-xs text-stone-500">
              อัปเดต: {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
            </span>
            <button
              onClick={onRefreshData}
              disabled={isLoading}
              title="รีเฟรชข้อมูล"
              className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Analytics Toggle */}
            <button
              onClick={onOpenAnalytics}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                showAnalytics
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showAnalytics ? 'ซ่อนแดชบอร์ดสรุป' : 'สถิติและวิเคราะห์'}</span>
            </button>

            {/* Google Sheet Connect Button */}
            <button
              onClick={onOpenGoogleSheetModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-sm shadow-orange-500/25 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ดึงข้อมูล Google Sheet</span>
            </button>

            {/* Upload File Button */}
            <button
              onClick={onOpenUploadModal}
              title="นำเข้าไฟล์ CSV หรือ Excel"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-orange-600" />
              <span>นำเข้าไฟล์</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">ส่งออก (Export)</span>
              </button>

              {showExportMenu && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-100 py-1.5 z-50 text-xs text-stone-700 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowExportMenu(false)}
                >
                  <button
                    onClick={() => exportToExcel(records, `Payroll_Vertex_${new Date().toISOString().slice(0, 10)}.xlsx`)}
                    className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>ส่งออกเป็น Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => exportToCsv(records, `Payroll_Vertex_${new Date().toISOString().slice(0, 10)}.csv`)}
                    className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-amber-600" />
                    <span>ส่งออกเป็น CSV (UTF-8)</span>
                  </button>
                  <div className="h-px bg-stone-100 my-1"></div>
                  <button
                    onClick={() => window.print()}
                    className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-stone-600" />
                    <span>พิมพ์ตาราง / บันทึก PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Add Record button */}
            <button
              onClick={onOpenAddModal}
              title="เพิ่มรายการพนักงานใหม่"
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">เพิ่มพนักงาน</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
