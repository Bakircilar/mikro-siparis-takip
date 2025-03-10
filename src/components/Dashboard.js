import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderList from './OrderList';
import styled from 'styled-components';

// Stil tanımları
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
`;
function Dashboard() {
  const [userRole, setUserRole] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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

    try {
      // Sahte ilerleme - gerçek işlem esnasında güncellenecek
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Excel dosyasını okuyup işleyen kodu buraya ekleyeceğiz
      const { processExcelAndSyncToSupabase } = await import('../utils/excelProcessor');
      
      const result = await processExcelAndSyncToSupabase(uploadFile);

      clearInterval(interval);
      setUploadProgress(100);

      setUploadStatus({
        type: 'success',
        message: `Başarıyla senkronize edildi: ${result.added} sipariş eklendi, ${result.updated} sipariş güncellendi, ${result.deactivated} sipariş pasif yapıldı.`
      });

      // 2 saniye sonra sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Excel işleme hatası:', error);
      setUploadStatus({
        type: 'error',
        message: `Hata: ${error.message}`
      });
    } finally {
      setIsUploading(false);
    }
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