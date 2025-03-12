import React, { useState } from 'react';
import styled from 'styled-components';
import { saveColumnPreferences } from '../services/preferencesService';

const ColumnManagerContainer = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .header {
    padding: 15px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8f8f8;
    border-bottom: ${props => props.isOpen ? '1px solid #ddd' : 'none'};
    
    h4 {
      margin: 0;
      color: #333;
    }
    
    .toggle-icon {
      transition: transform 0.3s ease;
      transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
    }
  }

  .content {
    max-height: ${props => props.isOpen ? '500px' : '0'};
    overflow: hidden;
    transition: max-height 0.3s ease;
    padding: ${props => props.isOpen ? '15px' : '0 15px'};
  }

  .column-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    white-space: nowrap;
  }

  input[type="checkbox"] {
    margin-right: 5px;
  }

  .button-container {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
  }

  button {
    background-color: #4a6da7;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background-color: #385687;
    }
    
    &.save-btn {
      background-color: #2ecc71;
      
      &:hover {
        background-color: #27ae60;
      }
    }
  }
  
  @media (max-width: 768px) {
    .header {
      padding: 12px 15px;
    }
    
    .content {
      padding: ${props => props.isOpen ? '12px 15px' : '0 15px'};
    }
    
    .column-checkboxes {
      max-height: 200px;
      overflow-y: auto;
    }
    
    .checkbox-item {
      width: 100%;
      padding: 5px 0;
    }
    
    .button-container {
      flex-direction: column;
      gap: 10px;
      
      button {
        width: 100%;
        min-height: 44px;
      }
    }
  }
`;

function ColumnManager({ columns, onColumnVisibilityChange, hiddenColumns }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleCheckboxChange = (columnId) => {
    onColumnVisibilityChange(columnId);
  };

  const selectAll = () => {
    columns.forEach(column => {
      if (!column.isVisible) {
        onColumnVisibilityChange(column.id);
      }
    });
  };

  const deselectAll = () => {
    columns.forEach(column => {
      if (column.isVisible) {
        onColumnVisibilityChange(column.id);
      }
    });
  };
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  const savePreferences = async () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      setSaveStatus({ type: 'error', message: 'Kullanıcı bilgisi bulunamadı!' });
      return;
    }
    
    const result = await saveColumnPreferences(userId, hiddenColumns);
    
    if (result.success) {
      setSaveStatus({ type: 'success', message: 'Kolon tercihleri kaydedildi.' });
      
      // 3 saniye sonra mesajı kaldır
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } else {
      setSaveStatus({ type: 'error', message: result.message });
    }
  };
  
  return (
    <ColumnManagerContainer isOpen={isOpen}>
      <div className="header" onClick={toggleOpen}>
        <h4>Görüntülenecek Kolonlar</h4>
        <span className="toggle-icon">▼</span>
      </div>
      
      <div className="content">
        <div className="column-checkboxes">
          {columns.map(column => (
            <div key={column.id} className="checkbox-item">
              <input
                type="checkbox"
                id={`column-${column.id}`}
                checked={column.isVisible}
                onChange={() => handleCheckboxChange(column.id)}
              />
              <label htmlFor={`column-${column.id}`}>{column.Header}</label>
            </div>
          ))}
        </div>
        
        <div className="button-container">
          <div>
            <button type="button" onClick={selectAll} style={{ marginRight: '10px' }}>
              Tümünü Seç
            </button>
            <button type="button" onClick={deselectAll}>
              Tümünü Kaldır
            </button>
          </div>
          
          <button type="button" className="save-btn" onClick={savePreferences}>
            Tercihleri Kaydet
          </button>
        </div>
        
        {saveStatus && (
          <div 
            style={{ 
              marginTop: '10px', 
              padding: '5px', 
              borderRadius: '4px',
              backgroundColor: saveStatus.type === 'success' ? '#d4edda' : '#f8d7da',
              color: saveStatus.type === 'success' ? '#155724' : '#721c24',
              textAlign: 'center'
            }}
          >
            {saveStatus.message}
          </div>
        )}
      </div>
    </ColumnManagerContainer>
  );
}

export default ColumnManager;