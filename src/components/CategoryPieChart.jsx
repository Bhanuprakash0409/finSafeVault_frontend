import React, { useContext } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { TransactionContext } from '../context/TransactionContext';
import { CHART_COLORS } from '../utils/constants'; // Import shared colors


const CategoryPieChart = () => {
  const { analytics } = useContext(TransactionContext);
  
  // Format MongoDB's { _id: category, total: amount } into { name, value }
  const data = analytics.categoryData.map(item => ({
    name: item._id,
    value: item.total,
  }));

  if (data.length === 0) {
    return <p style={{ textAlign: 'center', padding: '20px', color: '#777' }}>No expense data to display chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          labelLine={false}
          // Custom label showing name and percentage
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            // Assign a color to each category
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        {/* Tooltip formatter ensures values show up as currency */}
        <Tooltip formatter={(value, name) => [`₹${value.toFixed(2)}`, name]} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryPieChart;