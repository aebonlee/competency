/**
 * Export data to CSV file with UTF-8 BOM for Korean Excel compatibility.
 */
export const exportToCSV = (
  data: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; label: string }[]
): void => {
  if (!data || data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  const formatValue = (val: unknown): string => {
    if (val == null) return '';
    if (val instanceof Date) {
      return val.toLocaleDateString('ko-KR');
    }
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
      return new Date(val).toLocaleDateString('ko-KR');
    }
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = cols.map((c) => formatValue(c.label)).join(',');
  const rows = data.map((row) =>
    cols.map((c) => formatValue(row[c.key])).join(',')
  );

  const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};
