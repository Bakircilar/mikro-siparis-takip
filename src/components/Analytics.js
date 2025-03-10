import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
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
  }
`;

const ChartContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  
  h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
`;

// Renk dizisi
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#ff6361', '#bc5090', '#58508d', '#003f5c'];

function Analytics() {
  const [topProducts, setTopProducts] = useState([]);
  const [brandPendingOrders, setBrandPendingOrders] = useState([]);
  const [customerPendingOrders, setCustomerPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const userRole = sessionStorage.getItem('userRole');
    
    // Sadece admin için veri yükleme
    if (userRole !== 'admin') {
      return;
    }
    
    loadAnalyticsData();
  }, []);
  
  async function loadAnalyticsData() {
    setLoading(true);
    try {
      // 1. En çok sipariş edilen ürünler
      const { data: productData, error: productError } = await supabase
        .from('siparisler')
        .select('urun_adi, siparis_miktar')
        .eq('aktif', true);
        
      if (productError) throw productError;
      
      if (productData) {
        // Ürün bazında gruplama
        const productCounts = {};
        productData.forEach(item => {
          if (item.urun_adi) {
            if (!productCounts[item.urun_adi]) {
              productCounts[item.urun_adi] = 0;
            }
            productCounts[item.urun_adi] += parseFloat(item.siparis_miktar || 0);
          }
        });
        
        // Grafiğe uygun formata dönüştür
        const formattedProductData = Object.keys(productCounts)
          .map(key => ({
            name: key,
            value: productCounts[key]
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // İlk 10 ürün
          
        setTopProducts(formattedProductData);
      }
      
      // 2. Marka bazında bekleyen siparişler
      const { data: brandData, error: brandError } = await supabase
        .from('siparisler')
        .select('marka, siparis_miktar')
        .eq('aktif', true);
        
      if (brandError) throw brandError;
      
      if (brandData) {
        // Marka bazında gruplama
        const brandCounts = {};
        brandData.forEach(item => {
          if (item.marka) {
            if (!brandCounts[item.marka]) {
              brandCounts[item.marka] = 0;
            }
            brandCounts[item.marka] += parseFloat(item.siparis_miktar || 0);
          }
        });
        
        // Grafiğe uygun formata dönüştür
        const formattedBrandData = Object.keys(brandCounts)
          .map(key => ({
            name: key,
            value: brandCounts[key]
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // İlk 10 marka
          
        setBrandPendingOrders(formattedBrandData);
      }
      
      // 3. Müşteri bazında bekleyen sipariş tutarları
      const { data: customerData, error: customerError } = await supabase
        .from('siparisler')
        .select('musteri_adi, toplam_tutar')
        .eq('aktif', true);
        
      if (customerError) throw customerError;
      
      if (customerData) {
        // Müşteri bazında gruplama
        const customerTotals = {};
        customerData.forEach(item => {
          if (item.musteri_adi) {
            if (!customerTotals[item.musteri_adi]) {
              customerTotals[item.musteri_adi] = 0;
            }
            customerTotals[item.musteri_adi] += parseFloat(item.toplam_tutar || 0);
          }
        });
        
        // Grafiğe uygun formata dönüştür
        const formattedCustomerData = Object.keys(customerTotals)
          .map(key => ({
            name: key,
            value: customerTotals[key]
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // İlk 10 müşteri
          
        setCustomerPendingOrders(formattedCustomerData);
      }
      
    } catch (error) {
      console.error('Analitik verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Eğer admin değilse erişimi engelle
  const userRole = sessionStorage.getItem('userRole');
  if (userRole !== 'admin') {
    return (
      <AnalyticsContainer>
        <Header>
          <h1>Yetkilendirme Hatası</h1>
          <button onClick={navigateToDashboard}>Ana Sayfaya Dön</button>
        </Header>
        <ChartContainer>
          <p>Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.</p>
        </ChartContainer>
      </AnalyticsContainer>
    );
  }
  
  if (loading) {
    return (
      <AnalyticsContainer>
        <Header>
          <h1>Sipariş Analitikleri</h1>
          <button onClick={navigateToDashboard}>Ana Sayfaya Dön</button>
        </Header>
        <ChartContainer>
          <p>Veriler yükleniyor, lütfen bekleyin...</p>
        </ChartContainer>
      </AnalyticsContainer>
    );
  }
  
  return (
    <AnalyticsContainer>
      <Header>
        <h1>Sipariş Analitikleri</h1>
        <button onClick={navigateToDashboard}>Ana Sayfaya Dön</button>
      </Header>
      
      <ChartContainer>
        <h3>En Çok Sipariş Edilen Ürünler</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toFixed(2)} adet`} />
            <Legend />
            <Bar dataKey="value" name="Sipariş Miktarı" fill="#4a6da7" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      <ChartContainer>
        <h3>Marka Bazında Bekleyen Siparişler</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={brandPendingOrders}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {brandPendingOrders.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value.toFixed(2)} adet`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      <ChartContainer>
        <h3>Müşteri Bazında Bekleyen Sipariş Tutarları</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={customerPendingOrders}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => `₺${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="value" name="Toplam Tutar" fill="#FF8042" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </AnalyticsContainer>
  );
}

export default Analytics;