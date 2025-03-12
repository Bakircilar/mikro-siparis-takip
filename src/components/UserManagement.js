import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getAllUsers, addUser, updateUser, deactivateUser, activateUser } from '../services/userService';

// Stil tanımlamaları
const UserManagementContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
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
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 15px;
    
    h1 {
      margin-bottom: 15px;
      font-size: 20px;
      text-align: center;
    }
    
    button {
      width: 100%;
      min-height: 44px;
    }
  }
`;

const UsersTable = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    th {
      background-color: #f8f8f8;
      font-weight: bold;
      color: #333;
    }
    
    tr:hover {
      background-color: #f9f9f9;
    }
    
    .actions {
      display: flex;
      gap: 8px;
      
      button {
        padding: 6px 10px;
        background-color: #4a6da7;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        
        &.edit {
          background-color: #3498db;
        }
        
        &.delete {
          background-color: #e74c3c;
        }
        
        &.activate {
          background-color: #2ecc71;
        }
      }
    }
  }
  
  .status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    
    &.active {
      background-color: #e6f7e6;
      color: #2ecc71;
    }
    
    &.inactive {
      background-color: #f8d7da;
      color: #e74c3c;
    }
  }
  
  @media (max-width: 768px) {
    overflow-x: auto;
    
    table {
      min-width: 800px;
    }
  }
`;

const UserForm = styled.div`
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
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .form-group {
    margin-bottom: 15px;
    
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
      font-size: 14px;
    }
  }
  
  .role-specific {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px dashed #eee;
  }
  
  .buttons {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      
      &.primary {
        background-color: #4a6da7;
        color: white;
      }
      
      &.secondary {
        background-color: #e0e0e0;
        color: #333;
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 15px;
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .buttons {
      flex-direction: column;
      
      button {
        width: 100%;
        min-height: 44px;
      }
    }
  }
`;

