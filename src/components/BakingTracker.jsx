import React from 'react';
import inventoryData from "../inventory_master.json"; 
import FreshnessCard from './FreshnessCard';


const BakingTracker = ({ supabaseItems = [] }) => {
  
  const calculatePoissonRisk = (lambda_p, k) => {
      const e = Math.E;
      const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
      const prob = (Math.pow(e, -lambda_p) * Math.pow(lambda_p, k)) / factorial(k);
      return (prob * 100).toFixed(2); 
  };

  const getScientificData = (itemName) => {
    if (!itemName) return null;
    
    const match = inventoryData.find(entry => 
      itemName.toLowerCase().includes(entry.brand_name?.toLowerCase()) ||
      entry.brand_name?.toLowerCase().includes(itemName.toLowerCase()) ||
      itemName.toLowerCase().includes(entry.branded_food_category?.toLowerCase())
    );

    if (match) return match;

    return {
      Shelf_Life: 21, 
      serving_size: 100,
      serving_size_unit: "units",
      branded_food_category: "General Grocery (Fallback Mode)"
    };
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ 
        fontSize: '22px', 
        fontWeight: 'bold', 
        marginBottom: '16px', 
        color: '#e67e22',
        borderBottom: '2px solid #fb8500',
        paddingBottom: '8px'
      }}>
        Baker's Freshness Monitor
      </h2>

      <div style={{ display: 'grid', gap: '12px' }}>
        {supabaseItems.length === 0 ? (
          <p style={{ 
            color: '#888', 
            fontStyle: 'italic', 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px'
          }}>
            No items in pantry. Add ingredients above to see freshness analysis.
          </p>
        ) : (
          supabaseItems.map(item => {
            const masterInfo = getScientificData(item.item_name);

            if (!masterInfo) return null;

            return (
              <FreshnessCard 
                key={item.id} 
                item={{
                  ...masterInfo, 
                  brand_name: item.item_name, 
                  date_purchased: item.created_at || new Date().toISOString(), 
                  unique_id: item.id
                }} 
              />
            );
          })
        )}
      </div>
      
      <p style={{ fontSize: '10px', color: '#aaa', marginTop: '15px', textAlign: 'center' }}>
        Statistical Engine Active: Scanning {inventoryData.length} master records using Exponential Decay models.
      </p>
    </div>
  );
};

export default BakingTracker;