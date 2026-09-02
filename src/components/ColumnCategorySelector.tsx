import React from 'react';
import { 
  Layers, 
  Clock, 
  DollarSign, 
  Gift, 
  ShieldCheck, 
  Wallet, 
  SlidersHorizontal,
  CheckSquare,
  Square,
  Eye,
  RotateCcw
} from 'lucide-react';
import { ColumnCategory, ColumnDefinition } from '../types';
import { ALL_PAYROLL_COLUMNS } from '../data/columns';

interface ColumnCategorySelectorProps {
  currentCategory: ColumnCategory;
  onSelectCategory: (cat: ColumnCategory) => void;
  visibleColumns: string[];
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
  onSelectAllColumns: () => void;
}

export const ColumnCategorySelector: React.FC<ColumnCategorySelectorProps> = ({
  currentCategory,
  onSelectCategory,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
  onSelectAllColumns,
}) => {
  const [showCustomizer, setShowCustomizer] = React.useState(false);
  const [columnSearch, setColumnSearch] = React.useState('');

  const categories: { id: ColumnCategory; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'ทั้งหมด (46 คอลัมน์)', icon: <Layers className="w-3.5 h-3.5" />, count: 46 },
    { id: 'summary', label: 'สรุปภาพรวม', icon: <Eye className="w-3.5 h-3.5" />, count: 8 },
    { id: 'hours', label: 'วันทำงานและโอที', icon: <Clock className="w-3.5 h-3.5" />, count: 7 },
    { id: 'wages', label: 'ค่าแรงและเงินโอที', icon: <DollarSign className="w-3.5 h-3.5" />, count: 7 },
    { id: 'allowances', label: 'รายได้เพิ่มและเบี้ยเลี้ยง', icon: <Gift className="w-3.5 h-3.5" />, count: 16 },
    { id: 'deductions', label: 'เงินหัก ภาษี และ ปกส.', icon: <ShieldCheck className="w-3.5 h-3.5" />, count: 9 },
    { id: 'net', label: 'สรุปรายได้สุทธิ', icon: <Wallet className="w-3.5 h-3.5" />, count: 4 },
  ];

  const filteredColumns = React.useMemo(() => {
    if (!columnSearch) return ALL_PAYROLL_COLUMNS;
    const q = columnSearch.toLowerCase();
    return ALL_PAYROLL_COLUMNS.filter(
      (c) => c.labelTh.toLowerCase().includes(q) || c.labelEn.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    );
  }, [columnSearch]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-orange-100 shadow-xs mb-4">
      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-orange-50/80'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Column Customizer Toggle Button */}
      <div className="relative self-end sm:self-auto shrink-0">
        <button
          onClick={() => setShowCustomizer(!showCustomizer)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
            showCustomizer
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />
          <span>ปรับแต่งคอลัมน์ ({visibleColumns.length}/46)</span>
        </button>

        {/* Dropdown / Popover for column visibility */}
        {showCustomizer && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[480px] bg-white rounded-2xl shadow-2xl border border-orange-100 p-4 z-50 flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="font-semibold text-xs text-stone-800">เลือกคอลัมน์ที่ต้องการแสดง</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onSelectAllColumns}
                  className="text-[11px] text-orange-600 hover:underline font-medium"
                >
                  เลือกทั้งหมด
                </button>
                <span className="text-stone-300">•</span>
                <button
                  onClick={onResetColumns}
                  className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  รีเซ็ต
                </button>
              </div>
            </div>

            <div className="my-2.5">
              <input
                type="text"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="ค้นหาชื่อคอลัมน์..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="overflow-y-auto flex-1 max-h-[300px] divide-y divide-stone-50 pr-1">
              {filteredColumns.map((col) => {
                const isChecked = visibleColumns.includes(col.key);
                return (
                  <label
                    key={col.key}
                    className="flex items-center justify-between py-1.5 px-2 hover:bg-orange-50/50 rounded-lg cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-orange-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300 shrink-0" />
                      )}
                      <span className={`${isChecked ? 'text-stone-900 font-medium' : 'text-stone-500'}`}>
                        {col.labelTh}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">{col.labelEn}</span>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 mt-2 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setShowCustomizer(false)}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                บันทึกและปิด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
