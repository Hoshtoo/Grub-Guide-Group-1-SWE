import React from 'react';

const FreshnessCard = ({ item }) => {
  const calculateExponentialRisk = (daysElapsed, shelfLife) => {
    if (shelfLife <= 0) return "0.0";
    const lambda_x = 1 / shelfLife;
    const cdf = 1 - Math.pow(Math.E, -lambda_x * daysElapsed);
    return (cdf * 100).toFixed(1);
  };

  const getConfidenceInterval = (mean, stdDev, n) => {
    const zScore = 1.96; 
    const numMean = parseFloat(mean) || 1; 
    const marginOfError = zScore * (stdDev / Math.sqrt(n));
    return {
      lower: Math.max(0, (numMean - marginOfError)).toFixed(2),
      upper: (numMean + marginOfError).toFixed(2)
    };
  };

  const shelfLife = Number(item.shelf_life || item.Shelf_Life) || 14;
  const quantity = Number(item.quantity) || 0;
  const weeklyUsage = Number(item.weekly_usage) || 0;
  const purchaseDate = new Date(item.date_purchased || item.created_at || new Date());
  const today = new Date();
  
  const diffTime = Math.abs(today - purchaseDate);
  const daysElapsed = Math.max(0.1, diffTime / (1000 * 60 * 60 * 24));

  const riskPercent = calculateExponentialRisk(daysElapsed, shelfLife);
  const score = Math.max(1, Math.min(5, 5 - Math.floor((parseFloat(riskPercent) / 20))));
  const stats = getConfidenceInterval(quantity, 0.5, 10);

  const daysUntilSpoil = Math.max(0, shelfLife - daysElapsed);
  const daysUntilEmpty = weeklyUsage > 0 ? (quantity / weeklyUsage) * 7 : 999;
  const criticalDays = Math.min(daysUntilSpoil, daysUntilEmpty).toFixed(0);

  const getStatusColor = () => {
    if (score >= 4 && criticalDays > 3) return '#52b788'; // Vibrant Green
    if (score === 3 || (criticalDays <= 3 && criticalDays > 0)) return '#f4a261'; // Orange
    return '#e76f51'; // Red
  };

  const isCritical = parseFloat(riskPercent) > 70 || criticalDays <= 2;

  return (
    <>
      <style>
        {`
          @keyframes pulse-red-dark {
            0% { box-shadow: 0 0 0 0 rgba(231, 111, 81, 0.2); background: rgba(231, 111, 81, 0.02); }
            70% { box-shadow: 0 0 0 15px rgba(231, 111, 81, 0); background: rgba(231, 111, 81, 0.08); }
            100% { box-shadow: 0 0 0 0 rgba(231, 111, 81, 0); background: rgba(231, 111, 81, 0.02); }
          }
          .critical-card-dark { 
            animation: pulse-red-dark 2.5s infinite; 
            border: 1px solid rgba(231, 111, 81, 0.5) !important; 
          }
        `}
      </style>

      <div 
        className={isCritical ? "critical-card-dark" : ""}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px',
          borderLeft: `6px solid ${getStatusColor()}`,
          borderTop: '0.5px solid rgba(255, 255, 255, 0.08)',
          borderRight: '0.5px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
          transition: 'transform 0.2s ease',
          cursor: 'default'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, color: '#e8f0ea', fontSize: '15px', fontWeight: '600' }}>
              {item.item_name || "Ingredient"}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(232, 240, 234, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {item.category || "Pantry"} • {item.location || "Ambient"}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: getStatusColor() }}>
              {score}<span style={{ fontSize: '12px', opacity: 0.5 }}>/5</span>
            </span>
          </div>
        </div>

        <div style={{ marginTop: '14px', fontSize: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'rgba(232, 240, 234, 0.7)' }}>
                Degradation: <span style={{ color: '#e8f0ea' }}>{riskPercent}%</span>
            </span>
            <span style={{ color: getStatusColor(), fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
              {criticalDays} days remaining
            </span>
          </div>
          
          <div style={{ color: 'rgba(232, 240, 234, 0.4)', fontSize: '10px' }}>
            Variance Engine: {stats.lower} - {stats.upper} {item.unit || 'units'}
          </div>
        </div>

        {isCritical && (
          <div style={{ 
            color: '#e76f51', 
            fontWeight: 'bold', 
            marginTop: '12px', 
            fontSize: '10px', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            background: 'rgba(231, 111, 81, 0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            ⚠️ {criticalDays <= 2 ? "Stock Depleting" : "Quality Warning"}
          </div>
        )}
      </div>
    </>
  );
};

export default FreshnessCard;