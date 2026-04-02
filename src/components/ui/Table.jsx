import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

const Table = ({ columns, data = [], onEdit, onDelete, emptyMessage = 'لا توجد بيانات' }) => {
  if (!data.length) {
    return (
      <div className="neu-card p-10 text-center">
        <p className="text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="neu-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl">
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)', borderBottom: '2px solid var(--color-border)' }}
                >
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th
                  className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)', borderBottom: '2px solid var(--color-border)', width: '120px' }}
                >
                  إجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="transition-colors duration-150"
                style={{ borderBottom: '1px solid var(--color-border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-2 rounded-xl cursor-pointer transition-all duration-200"
                          style={{ color: 'var(--color-primary)', background: 'var(--color-bg)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#E0F2FE'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                          title="تعديل"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-2 rounded-xl cursor-pointer transition-all duration-200"
                          style={{ color: 'var(--color-danger)', background: 'var(--color-bg)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
