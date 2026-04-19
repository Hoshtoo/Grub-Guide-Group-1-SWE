import React from 'react';

const FreshnessCard = ({ item }) => {
  const calculateExponentialRisk = (daysElapsed, shelfLife) => {
    const lambda_x = 1 / (shelfLife * 0.8);
    const e = Math.E;
    const cdf = 1 - Math.pow(e, -lambda_x * daysElapsed);
    return (cdf * 100).toFixed(1);
  };

 
  const getConfidenceInterval = (mean, stdDev, n) => {
    const zScore = 1.96;
    const numMean = parseFloat(mean) || 100;
    const marginOfError = zScore * (stdDev / Math.sqrt(n));
    return {
      lower: (numMean - marginOfError).toFixed(2),
      upper: (numMean + marginOfError).toFixed(2)
    };
  };

  const shelfLife = item.Shelf_Life || 30;
  const purchaseDate = new Date(item.date_purchased);
  const today = new Date();
  const diffTime = Math.abs(today - purchaseDate);
  const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const riskPercent = calculateExponentialRisk(daysElapsed, shelfLife);
  const stats = getConfidenceInterval(item.serving_size, 0.05, 10);
  const score = Math.max(1, Math.min(5, 5 - Math.floor((riskPercent / 100) * 5)));

  const getStatusColor = () => {
    if (score >= 4) return '#2d6a4f';
    if (score === 3) return '#f4a261';
    return '#e76f51';
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '16px',
      borderLeft: `10px solid ${getStatusColor()}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, color: '#1b4332' }}>{item.brand_name || "Ingredient"}</h4>
          <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>{item.branded_food_category}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: getStatusColor() }}>{score}/5</span>
        </div>
      </div>

      <div style={{ marginTop: '10px', fontSize: '12px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Degradation Risk:</strong> {riskPercent}% 
          <span style={{ fontSize: '10px', color: '#999', marginLeft: '5px' }}>(Exp. Distribution)</span>
        </div>
        <div>
          <strong>Estimated Vol:</strong> {stats.lower} - {stats.upper} {item.serving_size_unit || 'units'}
        </div>
      </div>

      {riskPercent > 70 && (
        <div style={{ color: '#e76f51', fontWeight: 'bold', marginTop: '8px', fontSize: '11px' }}>
          ⚠️ PUSH NOTIFICATION: Quality below threshold!
        </div>
      )}
    </div>
  );
};

export default FreshnessCard;