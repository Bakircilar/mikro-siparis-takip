import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useTable, useSortBy, useFilters, usePagination } from 'react-table';
import styled from 'styled-components';

// Tablo stillerini tanımlama
const TableContainer = styled.div`
  padding: 1rem;
  
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
      padding: 0.5rem;
      border-bottom: 1px solid #ddd;
      border-right: 1px solid #ddd;
      
      :last-child {
        border-right: 0;
      }
    }
    
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
  }
  
  .pagination {
    padding: 0.5rem;
  }
`;

// Filtre giriş bileşeni
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
      style={{ width: '100%' }}
    />
  );
}

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Supabase'den veri çekme fonksiyonu
  async function fetchOrders() {
    try {
      setLoading(true);
      
      // Sadece aktif siparişleri getir
      const { data, error } = await supabase
        .from('siparisler')
        .select('*')
        .eq('aktif', true)
        .order('siparis_tarihi', { ascending: false });
        
      if (error) {
        throw error;
      }
      
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
  }, []);
  
  // Tablo sütunlarını tanımla
  const columns = React.useMemo(
    () => [
      {
        Header: 'Müşteri Adı',
        accessor: 'musteri_adi',
      },
      {
        Header: 'Ürün Adı',
        accessor: 'urun_adi',
      },
      {
        Header: 'Ürün Kodu',
        accessor: 'stok_kodu',
      },
      {
        Header: 'Sipariş Miktarı',
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
        Header: 'Depo',
        accessor: 'siparis_deposu',
      },
      {
        Header: 'Satıcı',
        accessor: 'siparis_giren',
      }
    ],
    []
  );
  
  // Tablo filtreleme ayarları
  const defaultColumn = React.useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    []
  );
  
  // react-table hook'larını kullanarak tabloyu oluştur
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
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: orders,
      defaultColumn,
      initialState: { pageIndex: 0, pageSize: 20 },
    },
    useFilters,
    useSortBy,
    usePagination
  );
  
  if (loading) {
    return <div>Siparişler yükleniyor...</div>;
  }
  
  return (
    <TableContainer>
      <h2>Aktif Siparişler</h2>
      <button onClick={fetchOrders}>Yenile</button>
      
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
        </tbody>
      </table>
      
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
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
    </TableContainer>
  );
}

export default OrderList;