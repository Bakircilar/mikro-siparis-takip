import React from 'react';
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
  
  h1 {
    margin: 0;
    color: #333;
  }
`;

function Dashboard() {
  return (
    <DashboardContainer>
      <Header>
        <h1>Mikro ERP Sipariş Takip Sistemi</h1>
      </Header>
      
      <OrderList />
    </DashboardContainer>
  );
}

export default Dashboard;