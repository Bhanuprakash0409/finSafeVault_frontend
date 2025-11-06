import React, { useContext, useEffect, useState } from 'react';
import { TransactionContext } from '../context/TransactionContext';
import { AuthContext } from '../context/AuthContext';
import SummaryCard from '../components/SummaryCard'; 
import AddTransactionModal from '../components/AddTransactionModal';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlyBarChart from '../components/MonthlyBarChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import styles from './DashboardPage.module.css';

// ✅ Utility function for Indian Rupee format (Lakhs/Thousands)
const formatCurrencyINR = (num) => {
    if (num === null || num === undefined) return '₹0.00';
    const absNum = Math.abs(num).toFixed(2);
    const [integerPart, decimalPart] = absNum.split('.');
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }
    const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    const sign = num < 0 ? '-' : '';
    return `${sign}₹${result}.${decimalPart}`;
};

const DashboardPage = () => {
    const { user } = useContext(AuthContext);
    const {
        transactions,
        getTransactions,
        balance, 
        isLoading,
        getAnalyticsData,
        getTransactionsByDate,
        currentPage,
        totalPages,
        error
    } = useContext(TransactionContext);

    const [filterDate, setFilterDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear());
    const [exportDate, setExportDate] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });

    const API_BASE = 'https://finsafe-tracker-api.onrender.com/api/transactions'; 

    useEffect(() => {
        if (user) {
            getTransactions(1);
            getAnalyticsData(analysisYear);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, analysisYear]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            getTransactions(newPage);
        }
    };

    const handleDateFilter = (e) => {
        const date = e.target.value;
        setFilterDate(date);
        if (date) {
            getTransactionsByDate(date);
        } else {
            getTransactions(1);
        }
    };

    const getYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 0; i < 5; i++) {
            years.push(currentYear - i);
        }
        return years;
    };

    const handleExportDateChange = (e) => {
        const [year, month] = e.target.value.split('-');
        setExportDate({ year: parseInt(year, 10), month: parseInt(month, 10) });
    };

    // ✅ PDF GENERATION FUNCTION (Only Selected Month Transactions)
    const downloadMonthlyReportPDF = async () => {
        if (!user || !user.token) return;

        let allTransactions = [];
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            // ✅ FIX: Fetch transactions only for the selected month & year
            const { data } = await axios.get(
                `${API_BASE}?year=${exportDate.year}&month=${exportDate.month}`,
                config
            );
            allTransactions = data.transactions || [];
        } catch (err) {
            alert('Failed to fetch data. Please ensure transactions exist for this month.');
            return;
        }

        // ✅ Filter only transactions within the selected month (safety check)
        allTransactions = allTransactions.filter(t => {
            const tDate = new Date(t.date);
            return (
                tDate.getFullYear() === exportDate.year &&
                tDate.getMonth() + 1 === exportDate.month
            );
        });

        if (allTransactions.length === 0) {
            alert('No transactions found for the selected month.');
            return;
        }

        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        let yPos = 20;
        const centerOffset = 105;

        const reportMonth = new Date(exportDate.year, exportDate.month - 1).toLocaleString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        // Title
        doc.setFontSize(22);
        doc.text('FinSafe Financial Report', centerOffset, yPos, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`Period: ${reportMonth}`, centerOffset, yPos + 7, { align: 'center' });
        yPos += 20;

        // Monthly Summary
        const monthlyIncome = allTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const monthlyExpense = allTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        const monthlyNet = monthlyIncome - monthlyExpense;

        autoTable(doc, {
            startY: yPos,
            body: [
                ['Total Income', formatCurrencyINR(monthlyIncome)],
                ['Total Expense', formatCurrencyINR(monthlyExpense)],
                ['Net Balance', formatCurrencyINR(monthlyNet)],
            ],
            theme: 'grid',
            styles: { fontSize: 12 },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // Transaction Table
        doc.setFontSize(16);
        doc.text('Transaction History', 14, yPos);

        const tableBody = allTransactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.category,
            t.note || '-',
            {
                content: formatCurrencyINR(t.type === 'income' ? t.amount : -t.amount),
                styles: {
                    halign: 'right',
                    textColor: t.type === 'income' ? [16, 185, 129] : [239, 68, 68]
                }
            }
        ]);

        autoTable(doc, {
            startY: yPos + 8,
            head: [['Date', 'Category', 'Note', 'Amount (₹)']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 },
            columnStyles: { 3: { halign: 'right' } }
        });

        // ✅ Add Charts (Pie + Bar)
        yPos = doc.lastAutoTable.finalY + 15;
        if (yPos > pageHeight - 200) { doc.addPage(); yPos = 20; }

        const pieChart = document.querySelector('#pie-chart-container');
        const barChart = document.querySelector('#bar-chart-container');

        if (pieChart) {
            doc.setFontSize(16);
            doc.text('Expense Distribution', 14, yPos);
            const canvas = await html2canvas(pieChart, { scale: 2, backgroundColor: '#fff' });
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 60, yPos + 8, 90, 90);
            yPos += 105;
        }

        if (barChart) {
            if (yPos > pageHeight - 100) { doc.addPage(); yPos = 20; }
            doc.setFontSize(16);
            doc.text('Monthly Spending Trend', 14, yPos);
            const barCanvas = await html2canvas(barChart, { scale: 2, backgroundColor: '#fff' });
            doc.addImage(barCanvas.toDataURL('image/png'), 'PNG', 15, yPos + 8, 180, 90);
        }

        doc.save(`FinSafe_Report_${reportMonth.replace(' ', '_')}.pdf`);
    };

    const incomeColor = '#10B981';
    const expenseColor = '#EF4444';
    const balanceColor = balance.netBalance >= 0 ? '#3B82F6' : expenseColor;

    if (isLoading && transactions.length === 0) {
        return <div className={styles.loadingContainer}>Loading Your FinSafe Dashboard...</div>;
    }
    if (!user) {
        return <div className={styles.loadingContainer}>Please Login...</div>;
    }

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.actionBar}>
                <h2 className={styles.header}>
                    Hello, {user?.name?.split(' ')[0]}!
                    <span className={styles.minBalance}>
                        (Min Alert: {formatCurrencyINR(user?.minBalance)})
                    </span>
                </h2>

                <div className={styles.actions}>
                    <div className={styles.controlGroup}>
                        <label>Report Month:</label>
                        <input
                            type="month"
                            value={`${exportDate.year}-${String(exportDate.month).padStart(2, '0')}`}
                            onChange={handleExportDateChange}
                            className={styles.dateInput}
                        />
                    </div>

                    <button onClick={downloadMonthlyReportPDF} className={`${styles.actionButton} ${styles.pdfButton}`}>
                        Download Monthly Report (PDF)
                    </button>

                    <button onClick={() => setIsModalOpen(true)} className={`${styles.actionButton} ${styles.addButton}`}>
                        + Add Transaction
                    </button>
                </div>
            </div>

            <div id="dashboard-report-content" className={styles.reportContent}>
                {/* Summary Cards */}
                <div className={styles.summaryContainer}>
                    <SummaryCard title="Total Income" value={balance.totalIncome} color={incomeColor} currencyFormatter={formatCurrencyINR}/>
                    <SummaryCard title="Total Expense" value={balance.totalExpense} color={expenseColor} currencyFormatter={formatCurrencyINR}/>
                    <SummaryCard title="Net Balance" value={balance.netBalance} color={balanceColor} currencyFormatter={formatCurrencyINR}/>
                </div>

                {/* Filter Bar (Filter Date Top, Analytics Year Moved Bottom) */}
                <div className={styles.filterBar} style={{ justifyContent: 'space-between' }}>
                    <div className={styles.controlGroup}>
                        <h3>Transaction History</h3>
                        <label>Filter by Date:</label>
                        <input type="date" value={filterDate} onChange={handleDateFilter} className={styles.dateInput}/>
                    </div>
                    <div className={styles.controlGroup}></div>
                </div>

                {error && <p className={styles.errorMessage}>Error: {error}</p>}

                {/* Transactions Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.transactionTable}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Note</th>
                                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? (
                                transactions.map((t) => (
                                    <tr key={t._id}>
                                        <td>{new Date(t.date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 'bold' }}>{t.category}</td>
                                        <td>{t.note || '-'}</td>
                                        <td style={{
                                            fontWeight: 'bold',
                                            color: t.type === 'income' ? incomeColor : expenseColor,
                                            textAlign: 'right'
                                        }}>
                                            {formatCurrencyINR(t.type === 'income' ? t.amount : -t.amount)}
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

                {/* Pagination & Analytics Year (Bottom Right) */}
                <div className={styles.filterBar} style={{ justifyContent: 'space-between', marginTop: '20px' }}>
                    {(totalPages > 1) && !filterDate && (
                        <div className={styles.paginationContainer}>
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={isLoading || currentPage === 1} className={styles.actionButton} style={{ backgroundColor: '#FF8042' }}>
                                Previous
                            </button>
                            <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={isLoading || currentPage === totalPages} className={styles.actionButton} style={{ backgroundColor: '#4CAF50' }}>
                                Next
                            </button>
                        </div>
                    )}

                    <div className={styles.controlGroup}>
                        <label>Analytics Year:</label>
                        <select
                            value={analysisYear}
                            onChange={(e) => setAnalysisYear(parseInt(e.target.value, 10))}
                            className={styles.dateInput}
                        >
                            {getYearOptions().map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Charts */}
                <div className={styles.chartsGrid}>
                    <div id="pie-chart-container" className={styles.chartContainer}>
                        <h3 className={styles.chartTitle}>Expense Distribution</h3>
                        <CategoryPieChart />
                    </div>
                    <div id="bar-chart-container" className={styles.chartContainer}>
                        <h3 className={styles.chartTitle}>Monthly Spending Trend (Year: {analysisYear})</h3>
                        <MonthlyBarChart />
                    </div>
                </div>
            </div>

            {isModalOpen && <AddTransactionModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default DashboardPage;
