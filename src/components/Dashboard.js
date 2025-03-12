import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderList from './OrderList';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';

// Stil tanımları
const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px 10px;
  }
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
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 15px;
    
    h1 {
      margin-bottom: 15px;
      font-size: 20px;
      text-align: center;
    }
    
    .button-container {
      justify-content: center;
      flex-wrap: wrap;
    }
    
    button {
      flex: 1;
      min-height: 44px;
      font-size: 14px;
      white-space: nowrap;
      margin-bottom: 5px;
    }
  }
`;

// Yeni bir Upload Modal bileşeni
const UploadModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .modal-content {
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    width: 500px;
    max-width: 90%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  h3 {
    margin-top: 0;
    color: #333;
  }

  .upload-area {
    border: 2px dashed #ddd;
    padding: 20px;
    text-align: center;
    margin: 20px 0;
    border-radius: 4px;
    cursor: pointer;
    transition: border-color 0.3s;

    &:hover {
      border-color: #4a6da7;
    }
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  .upload-progress {
    margin-top: 15px;
    
    .progress-bar {
      height: 10px;
      background-color: #f3f3f3;
      border-radius: 5px;
      margin-top: 5px;
      overflow: hidden;
      
      .progress {
        height: 100%;
        background-color: #4a6da7;
        width: 0%;
        transition: width 0.3s ease;
      }
    }
  }

  .status-message {
    margin-top: 10px;
    font-size: 14px;
    
    &.success {
      color: #2ecc71;
    }
    
    &.error {
      color: #e74c3c;
    }
  }
  
  @media (max-width: 768px) {
    .modal-content {
      width: 95%;
      padding: 20px;
    }
    
    .button-group {
      flex-direction: column;
      
      button {
        width: 100%;
        margin-top: 10px;
      }
    }
  }
`;

// Kullanıcının adını gösterecek info alanı
const UserInfo = styled.div`
  margin-bottom: 10px;
  background-color: #f8f8f8;
  padding: 10px 15px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .user-details {
    display: flex;
    align-items: center;
    
    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #4a6da7;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      font-weight: bold;
    }
    
    .name {
      font-weight: 500;
    }
    
    .role {
      margin-left: 10px;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      
      &.admin {
        background-color: #2ecc71;
        color: white;
      }
      
      &.satici {
        background-color: #3498db;
        color: white;
      }
      
      &.ofis {
        background-color: #9b59b6;
        color: white;
      }
      
      &.upload {
        background-color: #f39c12;
        color: white;
      }
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    
    .user-details {
      margin-bottom: 10px;
    }
  }
`;

