import React, { useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TransactionContext } from '../context/TransactionContext';

const MonthlyBarChart = () => {
  const { analytics } = useContext(TransactionContext);
  const data = analytics.monthlyData; // Now contains { name, income, expense }

  if (data.length === 0) {
    return <p style={{ textAlign: 'center', padding: '20px', color: '#777' }}>No monthly data to display chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
        <XAxis dataKey="name" stroke="#555" />
        <YAxis tickFormatter={(value) => `₹${value.toFixed(0)}`} stroke="#555" />
        <Tooltip formatter={(value, name) => [`₹${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
        <Legend />
        
        {/* ⬅️ NEW BAR: Income */}
        <Bar dataKey="income" fill="#4CAF50" name="Monthly Income" /> 
        
        {/* ⬅️ EXISTING BAR: Expense */}
        <Bar dataKey="expense" fill="#FF8042" name="Monthly Expense" /> 
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyBarChart;