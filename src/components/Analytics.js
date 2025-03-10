// src/components/Analytics.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import styled from 'styled-components';

const AnalyticsContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ChartContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

function Analytics() {
  const [loading, setLoading] = useState(true);
  const userRole = sessionStorage.getItem('userRole');

  useEffect(() => {
    // Burada grafik verilerini yükleyecek kodlar gelecek
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Eğer admin değilse erişimi engelle
  if (userRole !== 'admin') {
    return (
      <AnalyticsContainer>
        <h2>Yetki Hatası</h2>
        <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
      </AnalyticsContainer>
    );
  }

  if (loading) {
    return (
      <AnalyticsContainer>
        <h2>Analitik Veriler</h2>
        <p>Veriler yükleniyor...</p>
      </AnalyticsContainer>
    );
  }

  return (
    <AnalyticsContainer>
      <h2>Sipariş Analitikleri</h2>
      
      <ChartContainer>
        <h3>En Çok Sipariş Edilen Ürünler</h3>
        <p>Bu özellik yakında eklenecektir.</p>
      </ChartContainer>
      
      <ChartContainer>
        <h3>Marka Bazında Bekleyen Siparişler</h3>
        <p>Bu özellik yakında eklenecektir.</p>
      </ChartContainer>
      
      <ChartContainer>
        <h3>Müşteri Bazında Bekleyen Sipariş Tutarları</h3>
        <p>Bu özellik yakında eklenecektir.</p>
      </ChartContainer>
    </AnalyticsContainer>
  );
}

export default Analytics;