function Dashboard() {
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    const name = sessionStorage.getItem('userName');
    setUserRole(role || '');
    setUserName(name || '');
  }, []);
  
  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('filterCriteria');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
    navigate('/login');
  };
  
  const navigateToAnalytics = () => {
    navigate('/analytics');
  };

  const navigateToUserManagement = () => {
    navigate('/users');
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadFile(null);
    setUploadProgress(0);
    setUploadStatus(null);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      setUploadFile(file);
      setUploadStatus(null);
    } else {
      setUploadStatus({
        type: 'error',
        message: 'Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)'
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      setUploadFile(file);
      setUploadStatus(null);
    } else {
      setUploadStatus({
        type: 'error',
        message: 'Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)'
      });
    }
  };

  const processExcelFile = async () => {
    if (!uploadFile) {
      setUploadStatus({
        type: 'error',
        message: 'Lütfen bir Excel dosyası seçin'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);

    // Dosyayı okuma ve işleme
    const reader = new FileReader();
    
    // Progress intervalini başlat
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // İlk sayfayı al
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON'a dönüştür
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        if (excelData.length === 0) {
          throw new Error('Excel dosyası boş veya uyumsuz formatta.');
        }
        
        // Supabase'deki mevcut siparişleri al
        const { data: existingOrders, error } = await supabase
          .from('siparisler')
          .select('msg_s_0088');
          
        if (error) throw error;
        
        // Mevcut sipariş ID'lerini ve Excel'deki ID'leri topla
        const existingOrderIds = new Set(existingOrders.map(order => order.msg_s_0088));
        const excelOrderIds = new Set();
        
        let addedCount = 0;
        let updatedCount = 0;
        let deactivatedCount = 0;
        
        // Excel verilerini işle
        for (const row of excelData) {
          // Excel'den gelen benzersiz ID
          const uniqueId = row['#msg_S_0088'] || row['msg_S_0088'];
          
          if (!uniqueId) {
            console.warn('ID olmayan satır atlandı:', row);
            continue;
          }
          
          excelOrderIds.add(uniqueId);
          
          // Excel verilerini Supabase formatına dönüştür
          const orderData = {
            msg_s_0088: uniqueId,
            bakiye: row['Bakiye'] || null,
            f_1: row['F-1'] || null,
            f_5: row['F-5'] || null,
            p_1: row['P-1'] || null,
            p_5: row['P-5'] || null,
            son_giris_maliyeti: row['Son Giriş Maliyeti + Kdv'] || null,
            son_giris_tarihi: formatDate(row['Son Giriş Tarihi']),
            guncel_maliyet: row['Güncel Maliyet'] || null,
            stok_kodu: row['msg_S_0078'] || null,
            urun_adi: row['msg_S_0070'] || null,
            birim: row['#msg_S_0010'] || null,
            marka: row['#msg_S_0024'] || null,
            musteri_kodu: row['msg_S_0200'] || null,
            musteri_adi: row['msg_S_0201'] || null,
            siparis_tarihi: formatDate(row['#msg_S_0240']),
            teslim_tarihi: formatDate(row['msg_S_0241']),
            belge_no: row['msg_S_0243'] || null,
            sira_no: row['msg_S_0157'] || null,
            siparis_deposu: row['msg_S_0159'] || null,
            merkez_depo_miktar: row['Merkez'] || null,
            topca_depo_miktar: row['Topca Dükkan'] || null,
            siparis_miktar: row['#msg_S_0244'] || null,
            birim_fiyat: row['msg_S_0248'] || null,
            toplam_tutar: row['msg_S_0249'] || null,
            kalan_tutar: row['msg_S_0253'] || null,
            aciklama: row['#msg_S_0260'] || null,
            sektor_kodu: row['#msg_S_0474'] || null,
            grup_kodu: row['#msg_S_0471'] || null,
            sehir: row['#msg_S_0202'] || null,
            vade: row['#msg_S_0099'] || null,
            siparis_giren: row['#msg_S_1130'] || null,
            son_guncelleme: new Date().toISOString(),
            aktif: true
          };
          
          // Yeni sipariş ekle veya mevcut siparişi güncelle
          if (!existingOrderIds.has(uniqueId)) {
            // Yeni sipariş ekle
            const { error: insertError } = await supabase
              .from('siparisler')
              .insert([orderData]);
              
            if (insertError) {
              console.error(`Sipariş eklenirken hata (${uniqueId}):`, insertError);
            } else {
              addedCount++;
            }
          } else {
            // Mevcut siparişi güncelle
            const { error: updateError } = await supabase
              .from('siparisler')
              .update(orderData)
              .eq('msg_s_0088', uniqueId);
              
            if (updateError) {
              console.error(`Sipariş güncellenirken hata (${uniqueId}):`, updateError);
            } else {
              updatedCount++;
            }
          }
        }
        
        // Excel'de olmayan siparişleri pasif yap
        for (const existingOrder of existingOrders) {
          if (!excelOrderIds.has(existingOrder.msg_s_0088)) {
            const { error: updateError } = await supabase
              .from('siparisler')
              .update({ aktif: false, son_guncelleme: new Date().toISOString() })
              .eq('msg_s_0088', existingOrder.msg_s_0088);
              
            if (updateError) {
              console.error(`Sipariş pasifleştirilirken hata (${existingOrder.msg_s_0088}):`, updateError);
            } else {
              deactivatedCount++;
            }
          }
        }
        
        // İşlem tamamlandı
        clearInterval(interval);
        setUploadProgress(100);
        
        setUploadStatus({
          type: 'success',
          message: `Başarıyla senkronize edildi: ${addedCount} sipariş eklendi, ${updatedCount} sipariş güncellendi, ${deactivatedCount} sipariş pasif yapıldı.`
        });
        
        // 2 saniye sonra sayfayı yenile
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } catch (error) {
        clearInterval(interval);
        console.error('Excel işleme hatası:', error);
        setUploadStatus({
          type: 'error',
          message: `Hata: ${error.message}`
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      clearInterval(interval);
      setIsUploading(false);
      setUploadStatus({
        type: 'error',
        message: 'Dosya okuma hatası!'
      });
    };
    
    reader.readAsArrayBuffer(uploadFile);
  };
  
  // Tarih formatını düzeltme fonksiyonu
  function formatDate(dateValue) {
    if (!dateValue) return null;
    
    try {
      // Excel tarihi bir sayı olabilir (Excel'in serial date formatı)
      if (typeof dateValue === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
      }
      
      // Tarih zaten bir tarih nesnesi ise
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0]; // YYYY-MM-DD formatı
      }
      
      // Tarih bir string ise
      if (typeof dateValue === 'string') {
        // DD.MM.YYYY formatını kontrol et
        if (dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          const parts = dateValue.split('.');
          return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD formatına çevir
        }
        
        // DD/MM/YYYY formatını kontrol et
        if (dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const parts = dateValue.split('/');
          return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD formatına çevir
        }
        
        // Diğer formatları parse etmeyi dene
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
        }
      }
      
      console.warn(`Geçersiz tarih değeri: ${dateValue}`);
      return null;
    } catch (error) {
      console.warn(`Tarih dönüştürme hatası: ${dateValue}`, error);
      return null;
    }
  }
  
  // Kullanıcının ilk harfini avatar olarak göster
  const getAvatarLetter = () => {
    if (!userName) return "?";
    return userName.charAt(0).toUpperCase();
  };
  
  // Rol için etiket
  const getRoleLabel = () => {
    switch(userRole) {
      case 'admin':
        return 'Yönetici';
      case 'satici':
        return 'Satıcı';
      case 'ofis':
        return 'Ofis';
      case 'upload':
        return 'Veri Yükleyici';
      default:
        return 'Kullanıcı';
    }
  };
  
  return (
    <DashboardContainer>
      <Header>
        <h1>Mikro ERP Sipariş Takip Sistemi</h1>
        <div className="button-container">
          {userRole === 'admin' && (
            <>
              <button onClick={navigateToAnalytics}>
                Grafikler ve Analizler
              </button>
              <button onClick={navigateToUserManagement}>
                Kullanıcı Yönetimi
              </button>
            </>
          )}
          {(userRole === 'admin' || userRole === 'upload') && (
            <button onClick={openUploadModal}>
              Excel Yükle
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </Header>
      
      <UserInfo>
        <div className="user-details">
          <div className="avatar">{getAvatarLetter()}</div>
          <span className="name">{userName}</span>
          <span className={`role ${userRole}`}>{getRoleLabel()}</span>
        </div>
      </UserInfo>
      
      <OrderList />

      {showUploadModal && (
        <UploadModal>
          <div className="modal-content">
            <h3>Excel Dosyası Yükle</h3>
            <p>Mikro ERP'den çektiğiniz sipariş verilerini içeren Excel dosyasını seçin.</p>
            
            <div 
              className="upload-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              {uploadFile ? (
                <p>Seçilen dosya: <strong>{uploadFile.name}</strong></p>
              ) : (
                <p>Dosyayı sürükleyin veya seçmek için tıklayın</p>
              )}
              <input 
                type="file" 
                id="file-upload" 
                style={{ display: 'none' }} 
                accept=".xlsx,.xls" 
                onChange={handleFileChange}
              />
            </div>

            {uploadStatus && (
              <div className={`status-message ${uploadStatus.type}`}>
                {uploadStatus.message}
              </div>
            )}

            {isUploading && (
              <div className="upload-progress">
                <p>İşleniyor... {uploadProgress}%</p>
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
            
            <div className="button-group">
              <button onClick={closeUploadModal} disabled={isUploading}>
                İptal
              </button>
              <button 
                onClick={processExcelFile} 
                disabled={!uploadFile || isUploading}
                style={{ backgroundColor: !uploadFile || isUploading ? '#cccccc' : '#4a6da7' }}
              >
                {isUploading ? 'İşleniyor...' : 'Yükle ve İşle'}
              </button>
            </div>
          </div>
        </UploadModal>
      )}
    </DashboardContainer>
  );
}

export default Dashboard;