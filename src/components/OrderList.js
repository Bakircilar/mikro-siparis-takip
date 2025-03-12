import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTable, useSortBy, useFilters, usePagination, useGroupBy, useExpanded } from 'react-table';
import { supabase } from '../config/supabase';
import ColumnManager from './ColumnManager';
import styled from 'styled-components';
import { loadUserPreferences, saveFilterPreferences } from '../services/preferencesService';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';

// Yeni stil bileşenleri ekleyelim
const OrderListContainer = styled.div`
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  position: relative;
  
  .pull-to-refresh {
    text-align: center;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 14px;
    
    .spinner {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-top-color: #4a6da7;
      border-radius: 50%;
      animation: spin 1s infinite linear;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  align-items: flex-end;
  position: sticky;
  top: 0;
  background-color: #f9f9f9;
  z-index: 10;
  padding: 10px 0;
  border-bottom: 1px solid #eee;

  .filter-group {
    flex: 1 1 300px;
  }

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
  }

  input, select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  button {
    padding: 8px 15px;
    background-color: #4a6da7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: #385687;
    }
  }
  
  .quick-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
    width: 100%;
    
    button {
      padding: 6px 12px;
      font-size: 13px;
      border-radius: 20px;
      background-color: #f0f0f0;
      color: #333;
      border: 1px solid #ddd;
      
      &:hover {
        background-color: #e0e0e0;
      }
      
      &.active {
        background-color: #4a6da7;
        color: white;
        border-color: #4a6da7;
      }
    }
  }
  
  .grouping-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
    width: 100%;
    
    button {
      padding: 6px 12px;
      font-size: 13px;
      border-radius: 4px;
      background-color: #f0f0f0;
      color: #333;
      border: 1px solid #ddd;
      
      &:hover {
        background-color: #e0e0e0;
      }
      
      &.active {
        background-color: #4a6da7;
        color: white;
        border-color: #4a6da7;
      }
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    
    .filter-group {
      flex: 1 1 100%;
    }
    
    button {
      width: 100%;
      min-height: 44px;
    }
    
    .quick-filters, .grouping-options {
      justify-content: space-between;
      
      button {
        flex: 1 1 calc(50% - 8px);
        min-height: 44px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 6px 8px;
      }
    }
  }
`;

const TableStyles = styled.div`
  margin-top: 10px;
  overflow-x: auto;

  table {
    border-spacing: 0;
    border: 1px solid #ddd;
    width: 100%;
    
    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }
    
    th, td {
      margin: 0;
      padding: 10px;
      border-bottom: 1px solid #ddd;
      border-right: 1px solid #ddd;
      
      :last-child {
        border-right: 0;
      }
    }
    
    th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: left;
      cursor: pointer;
      position: sticky;
      top: 130px;
      z-index: 9;

      &:hover {
        background-color: #e5e5e5;
      }
      
      &.group-header {
        background-color: #e6f7ff;
      }
    }

    tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    tr:hover {
      background-color: #f0f0f0;
    }
    
    /* Gruplandırma satırları */
    .group-row {
      background-color: #e6f7ff;
      font-weight: bold;
      cursor: pointer;
      
      &:hover {
        background-color: #d6e9f8;
      }
      
      td {
        padding: 8px 10px;
      }
      
      .expander {
        margin-right: 8px;
        display: inline-block;
        transition: transform 0.2s;
        
        &.expanded {
          transform: rotate(90deg);
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    margin-top: 15px;

    .pagination-buttons {
      display: flex;
      gap: 5px;

      button {
        background-color: #4a6da7;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;

        &:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        &:hover:not(:disabled) {
          background-color: #385687;
        }
      }
    }

    .pagination-info {
      font-size: 14px;
    }
  }
  
  /* Mobil Görünüm - Liste bazlı tablo */
  @media (max-width: 768px) {
    .mobile-table {
      display: block;
      width: 100%;
      
      .mobile-table-row {
        margin-bottom: 10px;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        
        &:active {
          background-color: #f5f5f5;
        }
      }
      
      .mobile-table-cell {
        display: flex;
        padding: 8px 10px;
        border-bottom: 1px solid #eee;
        
        &:last-child {
          border-bottom: none;
        }
        
        .cell-label {
          flex: 1;
          font-weight: 500;
          color: #666;
        }
        
        .cell-value {
          flex: 2;
          text-align: right;
        }
      }
      
      /* En önemli kolon başlıkta gösterilsin */
      .mobile-table-header {
        background-color: #f5f5f5;
        padding: 10px;
        font-weight: bold;
        font-size: 16px;
        border-bottom: 1px solid #ddd;
      }
    }
    
    .desktop-table {
      display: none;
    }
  }
  
  @media (min-width: 769px) {
    .mobile-table {
      display: none;
    }
    
    .desktop-table {
      display: block;
    }
  }
`;

