import React from 'react';
import styled from 'styled-components';

const ColumnManagerContainer = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
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
    justify-content: flex-end;
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
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    
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
      gap: 5px;
      
      button {
        width: 100%;
        min-height: 44px;
      }
    }
  }
`;

function ColumnManager({ columns, onColumnVisibilityChange }) {
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
  
  return (
    <ColumnManagerContainer>
      <h4>Görüntülenecek Kolonlar</h4>
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
        <button type="button" onClick={selectAll} style={{ marginRight: '10px' }}>
          Tümünü Seç
        </button>
        <button type="button" onClick={deselectAll}>
          Tümünü Kaldır
        </button>
      </div>
    </ColumnManagerContainer>
  );
}

export default ColumnManager;