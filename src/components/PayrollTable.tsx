import React from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Edit2,
  Building,
  UserCheck
} from 'lucide-react';
import { PayrollRecord, ColumnDefinition } from '../types';
import { ALL_PAYROLL_COLUMNS } from '../data/columns';
import { formatCurrency, formatNumber } from '../utils/payrollUtils';

interface PayrollTableProps {
  records: PayrollRecord[];
  visibleColumns: string[];
  onViewPayslip: (record: PayrollRecord) => void;
  onEditRecord?: (record: PayrollRecord) => void;
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  records,
  visibleColumns,
  onViewPayslip,
  onEditRecord,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDept, setSelectedDept] = React.useState<string>('ALL');
  const [sortBy, setSortBy] = React.useState<keyof PayrollRecord>('empId');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);

  // Extract unique departments
  const departments = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.deptCode) set.add(r.deptCode);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtering
  const filteredRecords = React.useMemo(() => {
    return records.filter((rec) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.empId.toLowerCase().includes(q) ||
        rec.empName.toLowerCase().includes(q) ||
        rec.deptCode.toLowerCase().includes(q) ||
        (rec.deptName && rec.deptName.toLowerCase().includes(q));

      const matchesDept = selectedDept === 'ALL' || rec.deptCode === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [records, searchQuery, selectedDept]);

  // Sorting
  const sortedRecords = React.useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA || '');
      const strB = String(valB || '');
      return sortOrder === 'asc'
        ? strA.localeCompare(strB, 'th')
        : strB.localeCompare(strA, 'th');
    });
  }, [filteredRecords, sortBy, sortOrder]);

  // Pagination
  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedRecords.length / pageSize);
  const paginatedRecords = React.useMemo(() => {
    if (pageSize === -1) return sortedRecords;
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  // Totals for all numeric columns based on filtered records
  const columnTotals = React.useMemo(() => {
    const totals: Partial<Record<keyof PayrollRecord, number>> = {};
    ALL_PAYROLL_COLUMNS.forEach((col) => {
      if (col.type !== 'text') {
        totals[col.key] = filteredRecords.reduce((acc, curr) => {
          const val = curr[col.key];
          return acc + (typeof val === 'number' ? val : 0);
        }, 0);
      }
    });
    return totals;
  }, [filteredRecords]);

  // Handle Sort Toggle
  const handleSort = (key: keyof PayrollRecord) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const activeColumns = React.useMemo(() => {
    return ALL_PAYROLL_COLUMNS.filter((c) => visibleColumns.includes(c.key));
  }, [visibleColumns]);

  const renderCellContent = (col: ColumnDefinition, record: PayrollRecord) => {
    const val = record[col.key];

    if (col.key === 'empId') {
      return (
        <span className="font-mono font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
          {val as string}
        </span>
      );
    }

    if (col.key === 'empName') {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-stone-900 whitespace-nowrap">{val as string}</span>
          {record.deptName && (
            <span className="text-[10px] text-stone-400 truncate max-w-[130px]">{record.deptName}</span>
          )}
        </div>
      );
    }

    if (col.key === 'deptCode') {
      return (
        <span className="text-stone-600 font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded">
          {val as string}
        </span>
      );
    }

    if (col.key === 'netPay') {
      return (
        <span className="font-bold text-orange-600 font-mono text-sm bg-orange-100/70 px-2 py-0.5 rounded-lg border border-orange-300/60 whitespace-nowrap">
          ฿{formatCurrency(val as number)}
        </span>
      );
    }

    if (col.type === 'currency') {
      const num = (val as number) || 0;
      if (num === 0) return <span className="text-stone-300 font-mono">-</span>;

      let colorClass = 'text-stone-700';
      if (col.category === 'allowances' || col.key === 'totalWorkWage' || col.key === 'totalAdditions') {
        colorClass = 'text-emerald-700 font-medium';
      } else if (col.category === 'deductions' || col.key === 'totalDeductions') {
        colorClass = 'text-rose-700';
      }

      return (
        <span className={`font-mono text-xs ${colorClass}`}>
          {formatCurrency(num)}
        </span>
      );
    }

    if (col.type === 'hours' || col.type === 'number') {
      const num = (val as number) || 0;
      if (num === 0) return <span className="text-stone-300 font-mono">-</span>;
      return <span className="font-mono text-xs text-stone-700 font-medium">{formatNumber(num, col.type === 'hours' ? 1 : 0)}</span>;
    }

    return <span className="text-xs text-stone-700">{String(val || '')}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden mb-8">
      {/* Table Toolbar / Filters */}
      <div className="p-4 border-b border-orange-100 bg-orange-50/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search Input & Department filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหารหัสพนักงาน, ชื่อ, หรือรหัสสังกัด..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              className="text-xs py-2 px-3 rounded-xl bg-white border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">ทุกแผนก / สังกัด ({records.length})</option>
              {departments.map((dept) => {
                const count = records.filter((r) => r.deptCode === dept).length;
                return (
                  <option key={dept} value={dept}>
                    {dept} ({count} คน)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Right: Results Count & Page size */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-stone-600">
          <div>
            แสดง <span className="font-semibold text-stone-900">{filteredRecords.length}</span> จาก{' '}
            <span className="font-semibold text-stone-900">{records.length}</span> รายการ
          </div>

          <div className="flex items-center gap-1.5">
            <span>แสดงต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="text-xs py-1 px-2 rounded-lg bg-white border border-stone-200 text-stone-700 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>ทั้งหมด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto relative max-h-[700px] divide-y divide-stone-100">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-[#fefaf6] text-[11px] uppercase tracking-wider text-stone-600 sticky top-0 z-20 shadow-xs border-b border-orange-200/80">
            <tr>
              {/* Row index & Action */}
              <th className="py-3 px-3 w-12 text-center bg-[#fefaf6] sticky left-0 z-30 font-semibold border-r border-orange-100">
                #
              </th>
              <th className="py-3 px-3 w-24 text-center bg-[#fefaf6] sticky left-12 z-30 font-semibold border-r border-orange-100">
                จัดการ
              </th>

              {/* Dynamic Columns */}
              {activeColumns.map((col) => {
                const isSorted = sortBy === col.key;
                const isStickyEmpId = col.key === 'empId';
                const isStickyName = col.key === 'empName';

                let headerBg = 'bg-[#fefaf6]';
                if (col.key === 'netPay') headerBg = 'bg-orange-100/80 text-orange-900 font-bold';
                else if (col.category === 'allowances') headerBg = 'bg-emerald-50/50';
                else if (col.category === 'deductions') headerBg = 'bg-rose-50/50';
                else if (col.category === 'wages') headerBg = 'bg-amber-50/50';

                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`py-3 px-3.5 whitespace-nowrap cursor-pointer select-none transition-colors hover:bg-orange-100/60 font-semibold border-r border-orange-100/50 ${headerBg} ${
                      col.type === 'currency' || col.type === 'number' || col.type === 'hours'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.type === 'currency' || col.type === 'number' || col.type === 'hours'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold tracking-normal text-stone-800">
                          {col.labelTh}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400 lowercase tracking-tight">
                          {col.labelEn}
                        </span>
                      </div>
                      {isSorted ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100 shrink-0" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-stone-100 text-xs">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + 2} className="py-12 text-center text-stone-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCheck className="w-8 h-8 text-stone-300" />
                    <p className="text-sm font-medium">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedDept('ALL');
                      }}
                      className="text-xs text-orange-600 hover:underline mt-1"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record, index) => {
                const rowIndex = (page - 1) * (pageSize === -1 ? 0 : pageSize) + index + 1;
                const isSelected = selectedRowId === record.id;

                return (
                  <tr
                    key={record.id}
                    onClick={() => setSelectedRowId(record.id)}
                    className={`transition-colors hover:bg-orange-50/60 group ${
                      isSelected ? 'bg-orange-50/90' : index % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-stone-400 font-mono text-[11px] sticky left-0 z-10 bg-inherit border-r border-stone-100">
                      {rowIndex}
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-2 text-center sticky left-12 z-10 bg-inherit border-r border-stone-100 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewPayslip(record);
                          }}
                          title="ดูสลิปเงินเดือน (Payslip)"
                          className="p-1 text-orange-600 hover:bg-orange-100 rounded-md transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {onEditRecord && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditRecord(record);
                            }}
                            title="แก้ไขข้อมูล"
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Dynamic Cells */}
                    {activeColumns.map((col) => {
                      let cellBg = '';
                      if (col.key === 'netPay') cellBg = 'bg-orange-50/60 font-semibold';

                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-3.5 whitespace-nowrap border-r border-stone-100/60 ${cellBg} ${
                            col.type === 'currency' || col.type === 'number' || col.type === 'hours'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {renderCellContent(col, record)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          {filteredRecords.length > 0 && (
            <tfoot className="bg-stone-100/90 text-stone-800 text-xs font-bold sticky bottom-0 z-20 border-t-2 border-orange-300 shadow-md">
              <tr>
                <td className="py-3 px-3 text-center sticky left-0 z-30 bg-stone-100 border-r border-stone-200">
                  ∑
                </td>
                <td className="py-3 px-3 text-center sticky left-12 z-30 bg-stone-100 border-r border-stone-200">
                  <span className="text-[11px] font-bold text-stone-700">รวมทั้งหมด</span>
                </td>

                {activeColumns.map((col) => {
                  if (col.type === 'text') {
                    if (col.key === 'empId') {
                      return (
                        <td key={col.key} className="py-3 px-3.5 text-left border-r border-stone-200 text-[11px] text-stone-500">
                          {filteredRecords.length} คน
                        </td>
                      );
                    }
                    return <td key={col.key} className="py-3 px-3.5 border-r border-stone-200"></td>;
                  }

                  const totalVal = columnTotals[col.key] || 0;
                  const isNet = col.key === 'netPay';

                  return (
                    <td
                      key={col.key}
                      className={`py-3 px-3.5 text-right font-mono border-r border-stone-200 whitespace-nowrap ${
                        isNet
                          ? 'bg-orange-200/80 text-orange-950 font-extrabold text-sm'
                          : col.category === 'allowances'
                          ? 'text-emerald-800'
                          : col.category === 'deductions'
                          ? 'text-rose-800'
                          : 'text-stone-900'
                      }`}
                    >
                      {col.type === 'currency'
                        ? `฿${formatCurrency(totalVal)}`
                        : formatNumber(totalVal, col.type === 'hours' ? 1 : 0)}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="p-3.5 border-t border-stone-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
          <div>
            หน้า <span className="font-semibold text-stone-900">{page}</span> จาก{' '}
            <span className="font-semibold text-stone-900">{totalPages}</span> (แสดงหน้าละ {pageSize} แถว)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              หน้าแรก
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-orange-500 text-white font-semibold shadow-xs'
                      : 'border border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              หน้าสุดท้าย
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