// Yan Panel Stili
const DetailPanel = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-400px'};
  width: 400px;
  max-width: 90vw;
  height: 100vh;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transition: right 0.3s ease;
  overflow-y: auto;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: #4a6da7;
    color: white;
    
    h3 {
      margin: 0;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .panel-content {
    padding: 15px;
    
    .detail-group {
      margin-bottom: 15px;
      
      h4 {
        margin: 0 0 8px 0;
        color: #333;
        font-size: 16px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      
      .detail-row {
        display: flex;
        margin-bottom: 5px;
        
        .detail-label {
          flex: 1;
          font-weight: 500;
          color: #666;
        }
        
        .detail-value {
          flex: 2;
          text-align: right;
        }
      }
    }
  }
  
  @media (max-width: 768px) {
    width: 90vw;
    
    .panel-header {
      padding: 10px 15px;
      
      h3 {
        font-size: 18px;
      }
    }
  }
`;

// Overlay
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
  opacity: ${props => props.isVisible ? 1 : 0};
  pointer-events: ${props => props.isVisible ? 'auto' : 'none'};
  transition: opacity 0.3s ease;
`;

// Yükleniyor komponenti
const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #4a6da7;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Varsayılan kolon filtreleme bileşeni
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter },
}) {
  const count = preFilteredRows.length;
  
  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
      placeholder={`Ara (${count} kayıt)...`}
      style={{ width: '100%', marginTop: '5px', padding: '5px' }}
    />
  );
}

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [searchText, setSearchText] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState(['msg_s_0088']);
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [activeGrouping, setActiveGrouping] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  
  const tableRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
  // Kullanıcı ID'si
  const userId = sessionStorage.getItem('userId');
  
  // İlk yüklemede kullanıcı tercihlerini al
  useEffect(() => {
    if (userId) {
      loadUserPreferences(userId).then(result => {
        if (result.success && result.preferences.kolon_tercihleri) {
          setHiddenColumns(result.preferences.kolon_tercihleri);
        }
        
        // Aktif filtre varsa uygula
        if (result.success && result.preferences.filtre_tercihleri 
            && result.preferences.filtre_tercihleri.quickFilter) {
          setActiveQuickFilter(result.preferences.filtre_tercihleri.quickFilter);
          applyQuickFilter(result.preferences.filtre_tercihleri.quickFilter);
        } else {
          // Varsayılan olarak son 7 günü göster
          setActiveQuickFilter('last7');
          applyQuickFilter('last7');
        }
      });
    } else {
      // Kullanıcı ID yoksa varsayılan olarak son 7 günü göster
      setActiveQuickFilter('last7');
      applyQuickFilter('last7');
    }
  }, [userId]);
  
  // Tüm alanları içeren kolon tanımları
  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'msg_s_0088',
      },
      {
        Header: 'Müşteri Kodu',
        accessor: 'musteri_kodu',
      },
      {
        Header: 'Müşteri Adı',
        accessor: 'musteri_adi',
      },
      {
        Header: 'Bakiye',
        accessor: 'bakiye',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'F-1',
        accessor: 'f_1',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'F-5',
        accessor: 'f_5',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'P-1',
        accessor: 'p_1',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'P-5',
        accessor: 'p_5',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'Son Giriş Maliyeti',
        accessor: 'son_giris_maliyeti',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'Son Giriş Tarihi',
        accessor: 'son_giris_tarihi'
      },
      {
        Header: 'Güncel Maliyet',
        accessor: 'guncel_maliyet',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'Stok Kodu',
        accessor: 'stok_kodu',
      },
      {
        Header: 'Ürün Adı',
        accessor: 'urun_adi',
      },
      {
        Header: 'Birim',
        accessor: 'birim',
      },
      {
        Header: 'Marka',
        accessor: 'marka',
      },
      {
        Header: 'Sipariş Tarihi',
        accessor: 'siparis_tarihi',
      },
      {
        Header: 'Teslim Tarihi',
        accessor: 'teslim_tarihi',
      },
      {
        Header: 'Belge No',
        accessor: 'belge_no',
      },
      {
        Header: 'Sıra No',
        accessor: 'sira_no',
      },
      {
        Header: 'Sipariş Deposu',
        accessor: 'siparis_deposu',
      },
      {
        Header: 'Merkez Depo',
        accessor: 'merkez_depo_miktar',
      },
      {
        Header: 'Topça Dükkan',
        accessor: 'topca_depo_miktar',
      },
      {
        Header: 'Sipariş Miktar',
        accessor: 'siparis_miktar',
      },
      {
        Header: 'Birim Fiyat',
        accessor: 'birim_fiyat',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'Toplam Tutar',
        accessor: 'toplam_tutar',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'Kalan Tutar',
        accessor: 'kalan_tutar',
        Cell: ({ value }) => value ? `₺${parseFloat(value).toFixed(2)}` : '-'
      },
      {
        Header: 'Açıklama',
        accessor: 'aciklama',
      },
      {
        Header: 'Sektör Kodu',
        accessor: 'sektor_kodu',
      },
      {
        Header: 'Grup Kodu',
        accessor: 'grup_kodu',
      },
      {
        Header: 'Şehir',
        accessor: 'sehir',
      },
      {
        Header: 'Vade',
        accessor: 'vade',
      },
      {
        Header: 'Siparişi Giren',
        accessor: 'siparis_giren',
      }
    ],
    []
  );

  // Tablo filtreleme ayarları
  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    []
  );

  // Supabase'den veri çekme fonksiyonu
  const fetchOrders = useCallback(async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      
      // Kullanıcı filtrelemesi için oturum bilgilerini al
      const filterCriteria = JSON.parse(sessionStorage.getItem('filterCriteria'));
      
      // Supabase sorgusu oluştur
      let query = supabase
        .from('siparisler')
        .select('*')
        .eq('aktif', true);
      
      // Kullanıcı rolüne göre filtreleme ekle
      if (filterCriteria) {
        if (filterCriteria.values) {
          // Ofis rolü için çoklu değer filtreleme
          query = query.in(filterCriteria.field, filterCriteria.values);
        } else if (filterCriteria.value) {
          // Satıcı rolü için tek değer filtreleme
          query = query.ilike(filterCriteria.field, `%${filterCriteria.value}%`);
        }
      }
      
      // Tarih filtresi ekle
      if (dateFilter.startDate) {
        query = query.gte('siparis_tarihi', dateFilter.startDate);
      }
      
      if (dateFilter.endDate) {
        query = query.lte('siparis_tarihi', dateFilter.endDate);
      }
      
      // Sorguyu çalıştır
      const { data, error } = await query.order('siparis_tarihi', { ascending: false });
          
      if (error) throw error;
      
      if (data) {
        setOrders(data);
      }
      
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
      alert('Siparişler yüklenemedi. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter]);

  // Sayfa yüklendiğinde siparişleri getir
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Kolon görünürlüğünü değiştirme fonksiyonu
  const toggleColumnVisibility = (columnId) => {
    setHiddenColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  // Tarih filtresini uygulama
  const applyDateFilter = () => {
    fetchOrders();
  };

  // Genel arama filtresini uygulama
  const applySearchFilter = (rows) => {
    if (!searchText) return rows;
    
    return rows.filter(row => {
      return Object.values(row.values).some(value => {
        if (value === null || value === undefined) return false;
        return String(value)
          .toLowerCase()
          .includes(searchText.toLowerCase());
      });
    });
  };

  // Hızlı filtre butonlarını uygulama
  const applyQuickFilter = (filterType) => {
    let startDate = '';
    let endDate = '';
    const today = new Date();
    
    switch (filterType) {
      case 'today':
        startDate = format(today, 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        startDate = format(yesterday, 'yyyy-MM-dd');
        endDate = format(yesterday, 'yyyy-MM-dd');
        break;
      case 'thisWeek':
        startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'last7':
        startDate = format(subDays(today, 6), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'all':
        startDate = '';
        endDate = '';
        break;
      default:
        return;
    }
    
    setDateFilter({ startDate, endDate });
    setActiveQuickFilter(filterType);
    
    // Filtre tercihini kaydet
    if (userId) {
      saveFilterPreferences(userId, { quickFilter: filterType });
    }
    
    // Filtre değiştiğinde veriyi yeniden çek
    setTimeout(() => {
      fetchOrders();
    }, 0);
  };

  // Gruplandırma işlevi
  const applyGrouping = (groupType) => {
    setActiveGrouping(groupType === activeGrouping ? null : groupType);
  };

  // Pull-to-refresh fonksiyonları
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = () => {
    const pullDistance = touchEndY.current - touchStartY.current;
    const tablePosition = tableRef.current?.getBoundingClientRect().top || 0;
    
    // Eğer tablonun en üstündeyse ve yeterince aşağı çekilmişse yenile
    if (tablePosition >= 0 && pullDistance > 50) {
      fetchOrders(true);
    }
  };
  
  // Sipariş seçme ve detay panelini açma
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setDetailPanelOpen(true);
  };
  
  // Detay panelini kapatma
  const closeDetailPanel = () => {
    setDetailPanelOpen(false);
  };

  // react-table hook'ları
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    allColumns,
    visibleColumns,
    state: { pageIndex, pageSize, groupBy, expanded },
  } = useTable(
    {
      columns,
      data: orders,
      defaultColumn,
      initialState: { 
        pageIndex: 0, 
        pageSize: 20,
        hiddenColumns,
        groupBy: []
      },
      filterTypes: {
        globalFilter: applySearchFilter,
      },
      autoResetExpanded: false,
    },
    useFilters,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination
  );

  // Sayfa değiştiğinde hidden columns'u güncelle
  useEffect(() => {
    if (allColumns.length > 0) {
      allColumns.forEach(column => {
        column.toggleHidden(hiddenColumns.includes(column.id));
      });
    }
  }, [hiddenColumns, allColumns]);
  
  // Aktif gruplandırma değiştiğinde tablo gruplandırmasını güncelle
  useEffect(() => {
    if (activeGrouping === 'tarih') {
      // Tarih bazında gruplandırma
      headerGroups[0]?.headers.find(h => h.id === 'siparis_tarihi')?.toggleGroupBy();
    } else if (activeGrouping === 'musteri') {
      // Müşteri bazında gruplandırma
      headerGroups[0]?.headers.find(h => h.id === 'musteri_adi')?.toggleGroupBy();
    } else if (activeGrouping === 'marka') {
      // Marka bazında gruplandırma
      headerGroups[0]?.headers.find(h => h.id === 'marka')?.toggleGroupBy();
    }
  }, [activeGrouping, headerGroups]);

  if (loading && orders.length === 0) {
    return (
      <OrderListContainer>
        <h2>Sipariş Listesi</h2>
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      </OrderListContainer>
    );
  }

  // Upload rolündeki kullanıcılar sipariş listesi görmüyor
  const userRole = sessionStorage.getItem('userRole');
  const filterCriteria = JSON.parse(sessionStorage.getItem('filterCriteria'));

  if (userRole === 'upload' || (filterCriteria && filterCriteria.onlyUpload)) {
    return (
      <OrderListContainer>
        <h2>Excel Yükleme Modu</h2>
        <p>Bu kullanıcı rolü sadece Excel yükleme işlemi yapabilir. Sipariş listesi görüntülenemiyor.</p>
        <p>Excel yüklemek için üst menüdeki "Excel Yükle" butonunu kullanabilirsiniz.</p>
      </OrderListContainer>
    );
  }

  // Hızlı filtre butonları için etiketler
  const quickFilterLabels = {
    today: 'Bugün',
    yesterday: 'Dün',
    thisWeek: 'Bu Hafta',
    last7: 'Son 7 Gün',
    thisMonth: 'Bu Ay',
    all: 'Tümü'
  };
  
  // Gruplandırma butonları için etiketler
  const groupingLabels = {
    tarih: 'Tarihe Göre',
    musteri: 'Müşteriye Göre',
    marka: 'Markaya Göre'
  };

  return (
    <OrderListContainer>
      <h2>Sipariş Listesi</h2>
      
      <FilterContainer>
        <div className="filter-group">
          <label>Başlangıç Tarihi:</label>
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={e => setDateFilter({...dateFilter, startDate: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Bitiş Tarihi:</label>
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={e => setDateFilter({...dateFilter, endDate: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Genel Arama:</label>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Müşteri, ürün, belge no vb."
          />
        </div>
        
        <button onClick={applyDateFilter}>Filtrele</button>
        <button onClick={() => fetchOrders()}>Yenile</button>
        
        {/* Hızlı filtre butonları */}
        <div className="quick-filters">
          {Object.keys(quickFilterLabels).map(filter => (
            <button
              key={filter}
              className={activeQuickFilter === filter ? 'active' : ''}
              onClick={() => applyQuickFilter(filter)}
            >
              {quickFilterLabels[filter]}
            </button>
          ))}
        </div>
        
        {/* Gruplandırma butonları */}
        <div className="grouping-options">
          <span style={{ marginRight: '8px', alignSelf: 'center' }}>Gruplandır:</span>
          {Object.keys(groupingLabels).map(group => (
            <button
              key={group}
              className={activeGrouping === group ? 'active' : ''}
              onClick={() => applyGrouping(group)}
            >
              {groupingLabels[group]}
            </button>
          ))}
        </div>
      </FilterContainer>
      
      <ColumnManager 
        columns={allColumns} 
        onColumnVisibilityChange={toggleColumnVisibility}
        hiddenColumns={hiddenColumns}
      />
      
      <TableStyles
        ref={tableRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {refreshing && (
          <div className="pull-to-refresh">
            <div className="spinner"></div>
            <span>Yenileniyor...</span>
          </div>
        )}
        
        {/* Masaüstü Tablo Görünümü */}
        <div className="desktop-table">
          <table {...getTableProps()}>
            <thead>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th 
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className={column.isGrouped ? 'group-header' : ''}
                    >
                      {column.render('Header')}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? ' 🔽'
                            : ' 🔼'
                          : ''}
                      </span>
                      <div>{column.canFilter ? column.render('Filter') : null}</div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row) => {
                prepareRow(row);
                return (
                  <tr 
                    {...row.getRowProps()}
                    className={row.isGrouped ? 'group-row' : ''}
                    onClick={() => {
                      if (row.isGrouped) {
                        row.toggleExpanded();
                      } else {
                        handleOrderSelect(row.original);
                      }
                    }}
                  >
                    {row.cells.map(cell => {
                      if (cell.isGrouped) {
                        return (
                          <td {...cell.getCellProps()}>
                            <span className={`expander ${row.isExpanded ? 'expanded' : ''}`}>
                              ▶
                            </span>
                            {cell.render('Cell')} ({row.subRows.length})
                          </td>
                        );
                      } else if (cell.isAggregated) {
                        return <td {...cell.getCellProps()}>{cell.render('Aggregated')}</td>;
                      } else if (cell.isPlaceholder) {
                        return <td {...cell.getCellProps()}></td>;
                      } else {
                        return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                      }
                    })}
                  </tr>
                );
              })}
              {page.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ textAlign: 'center', padding: '20px' }}>
                    Gösterilecek sipariş bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="pagination">
            <div className="pagination-buttons">
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                {'<<'}
              </button>
              <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                {'<'}
              </button>
              <button onClick={() => nextPage()} disabled={!canNextPage}>
                {'>'}
              </button>
              <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                {'>>'}
              </button>
            </div>
            
            <div className="pagination-info">
              <span>
                Sayfa{' '}
                <strong>
                  {pageIndex + 1} / {pageOptions.length}
                </strong>{' '}
              </span>
              <span>
                | Sayfa başına:{' '}
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                  }}
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          </div>
        </div>
        
        {/* Mobil Tablo Görünümü */}
        <div className="mobile-table">
          {page.map((row, i) => {
            prepareRow(row);
            
            // Gruplandırma satırı
            if (row.isGrouped) {
              return (
                <div 
                  key={i} 
                  className="mobile-table-row" 
                  style={{ backgroundColor: '#e6f7ff' }}
                  onClick={() => row.toggleExpanded()}
                >
                  <div className="mobile-table-header" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      marginRight: '10px', 
                      transform: row.isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                    {row.cells.find(cell => cell.isGrouped)?.render('Cell')} ({row.subRows.length})
                  </div>
                </div>
              );
            }
            
            // Normal sipariş satırı
            if (!row.isGrouped && !row.isPlaceholder) {
              const mainInfo = row.values.musteri_adi || row.values.belge_no || 'Sipariş Bilgisi';
              const subInfo = row.values.urun_adi || '';
              
              return (
                <div key={i} className="mobile-table-row" onClick={() => handleOrderSelect(row.original)}>
                  <div className="mobile-table-header">
                    {mainInfo}
                    {subInfo && <span style={{ fontSize: '14px', color: '#666', display: 'block', marginTop: '5px' }}>{subInfo}</span>}
                  </div>
                  
                  <div className="mobile-table-cell">
                    <div className="cell-label">Sipariş Tarihi:</div>
                    <div className="cell-value">{row.values.siparis_tarihi || '-'}</div>
                  </div>
                  
                  <div className="mobile-table-cell">
                    <div className="cell-label">Sipariş Miktarı:</div>
                    <div className="cell-value">{row.values.siparis_miktar || '-'}</div>
                  </div>
                  
                  <div className="mobile-table-cell">
                    <div className="cell-label">Toplam Tutar:</div>
                    <div className="cell-value">
                      {row.values.toplam_tutar 
                        ? `₺${parseFloat(row.values.toplam_tutar).toFixed(2)}` 
                        : '-'}
                    </div>
                  </div>
                  
                  <div className="mobile-table-cell">
                    <div className="cell-label">Teslim Tarihi:</div>
                    <div className="cell-value">{row.values.teslim_tarihi || '-'}</div>
                  </div>
                </div>
              );
            }
            
            return null;
          })}
          
          {page.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              backgroundColor: 'white', 
              borderRadius: '8px',
              marginTop: '10px' 
            }}>
              Gösterilecek sipariş bulunamadı.
            </div>
          )}
          
          {/* Mobil Pagination */}
          <div className="pagination">
            <div className="pagination-buttons">
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>{'<<'}</button>
              <button onClick={() => previousPage()} disabled={!canPreviousPage}>{'<'}</button>
              <button onClick={() => nextPage()} disabled={!canNextPage}>{'>'}</button>
              <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>{'>>'}</button>
            </div>
            <div className="pagination-info">
              <div>
                Sayfa {pageIndex + 1} / {pageOptions.length}
              </div>
              <div>
                Sayfa başına:{' '}
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                  }}
                  style={{ marginLeft: '5px' }}
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </TableStyles>
      
      {/* Sipariş Detay Paneli */}
      <Overlay isVisible={detailPanelOpen} onClick={closeDetailPanel} />
      <DetailPanel isOpen={detailPanelOpen}>
        <div className="panel-header">
          <h3>Sipariş Detayları</h3>
          <button className="close-btn" onClick={closeDetailPanel}>✕</button>
        </div>
        
        {selectedOrder && (
          <div className="panel-content">
            <div className="detail-group">
              <h4>Müşteri Bilgileri</h4>
              <div className="detail-row">
                <div className="detail-label">Müşteri Adı:</div>
                <div className="detail-value">{selectedOrder.musteri_adi || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Müşteri Kodu:</div>
                <div className="detail-value">{selectedOrder.musteri_kodu || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Şehir:</div>
                <div className="detail-value">{selectedOrder.sehir || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Bakiye:</div>
                <div className="detail-value">
                  {selectedOrder.bakiye 
                    ? `₺${parseFloat(selectedOrder.bakiye).toFixed(2)}` 
                    : '-'}
                </div>
              </div>
            </div>
            
            <div className="detail-group">
              <h4>Sipariş Bilgileri</h4>
              <div className="detail-row">
                <div className="detail-label">Sipariş Tarihi:</div>
                <div className="detail-value">{selectedOrder.siparis_tarihi || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Teslim Tarihi:</div>
                <div className="detail-value">{selectedOrder.teslim_tarihi || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Belge No:</div>
                <div className="detail-value">{selectedOrder.belge_no || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Sıra No:</div>
                <div className="detail-value">{selectedOrder.sira_no || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Siparişi Giren:</div>
                <div className="detail-value">{selectedOrder.siparis_giren || '-'}</div>
              </div>
            </div>
            
            <div className="detail-group">
              <h4>Ürün Bilgileri</h4>
              <div className="detail-row">
                <div className="detail-label">Ürün Adı:</div>
                <div className="detail-value">{selectedOrder.urun_adi || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Stok Kodu:</div>
                <div className="detail-value">{selectedOrder.stok_kodu || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Marka:</div>
                <div className="detail-value">{selectedOrder.marka || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Birim:</div>
                <div className="detail-value">{selectedOrder.birim || '-'}</div>
              </div>
            </div>
            
            <div className="detail-group">
              <h4>Miktar ve Fiyat Bilgileri</h4>
              <div className="detail-row">
                <div className="detail-label">Sipariş Miktarı:</div>
                <div className="detail-value">{selectedOrder.siparis_miktar || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Birim Fiyat:</div>
                <div className="detail-value">
                  {selectedOrder.birim_fiyat 
                    ? `₺${parseFloat(selectedOrder.birim_fiyat).toFixed(2)}` 
                    : '-'}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Toplam Tutar:</div>
                <div className="detail-value">
                  {selectedOrder.toplam_tutar 
                    ? `₺${parseFloat(selectedOrder.toplam_tutar).toFixed(2)}` 
                    : '-'}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Kalan Tutar:</div>
                <div className="detail-value">
                  {selectedOrder.kalan_tutar 
                    ? `₺${parseFloat(selectedOrder.kalan_tutar).toFixed(2)}` 
                    : '-'}
                </div>
              </div>
            </div>
            
            <div className="detail-group">
              <h4>Depo Bilgileri</h4>
              <div className="detail-row">
                <div className="detail-label">Sipariş Deposu:</div>
                <div className="detail-value">{selectedOrder.siparis_deposu || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Merkez Depo:</div>
                <div className="detail-value">{selectedOrder.merkez_depo_miktar || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Topça Dükkan:</div>
                <div className="detail-value">{selectedOrder.topca_depo_miktar || '-'}</div>
              </div>
            </div>
            
            {selectedOrder.aciklama && (
              <div className="detail-group">
                <h4>Açıklama</h4>
                <div style={{ padding: '8px 0' }}>{selectedOrder.aciklama}</div>
              </div>
            )}
          </div>
        )}
      </DetailPanel>
    </OrderListContainer>
  );
}

export default OrderList;