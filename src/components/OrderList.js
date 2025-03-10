import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, useFilters, usePagination } from 'react-table';
import { supabase } from '../config/supabase';
import ColumnManager from './ColumnManager';
import styled from 'styled-components';

const OrderListContainer = styled.div`
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  align-items: flex-end;

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

      &:hover {
        background-color: #e5e5e5;
      }
    }

    tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    tr:hover {
      background-color: #f0f0f0;
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
        setFilter(e.target.value || undefined)
      }}
      placeholder={`Ara (${count} kayıt)...`}
      style={{ width: '100%', marginTop: '5px', padding: '5px' }}
    />
  );
}

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [searchText, setSearchText] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState(['msg_s_0088']);

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
  async function fetchOrders() {
    try {
      setLoading(true);
      
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
    }
  }

  // Sayfa yüklendiğinde siparişleri getir
useEffect(() => {
  fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


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
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: orders,
      defaultColumn,
      initialState: { 
        pageIndex: 0, 
        pageSize: 20,
        hiddenColumns,
      },
      filterTypes: {
        globalFilter: applySearchFilter,
      },
    },
    useFilters,
    useSortBy,
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

  if (loading && orders.length === 0) {
    return <div>Siparişler yükleniyor...</div>;
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
        <button onClick={fetchOrders}>Yenile</button>
      </FilterContainer>
      
      <ColumnManager 
        columns={allColumns} 
        onColumnVisibilityChange={toggleColumnVisibility} 
      />
      
      <TableStyles>
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}>
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
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
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
      </TableStyles>
    </OrderListContainer>
  );
}

export default OrderList;