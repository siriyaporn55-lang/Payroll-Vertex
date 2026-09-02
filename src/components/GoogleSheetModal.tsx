import React from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Link as LinkIcon, 
  ClipboardPaste, 
  UploadCloud, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';
import { PayrollRecord } from '../types';
import { fetchGoogleSheetPayroll, parseCsvContent, parsePayrollMatrix, exportToExcel } from '../utils/payrollUtils';
import { SAMPLE_PAYROLL_DATA } from '../data/sampleData';
import * as XLSX from 'xlsx';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (records: PayrollRecord[], source: 'google_sheet' | 'file' | 'sample', sheetUrl?: string) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
}) => {
  const [activeTab, setActiveTab] = React.useState<'url' | 'paste' | 'file' | 'sample'>('url');
  const [sheetUrl, setSheetUrl] = React.useState('');
  const [pastedText, setPastedText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Fetch via URL
  const handleFetchUrl = async () => {
    if (!sheetUrl.trim()) {
      setErrorMessage('กรุณาระบุ URL ของ Google Sheet หรือ Sheet ID');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const records = await fetchGoogleSheetPayroll(sheetUrl.trim());
      setSuccessMessage(`โหลดข้อมูลสำเร็จเรียบร้อย! พบพนักงานทั้งหมด ${records.length} คน`);
      setTimeout(() => {
        onDataLoaded(records, 'google_sheet', sheetUrl.trim());
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลจาก Google Sheet');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Parse Pasted TSV/CSV
  const handleParsePasted = () => {
    if (!pastedText.trim()) {
      setErrorMessage('กรุณาวางข้อมูลจาก Google Sheet หรือ Excel');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const records = parseCsvContent(pastedText.trim());
      if (records.length === 0) {
        throw new Error('ไม่พบข้อมูลพนักงานที่ถูกต้อง กรุณาตรวจสอบว่ามีหัวตารางครบถ้วน');
      }

      setSuccessMessage(`นำเข้าข้อมูลสำเร็จ! พบพนักงานทั้งหมด ${records.length} คน`);
      setTimeout(() => {
        onDataLoaded(records, 'file');
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'ไม่สามารถแปลงข้อมูลที่วางได้');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. File Upload (CSV / XLSX)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

          if (!jsonData || jsonData.length < 2) {
            throw new Error('ไฟล์ Excel ไม่มีข้อมูลหรือไม่มีหัวตาราง');
          }

          const headers = (jsonData[0] || []).map(String);
          const rows = jsonData.slice(1);
          const records = parsePayrollMatrix(headers, rows);

          setSuccessMessage(`นำเข้าไฟล์ Excel สำเร็จ! พบพนักงาน ${records.length} คน`);
          setTimeout(() => {
            onDataLoaded(records, 'file');
            onClose();
          }, 500);
        } catch (err: any) {
          setErrorMessage(err?.message || 'ไม่สามารถอ่านไฟล์ Excel ได้');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV text
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const records = parseCsvContent(text);
          setSuccessMessage(`นำเข้าไฟล์ CSV สำเร็จ! พบพนักงาน ${records.length} คน`);
          setTimeout(() => {
            onDataLoaded(records, 'file');
            onClose();
          }, 500);
        } catch (err: any) {
          setErrorMessage(err?.message || 'ไม่สามารถอ่านไฟล์ CSV ได้');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  // Download empty or filled template
  const handleDownloadTemplate = () => {
    exportToExcel(SAMPLE_PAYROLL_DATA, 'Payroll_Vertex_Template_46_Columns.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-orange-100 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                เชื่อมต่อและนำเข้าข้อมูลเงินเดือน (Google Sheet)
              </h2>
              <p className="text-xs text-stone-500">
                รองรับลิงก์ Google Sheet, การคัดลอกวาง (Copy-Paste), หรือไฟล์ Excel/CSV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-stone-100 px-6 pt-2 bg-stone-50/50">
          <button
            onClick={() => { setActiveTab('url'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'url'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>1. ลิงก์ Google Sheet</span>
          </button>

          <button
            onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'paste'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>2. วางข้อมูลตรง (Ctrl+V)</span>
          </button>

          <button
            onClick={() => { setActiveTab('file'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'file'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>3. อัปโหลดไฟล์ (Excel/CSV)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* TAB 1: Google Sheet URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  วางลิงก์ Google Sheet ที่นี่:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono text-stone-800 shadow-xs"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  * รองรับทั้งลิงก์แบบ Share Link และลิงก์ Publish to Web
                </p>
              </div>

              {/* Instructions Guide */}
              <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-100 text-xs text-stone-600 space-y-2">
                <div className="font-semibold text-orange-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <span>วิธีเปิดสิทธิ์ Google Sheet ให้แอพสามารถดึงข้อมูลได้:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1 text-[11px]">
                  <li>เปิดไฟล์ Google Sheet ของคุณ</li>
                  <li>กดปุ่ม <strong>แชร์ (Share)</strong> ด้านมุมขวาบน</li>
                  <li>เปลี่ยนการเข้าถึงทั่วไปเป็น: <strong>"ทุกคนที่มีลิงก์ (Anyone with the link)"</strong> และสิทธิ์เป็น <strong>"ผู้มีสิทธิ์ดู (Viewer)"</strong></li>
                  <li>กดคัดลอกลิงก์ แล้วนำมาวางในช่องด้านบน</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onDataLoaded(SAMPLE_PAYROLL_DATA, 'sample');
                    onClose();
                  }}
                  className="text-xs text-orange-600 hover:underline font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  โหลดข้อมูลตัวอย่าง 46 คอลัมน์ทันที
                </button>

                <button
                  onClick={handleFetchUrl}
                  disabled={isLoading}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm shadow-orange-500/25 disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'กำลังโหลดข้อมูล...' : 'ดึงข้อมูล Google Sheet'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Copy Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  วางข้อมูลจาก Google Sheet หรือ Excel (Copy ทั้งตาราง รวมหัวข้อแถวแรกแล้วกด Ctrl+V ที่นี่):
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="รหัสพนักงาน	ชื่อพนักงาน	รหัสสังกัด	เงินค่าแรง...&#10;EMP-1001	นายสมชาย ใจมั่นคง	PROD-01	450..."
                  className="w-full p-3 text-xs font-mono rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-stone-800"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-stone-400">
                  * วิธีนี้ทำงานได้ทันที 100% แม้ Sheet จะเป็นส่วนตัว
                </span>

                <button
                  onClick={handleParsePasted}
                  disabled={isLoading}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'กำลังประมวลผล...' : 'นำเข้าข้อมูลที่วาง'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/30 hover:bg-orange-50/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
                <UploadCloud className="w-10 h-10 text-orange-500 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-bold text-stone-800">
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                </span>
                <span className="text-[11px] text-stone-400 mt-1">
                  รองรับไฟล์ Excel (.xlsx, .xls) และ CSV (.csv)
                </span>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <button
                  onClick={handleDownloadTemplate}
                  className="text-xs text-stone-600 hover:text-orange-600 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-orange-500" />
                  <span>ดาวน์โหลดไฟล์แม่แบบ 46 คอลัมน์ (.xlsx)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
