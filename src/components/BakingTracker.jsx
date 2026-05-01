import React from 'react';
import FreshnessCard from './FreshnessCard';

const BakingTracker = ({ supabaseItems = [] }) => {
  // --- CORE LOGIC UNTOUCHED ---
  const calculatePoissonRisk = (lambda_p, k) => {
      if (lambda_p <= 0) return 0;
      const e = Math.E;
      const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
      const prob = (Math.pow(e, -lambda_p) * Math.pow(lambda_p, k)) / factorial(k);
      return parseFloat((prob * 100).toFixed(2)); 
  };

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalConfidence = 0;
  let actionNeededCount = 0;

  supabaseItems.forEach(item => {
    const today = new Date();
    const createdDate = new Date(item.created_at || today);
    const daysOld = Math.max(0.1, (today - createdDate) / (1000 * 60 * 60 * 24));
    const shelfLife = Number(item.shelf_life) || 14; 
    const usage = Number(item.weekly_usage) || 0;
    const stock = Number(item.quantity) || 1;
    const lambda = 1 / shelfLife;
    const degradationRisk = (1 - Math.pow(Math.E, -lambda * daysOld)) * 100;
    const stockOutProb = usage > stock ? calculatePoissonRisk(usage, stock) : 0;
    const baseScore = 5 - Math.floor(degradationRisk / 20);
    const score = Math.max(1, Math.min(5, usage > stock ? baseScore - 1 : baseScore));
    distribution[score]++;
    const confidence = Math.max(10, 100 - (daysOld * (100 / shelfLife)));
    totalConfidence += confidence;
    if (score <= 2 || usage >= stock) actionNeededCount++;
  });

  const total = supabaseItems.length || 1;
  const avgConfidence = Math.round(totalConfidence / total);

  return (
    <div style={{ marginTop: '40px' }}>
      {/* UPDATED TITLE: DM Serif Style */}
      <h2 style={styles.header}>Baker's Freshness Analytics</h2>

      {/* TOP STATS: Dark Module Style */}
      <div style={styles.statsRow}>
          <div style={styles.statCard}>
              <span style={styles.statLabel}>Data Confidence</span>
              <span style={{...styles.statValue, color: avgConfidence > 75 ? '#52b788' : '#f4a261'}}>
                  {avgConfidence}%
              </span>
          </div>
          <div style={styles.statCard}>
              <span style={styles.statLabel}>Action Required</span>
              <span style={{...styles.statValue, color: actionNeededCount > 0 ? '#e76f51' : '#52b788'}}>
                  {actionNeededCount}
              </span>
          </div>
      </div>

      {/* HEALTH DISTRIBUTION: Transparent Glass Look */}
      {supabaseItems.length > 0 && (
        <div style={styles.dashboardCard}>
            <div style={styles.gaugeLabel}>Inventory Health (Distribution 1-5)</div>
            <div style={styles.progressBar}>
                <div style={{...styles.segment, backgroundColor: '#e76f51', width: `${(distribution[1]/total)*100}%`}} />
                <div style={{...styles.segment, backgroundColor: '#f4a261', width: `${(distribution[2]/total)*100}%`}} />
                <div style={{...styles.segment, backgroundColor: '#e9c46a', width: `${(distribution[3]/total)*100}%`}} />
                <div style={{...styles.segment, backgroundColor: '#95d5b2', width: `${(distribution[4]/total)*100}%`}} />
                <div style={{...styles.segment, backgroundColor: '#40916c', width: `${(distribution[5]/total)*100}%`}} />
            </div>
            <div style={styles.legend}>
                <span>Critical Risk</span>
                <span>Fresh & Stable</span>
            </div>
        </div>
      )}

      {/* ITEM LIST */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {supabaseItems.length === 0 ? (
          <p style={styles.emptyText}>No items analyzed.</p>
        ) : (
          supabaseItems.map(item => (
            <FreshnessCard 
              key={item.id} 
              item={{
                item_name: item.item_name,
                brand_name: item.brand_name || "Generic", 
                date_purchased: item.created_at || new Date().toISOString(), 
                unique_id: item.id,
                shelf_life: item.shelf_life || 14,
                weekly_usage: item.weekly_usage || 0,
                quantity: item.quantity || 0
              }} 
            />
          ))
        )}
      </div>
      
      <p style={styles.footerNote}>
        COMPUTATIONAL ENGINE: EXPONENTIAL DECAY & POISSON MODELS ACTIVE
      </p>
    </div>
  );
};

const styles = {
    header: { 
      fontSize: '24px', 
      fontFamily: "'DM Serif Display', serif", 
      fontWeight: '400', 
      marginBottom: '20px', 
      color: '#e8f0ea', 
      borderBottom: '1px solid rgba(255,255,255,0.1)', 
      paddingBottom: '10px' 
    },
    statsRow: { display: 'flex', gap: '12px', marginBottom: '18px' },
    statCard: { 
        flex: 1, 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        padding: '16px', 
        borderRadius: '12px', 
        border: '0.5px solid rgba(255,255,255,0.08)', 
        textAlign: 'center' 
    },
    statLabel: { 
      fontSize: '10px', 
      color: 'rgba(232, 240, 234, 0.4)', 
      fontWeight: '600', 
      textTransform: 'uppercase', 
      letterSpacing: '1px', 
      marginBottom: '6px' 
    },
    statValue: { fontSize: '24px', fontWeight: '800' },
    dashboardCard: { 
      marginBottom: '28px', 
      padding: '20px', 
      backgroundColor: 'rgba(255,255,255,0.02)', 
      borderRadius: '14px', 
      border: '0.5px solid rgba(255,255,255,0.08)' 
    },
    gaugeLabel: { 
      fontSize: '11px', 
      fontWeight: '600', 
      color: 'rgba(232, 240, 234, 0.6)', 
      marginBottom: '14px', 
      textTransform: 'uppercase', 
      letterSpacing: '0.5px' 
    },
    progressBar: { 
      display: 'flex', 
      height: '10px', 
      borderRadius: '20px', 
      overflow: 'hidden', 
      backgroundColor: 'rgba(255,255,255,0.05)' 
    },
    segment: { height: '100%', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' },
    legend: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      marginTop: '10px', 
      fontSize: '9px', 
      color: 'rgba(232, 240, 234, 0.3)', 
      fontWeight: 'bold', 
      letterSpacing: '0.5px' 
    },
    emptyText: { 
      color: 'rgba(232, 240, 234, 0.3)', 
      fontStyle: 'italic', 
      textAlign: 'center', 
      padding: '30px', 
      backgroundColor: 'rgba(255,255,255,0.01)', 
      borderRadius: '12px' 
    },
    footerNote: { 
      fontSize: '9px', 
      color: 'rgba(232, 240, 234, 0.2)', 
      marginTop: '25px', 
      textAlign: 'center', 
      letterSpacing: '1.5px', 
      textTransform: 'uppercase' 
    }
};

export default BakingTracker;