/**
 * Export Utilities for Mobile
 * CSV and PDF export functionality
 */

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: ExportData, filename?: string): void {
  const { headers, rows, title } = data;
  
  // Create CSV content
  const csvRows: string[] = [];
  
  // Add title if provided
  if (title) {
    csvRows.push(title);
    csvRows.push(''); // Empty line
  }
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add rows
  rows.forEach(row => {
    // Escape commas and quotes in cell values
    const escapedRow = row.map(cell => {
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(escapedRow.join(','));
  });
  
  // Create blob with BOM for Excel compatibility
  const csvContent = '\ufeff' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  // Cleanup
  URL.revokeObjectURL(url);
}

/**
 * Export data to PDF (using browser print)
 */
export function exportToPDF(data: ExportData, filename?: string): void {
  const { headers, rows, title } = data;
  
  // Create HTML table
  let html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>${title || 'Export'}</title>
      <style>
        @media print {
          @page {
            margin: 1cm;
          }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          margin-bottom: 20px;
          font-size: 24px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${title ? `<h1>${title}</h1>` : ''}
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${String(cell)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Exportiert am ${new Date().toLocaleDateString('de-CH', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
    </body>
    </html>
  `;
  
  // Create blob and open in new window
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  
  if (!printWindow) {
    throw new Error('Pop-up blockiert. Bitte erlauben Sie Pop-ups für diese Website.');
  }
  
  // Print when loaded
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Cleanup after printing
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 250);
  };
}

/**
 * Export finance entries to CSV
 */
export function exportFinanceToCSV(entries: any[]): void {
  const headers = ['Datum', 'Typ', 'Kategorie', 'Betrag (CHF)', 'Zahlungsmethode', 'Status', 'Notizen'];
  
  const rows = entries.map(entry => {
    const date = entry.date?.toDate ? entry.date.toDate() : new Date(entry.date);
    const dateStr = date.toLocaleDateString('de-CH');
    const type = entry.type === 'einnahme' ? 'Einnahme' : 'Ausgabe';
    const amount = (entry.amount / 100).toFixed(2);
    const status = (entry as any).status === 'paid' ? 'Bezahlt' : entry.type === 'einnahme' ? '-' : 'Offen';
    
    return [
      dateStr,
      type,
      entry.category || '',
      amount,
      entry.paymentMethod || '',
      status,
      entry.notes || ''
    ];
  });
  
  exportToCSV({
    headers,
    rows,
    title: 'Finanzübersicht'
  }, `finanzen_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export finance entries to PDF
 */
export function exportFinanceToPDF(entries: any[], summary?: { income: number; expenses: number; balance: number }): void {
  const headers = ['Datum', 'Typ', 'Kategorie', 'Betrag (CHF)', 'Status'];
  
  const rows = entries.map(entry => {
    const date = entry.date?.toDate ? entry.date.toDate() : new Date(entry.date);
    const dateStr = date.toLocaleDateString('de-CH');
    const type = entry.type === 'einnahme' ? 'Einnahme' : 'Ausgabe';
    const amount = (entry.amount / 100).toFixed(2);
    const status = (entry as any).status === 'paid' ? 'Bezahlt' : entry.type === 'einnahme' ? '-' : 'Offen';
    
    return [dateStr, type, entry.category || '', amount, status];
  });
  
  // Add summary row if provided
  if (summary) {
    rows.push(['', '', 'ZUSAMMENFASSUNG', '', '']);
    rows.push(['', '', 'Einnahmen', `CHF ${summary.income.toFixed(2)}`, '']);
    rows.push(['', '', 'Ausgaben', `CHF ${summary.expenses.toFixed(2)}`, '']);
    rows.push(['', '', 'Saldo', `CHF ${summary.balance.toFixed(2)}`, '']);
  }
  
  exportToPDF({
    headers,
    rows,
    title: 'Finanzübersicht'
  });
}

/**
 * Export reminders to CSV
 */
export function exportRemindersToCSV(reminders: any[]): void {
  const headers = ['Titel', 'Typ', 'Fälligkeitsdatum', 'Betrag (CHF)', 'Status', 'Notizen'];
  
  const rows = reminders.map(reminder => {
    const date = reminder.dueDate instanceof Date ? reminder.dueDate : new Date(reminder.dueDate);
    const dateStr = date.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const amount = reminder.amount ? (reminder.amount / 100).toFixed(2) : '';
    const typeMap: Record<string, string> = {
      'termin': 'Termin',
      'zahlung': 'Zahlung',
      'aufgabe': 'Aufgabe'
    };
    
    return [
      reminder.title,
      typeMap[reminder.type] || reminder.type,
      dateStr,
      amount,
      reminder.status === 'erledigt' ? 'Erledigt' : reminder.status === 'überfällig' ? 'Überfällig' : 'Offen',
      reminder.notes || ''
    ];
  });
  
  exportToCSV({
    headers,
    rows,
    title: 'Erinnerungen'
  }, `erinnerungen_${new Date().toISOString().split('T')[0]}.csv`);
}