const MessageBox = styled.div`
  padding: 12px 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-size: 14px;
  
  &.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  &.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
`;

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    kullanici_adi: '',
    sifre: '',
    rol: 'satici',
    tam_ad: '',
    eposta: '',
    filtre: { field: 'siparis_giren', value: '' }
  });
  
  const navigate = useNavigate();
  
  // Kullanıcıları yükle
  useEffect(() => {
    loadUsers();
  }, []);
  
  // Kullanıcı rolünü kontrol et (sadece admin erişebilir)
  useEffect(() => {
    const userRole = sessionStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  async function loadUsers() {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setLoading(false);
  }
  
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'rol') {
      // Rol değiştiğinde filtre nesnesini güncelle
      let newFilter = { field: null };
      
      switch (value) {
        case 'satici':
          newFilter = { field: 'siparis_giren', value: '' };
          break;
        case 'ofis':
          newFilter = { field: 'siparis_giren', values: [] };
          break;
        case 'upload':
          newFilter = { onlyUpload: true };
          break;
        default:
          newFilter = { field: null };
      }
      
      setFormData({
        ...formData,
        rol: value,
        filtre: newFilter
      });
    } else if (name === 'filterValue') {
      // Satıcı filtre değerini güncelle
      setFormData({
        ...formData,
        filtre: { ...formData.filtre, value: value }
      });
    } else if (name.startsWith('filterValues_')) {
      // Ofis rolü için çoklu değer
      const index = parseInt(name.split('_')[1]);
      const newValues = [...(formData.filtre.values || [])];
      newValues[index] = value;
      
      setFormData({
        ...formData,
        filtre: { ...formData.filtre, values: newValues }
      });
    } else {
      // Diğer form alanları
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const addFilterValue = () => {
    // Ofis rolü için çoklu değer ekle
    setFormData({
      ...formData,
      filtre: { 
        ...formData.filtre, 
        values: [...(formData.filtre.values || []), ''] 
      }
    });
  };
  
  const removeFilterValue = (index) => {
    // Ofis rolü için değer sil
    const newValues = [...formData.filtre.values];
    newValues.splice(index, 1);
    
    setFormData({
      ...formData,
      filtre: { ...formData.filtre, values: newValues }
    });
  };
  
  const handleAddUser = async () => {
    setMessage(null);
    
    // Form doğrulaması
    if (!formData.kullanici_adi || !formData.sifre || !formData.rol) {
      setMessage({ type: 'error', text: 'Kullanıcı adı, şifre ve rol alanları zorunludur.' });
      return;
    }
    
    // Satıcı rolünde filtre değeri kontrolü
    if (formData.rol === 'satici' && !formData.filtre.value) {
      setMessage({ type: 'error', text: 'Satıcı rolü için bir filtre değeri girmelisiniz.' });
      return;
    }
    
    // Ofis rolünde filtre değerleri kontrolü
    if (formData.rol === 'ofis' && (!formData.filtre.values || formData.filtre.values.length === 0)) {
      setMessage({ type: 'error', text: 'Ofis rolü için en az bir satıcı seçmelisiniz.' });
      return;
    }
    
    try {
      let result;
      
      if (editUser) {
        // Kullanıcı güncelleme
        result = await updateUser(editUser.id, formData);
      } else {
        // Yeni kullanıcı ekleme
        result = await addUser(formData);
      }
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: editUser 
            ? `${result.user.kullanici_adi} kullanıcısı başarıyla güncellendi.` 
            : `${result.user.kullanici_adi} kullanıcısı başarıyla eklendi.` 
        });
        
        resetForm();
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('İşlem hatası:', error);
      setMessage({ type: 'error', text: 'İşlem sırasında bir hata oluştu.' });
    }
  };
  
  const handleEdit = (user) => {
    setEditUser(user);
    
    setFormData({
      kullanici_adi: user.kullanici_adi,
      sifre: '', // Şifreyi boş bırak, değiştirilecekse doldurulacak
      rol: user.rol,
      tam_ad: user.tam_ad || '',
      eposta: user.eposta || '',
      filtre: user.filtre || { field: null }
    });
    
    setShowForm(true);
  };
  
  const handleActivation = async (user) => {
    try {
      let result;
      
      if (user.aktif) {
        // Kullanıcıyı pasifleştir
        result = await deactivateUser(user.id);
        if (result.success) {
          setMessage({ type: 'success', text: `${user.kullanici_adi} kullanıcısı pasif yapıldı.` });
        }
      } else {
        // Kullanıcıyı aktifleştir
        result = await activateUser(user.id);
        if (result.success) {
          setMessage({ type: 'success', text: `${user.kullanici_adi} kullanıcısı aktif yapıldı.` });
        }
      }
      
      loadUsers();
    } catch (error) {
      console.error('İşlem hatası:', error);
      setMessage({ type: 'error', text: 'İşlem sırasında bir hata oluştu.' });
    }
  };
  
  const resetForm = () => {
    setFormData({
      kullanici_adi: '',
      sifre: '',
      rol: 'satici',
      tam_ad: '',
      eposta: '',
      filtre: { field: 'siparis_giren', value: '' }
    });
    setEditUser(null);
    setShowForm(false);
  };
  
  return (
    <UserManagementContainer>
      <Header>
        <h1>Kullanıcı Yönetimi</h1>
        <div>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Formu Gizle' : 'Yeni Kullanıcı Ekle'}
          </button>
          <button onClick={navigateToDashboard} style={{ marginLeft: '10px' }}>
            Ana Sayfaya Dön
          </button>
        </div>
      </Header>
      
      {message && (
        <MessageBox className={message.type}>
          {message.text}
        </MessageBox>
      )}
      
      {showForm && (
        <UserForm>
          <h3>{editUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="kullanici_adi">Kullanıcı Adı:</label>
              <input
                type="text"
                id="kullanici_adi"
                name="kullanici_adi"
                value={formData.kullanici_adi}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="sifre">
                {editUser ? 'Şifre (değiştirmek için doldurun):' : 'Şifre:'}
              </label>
              <input
                type="password"
                id="sifre"
                name="sifre"
                value={formData.sifre}
                onChange={handleInputChange}
                required={!editUser}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="rol">Rol:</label>
              <select
                id="rol"
                name="rol"
                value={formData.rol}
                onChange={handleInputChange}
                required
              >
                <option value="satici">Satıcı</option>
                <option value="ofis">Ofis</option>
                <option value="admin">Admin</option>
                <option value="upload">Upload</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="tam_ad">Tam Ad:</label>
              <input
                type="text"
                id="tam_ad"
                name="tam_ad"
                value={formData.tam_ad}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="eposta">E-posta:</label>
              <input
                type="email"
                id="eposta"
                name="eposta"
                value={formData.eposta}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {/* Role özel ayarlar */}
          <div className="role-specific">
            <h4>Rol Ayarları</h4>
            
            {formData.rol === 'satici' && (
              <div className="form-group">
                <label htmlFor="filterValue">Satıcı Filtre Değeri:</label>
                <input
                  type="text"
                  id="filterValue"
                  name="filterValue"
                  value={formData.filtre?.value || ''}
                  onChange={handleInputChange}
                  placeholder="Siparişlerde görünecek satıcı ismi"
                />
                <small>Bu kullanıcı sadece bu değere sahip siparişleri görebilecek.</small>
              </div>
            )}
            
            {formData.rol === 'ofis' && (
              <div className="form-group">
                <label>Görüntülenecek Satıcılar:</label>
                {formData.filtre?.values?.map((value, index) => (
                  <div key={index} style={{ display: 'flex', marginBottom: '5px' }}>
                    <input
                      type="text"
                      name={`filterValues_${index}`}
                      value={value}
                      onChange={handleInputChange}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      onClick={() => removeFilterValue(index)}
                      style={{ marginLeft: '5px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px' }}
                    >
                      X
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addFilterValue}
                  style={{ marginTop: '5px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', fontSize: '13px' }}
                >
                  Satıcı Ekle
                </button>
              </div>
            )}
            
            {formData.rol === 'upload' && (
              <div>
                <p>Bu kullanıcı sadece veri yükleme işlemi yapabilecek.</p>
              </div>
            )}
            
            {formData.rol === 'admin' && (
              <div>
                <p>Admin kullanıcısı tüm siparişlere ve yönetim paneline erişebilir.</p>
              </div>
            )}
          </div>
          
          <div className="buttons">
            <button type="button" className="secondary" onClick={resetForm}>
              İptal
            </button>
            <button type="button" className="primary" onClick={handleAddUser}>
              {editUser ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </UserForm>
      )}
      
      <UsersTable>
        <table>
          <thead>
            <tr>
              <th>Kullanıcı Adı</th>
              <th>Rol</th>
              <th>Tam Ad</th>
              <th>Durum</th>
              <th>Son Giriş</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  Kullanıcılar yükleniyor...
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.kullanici_adi}</td>
                  <td>{user.rol}</td>
                  <td>{user.tam_ad || '-'}</td>
                  <td>
                    <span className={`status ${user.aktif ? 'active' : 'inactive'}`}>
                      {user.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>{user.son_giris ? new Date(user.son_giris).toLocaleString('tr-TR') : '-'}</td>
                  <td className="actions">
                    <button className="edit" onClick={() => handleEdit(user)}>
                      Düzenle
                    </button>
                    <button 
                      className={user.aktif ? 'delete' : 'activate'} 
                      onClick={() => handleActivation(user)}
                    >
                      {user.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                  </td>
                </tr>
              ))
            )}
            
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  Kullanıcı bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </UsersTable>
    </UserManagementContainer>
  );
}

export default UserManagement;