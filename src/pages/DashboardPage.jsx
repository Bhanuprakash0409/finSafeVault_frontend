
import React, { useContext, useEffect, useState } from 'react';
import { TransactionContext } from '../context/TransactionContext';
import { AuthContext } from '../context/AuthContext';
import SummaryCard from '../components/SummaryCard'; // ⬅️ NEW
import AddTransactionModal from '../components/AddTransactionModal';
import NoteModal from '../components/NoteModal'; // ⬅️ NEW: Import NoteModal
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlyBarChart from '../components/MonthlyBarChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // Re-import for chart rendering
import autoTable from 'jspdf-autotable'; // Import autoTable
import axios from 'axios';
import styles from './DashboardPage.module.css'; // ⬅️ NEW CSS MODULE IMPORT
import { CHART_COLORS } from '../utils/constants'; // Import shared colors
 
const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const { 
    transactions,
    getTransactions,
    balance, // ⬅️ Use the new balance state from context
    isLoading,
    getAnalyticsData,
    getTransactionsByDate, // ⬅️ NEW IMPORT
    currentPage, // ⬅️ NEW IMPORT
    totalPages,  // ⬅️ NEW IMPORT
    error
  } = useContext(TransactionContext);

  const [filterDate, setFilterDate] = useState(''); // ⬅️ NEW STATE for date filtering

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false); // ⬅️ NEW: State for Note Modal

  // ⬅️ NEW STATE: Track the year for analytics (default to current year)
  const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear()); 

  // ⬅️ NEW STATE: Track the desired month/year for export
  const [exportDate, setExportDate] = useState({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1 // JS Month is 0-indexed, so add 1
  });

  // Fetch all data when the user logs in or refreshes
  // Fetch transactions AND analytics data on load and when year changes
  useEffect(() => {
    if (user) {
      getTransactions(user, 1); // Reset to page 1 on load

      // ⬅️ CRITICAL: Call analytics with the selected year state
      getAnalyticsData(analysisYear); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, analysisYear]); // ⬅️ Re-run whenever analysisYear changes

  // Helper to generate a list of years (e.g., last 5 years)
  const getYearOptions = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = 0; i < 5; i++) { // Show current year and 4 past years
          years.push(currentYear - i);
      }
      return years;
  };
  // Handler for the date selector change
  const handleExportDateChange = (e) => {
      const [year, month] = e.target.value.split('-');
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      setExportDate({ year: yearNum, month: monthNum });
      // Data will be fetched on download click, no need to fetch here.
  };

  // ⬅️ NEW HANDLER: Controls Previous and Next navigation
  const handlePageChange = (newPage) => {
      // Only fetch if the page number is valid
      if (newPage >= 1 && newPage <= totalPages) {
          getTransactions(user, newPage);
      }
  };

  // ⬅️ NEW: Date Filter Handler
  const handleDateFilter = (e) => {
      const date = e.target.value;
      setFilterDate(date);
      if (date) {
          getTransactionsByDate(date, user);
      } else {
          // If filter cleared, reset to first page
          getTransactions(user, 1); 
      }
  };

  // ➡️ REWRITTEN FUNCTION: Generates a multi-page PDF report reliably
  const downloadMonthlyReportPDF = async () => {
    if (!user || !user.token) return;

    let allTransactions;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(
        `http://localhost:5000/api/transactions/monthly-report?year=${exportDate.year}&month=${exportDate.month}`,
        config
      );
      allTransactions = data;
    } catch (err) {
      alert('Failed to fetch full report data. Please try again.');
      return;
    }

    if (!allTransactions || allTransactions.length === 0) {
      alert('No transactions found for the selected month to generate a report.');
      return;
    }

    const doc = new jsPDF(); // Create PDF document
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20; // Initial vertical position

    const reportMonth = new Date(exportDate.year, exportDate.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    doc.setFontSize(22);
    doc.text(`Financial Report - ${reportMonth}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // --- 2. Calculate and Display Monthly Summary ---
    const monthlyIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const monthlyExpense = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const monthlyNet = monthlyIncome - monthlyExpense;

    doc.setFontSize(16);
    doc.text('Monthly Summary', 14, yPos);
    yPos += 8;
    autoTable(doc, { // FIX: Call autoTable as a function
      startY: yPos,
      body: [
        ['Total Income', `Rs. ${monthlyIncome.toFixed(2)}`],
        ['Total Expense', `Rs. ${monthlyExpense.toFixed(2)}`],
        ['Net Balance', `Rs. ${monthlyNet.toFixed(2)}`],
      ],
      theme: 'grid',
      styles: { fontSize: 12 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    yPos = doc.lastAutoTable.finalY + 15; // FIX: Use doc.lastAutoTable

    // --- 3. Transaction Table ---
    if (yPos > pageHeight - 40) { // Check space before adding table
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(16);
    doc.text('Transaction History', 14, yPos);
    autoTable(doc, { // FIX: Call autoTable as a function
      startY: yPos + 8,
      head: [['Date', 'Category', 'Note', 'Amount (₹)']],
      body: allTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.category,
        t.note || '-',
        { content: `${t.type === 'income' ? '+' : '-'} Rs. ${t.amount.toFixed(2)}`, styles: { halign: 'right', textColor: t.type === 'income' ? [16, 185, 129] : [239, 68, 68] } }
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
      columnStyles: { 3: { halign: 'right' } }
    });

    // --- 4. Add Charts at the end ---
    yPos = doc.lastAutoTable.finalY + 15; // Get position after the table

    const pieChartElement = document.querySelector('#pie-chart-container');
    const barChartElement = document.querySelector('#bar-chart-container');

    // --- 4. Add Pie Chart and Manual Legend ---
    if (pieChartElement) {
      if (yPos > pageHeight - 120) { // Check space for chart + legend
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(16);
      doc.text('Expense Distribution', 14, yPos);
      yPos += 8;

      // --- Draw the Pie Chart Image ---
      const canvas = await html2canvas(pieChartElement, { scale: 2, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 14, yPos, 90, 90); // Chart on the left

      // --- Manually Draw the Legend on the right ---
      const expenseByCategory = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});

      const legendX = 115; // X position for the legend
      let legendY = yPos + 5;

      Object.entries(expenseByCategory).forEach(([category, amount], index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length];
        const percentage = ((amount / monthlyExpense) * 100).toFixed(1);

        doc.setFillColor(color);
        doc.rect(legendX, legendY, 5, 5, 'F'); // Color swatch
        doc.setFontSize(10);
        doc.text(`${category}: ${percentage}%`, legendX + 8, legendY + 4);
        legendY += 8;
      });

      yPos += 100; // Move yPos down past the chart and legend
    }

    // --- 5. Add Bar Chart ---
    if (barChartElement) {
      if (yPos > pageHeight - 100) { doc.addPage(); yPos = 20; }
      doc.setFontSize(16);
      doc.text('Monthly Spending Trend', 14, yPos);
      yPos += 8;
      const barCanvas = await html2canvas(barChartElement, { scale: 2, backgroundColor: null });
      doc.addImage(barCanvas.toDataURL('image/png'), 'PNG', 14, yPos, 180, 90);
    }

    doc.save(`FinSafe_Report_${reportMonth.replace(' ', '_')}.pdf`);
  };

  // --- Styles ---
  const incomeColor = '#10B981'; 
  const expenseColor = '#EF4444'; 
  const balanceColor = balance.netBalance >= 0 ? '#3B82F6' : expenseColor; 

  return (
    <div className={styles.dashboardContainer}>
      {/* Action Buttons & Export are outside the printable report area */}
      <div className={`no-print ${styles.actionBar}`}>
        <div className={styles.actions}>
          <label style={{ fontWeight: 'bold' }}>Receipt for:</label>
          <input type="month" value={`${exportDate.year}-${String(exportDate.month).padStart(2, '0')}`} onChange={handleExportDateChange} className={styles.dateInput} />
          <button onClick={downloadMonthlyReportPDF} className={`${styles.actionButton} ${styles.pdfButton}`}>Download Report (PDF)</button>
          <button onClick={() => setIsNoteModalOpen(true)} className={`${styles.actionButton} ${styles.noteButton}`}>My Notes</button>
          <button onClick={() => setIsModalOpen(true)} className={`${styles.actionButton} ${styles.addButton}`}>+ Add Transaction</button>
        </div>
      </div>

      <div id="dashboard-report-content">
        {/* Add a header for the PDF report */}
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Financial Report - {new Date(exportDate.year, exportDate.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h1>

        <h2 className={styles.header}>
          Hello, {user?.name.split(' ')[0]}! 
          <span className={styles.minBalance}>
              (Min Alert: ₹{user?.minBalance !== undefined ? user.minBalance.toFixed(2) : '0.00'})
          </span>
        </h2>
        
        {/* 1. Summary Cards */}
        <div className={styles.summaryContainer}>
          <SummaryCard title="Total Income" value={balance.totalIncome} color={incomeColor}/>
          <SummaryCard title="Total Expense" value={balance.totalExpense} color={expenseColor}/>
          <SummaryCard title="Net Balance" value={balance.netBalance} color={balanceColor}/>
        </div>

        {/* Date Filter Input */}
        <div className={`no-print ${styles.filterBar}`} style={{ justifyContent: 'space-between' }}>
            <h3>Transactions History</h3>
            <div className={styles.controlGroup}>
              <label>Filter by Date:</label>
              <input type="date" value={filterDate} onChange={handleDateFilter} className={styles.dateInput} />
            </div>
        </div>

        {/* Loading/Error State */}
        {isLoading && <p style={{ textAlign: 'center', color: 'blue' }}>Loading data...</p>}
        {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>}
        
        {/* 3. Transaction List Table */}
        <div className={styles.tableContainer}>
          <table className={styles.transactionTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th style={{textAlign: 'right'}}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{fontWeight: 'bold'}}>{t.category}</td>
                    <td>{t.note || '-'}</td>
                    <td style={{ fontWeight: 'bold', color: t.type === 'income' ? incomeColor : expenseColor, textAlign: 'right' }}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: '#777' }}>
                    No transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {(totalPages > 1) && !filterDate && (
          <div className={`no-print ${styles.paginationContainer}`}>
              
              {/* 1. PREVIOUS BUTTON */}
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={isLoading || currentPage === 1} className={styles.actionButton} style={{backgroundColor: '#FF8042'}}>
                  Previous
              </button>
              
              <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
              </span>

              {/* 2. NEXT BUTTON */}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={isLoading || currentPage === totalPages} className={styles.actionButton} style={{backgroundColor: '#4CAF50'}}>
                  Next
              </button>
          </div>
        )}
        
        {/* Filter and Analytics Controls - MOVED HERE */}
        <div className={`no-print ${styles.controlsContainer}`}>
          
          <div className={styles.controlGroup}>
            <label>View Analytics for Year:</label>
            <select
                value={analysisYear}
                onChange={(e) => setAnalysisYear(parseInt(e.target.value))}
                className={styles.dateInput}
            >
                {getYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
          </div>
        </div>


        {/* 4. Charts Integration */}
        <div className={styles.chartsGrid}>
          <div id="pie-chart-container" className={styles.chartContainer}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>Expense Distribution</h3>
            <CategoryPieChart /> 
          </div>

          <div id="bar-chart-container" className={styles.chartContainer}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>Monthly Spending Trend</h3>
            <MonthlyBarChart /> 
          </div>
        </div>
      </div>

      {/* Modal Render */}
      {isModalOpen && <AddTransactionModal onClose={() => setIsModalOpen(false)} />}
      {isNoteModalOpen && <NoteModal onClose={() => setIsNoteModalOpen(false)} />}
    </div>
  );
};

export default DashboardPage;