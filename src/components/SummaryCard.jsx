import React from 'react';
import styles from './SummaryCard.module.css';

const SummaryCard = ({ title, value, color }) => {
  const cardStyle = {
    borderLeft: `5px solid ${color}`,
  };

  return (
    <div className={styles.card} style={cardStyle}>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.value}>
        ₹{value.toFixed(2)}
      </p>
    </div>
  );
};

export default SummaryCard;