import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderList from './OrderList';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  background-color: #f8f8f8;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h1 {
    margin: 0;
    color: #333;
  }
  
  .button-container {
    display: flex;
    gap: 10px;
  }
  
  button {
    padding: 8px 16px;
    background-color: #4a6da7;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #385687;
    }
    
    &.logout-btn {
      background-color: #e74c3c;
      
      &:hover {
        background-color: #c0392b;
      }
    }
  }
`;

function Dashboard() {
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);
  
  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('filterCriteria');
    navigate('/login');
  };
  
  const navigateToAnalytics = () => {
    navigate('/analytics');
  };
  
  return (
    <DashboardContainer>
      <Header>
        <h1>Mikro ERP Sipariş Takip Sistemi</h1>
        <div className="button-container">
          {userRole === 'admin' && (
            <button onClick={navigateToAnalytics}>
              Grafikler ve Analizler
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </Header>
      
      <OrderList />
    </DashboardContainer>
  );
}

export default Dashboard;