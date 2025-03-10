import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const LoginForm = styled.form`
  width: 320px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  h2 {
    margin-top: 0;
    margin-bottom: 24px;
    color: #333;
    text-align: center;
  }

  .form-group {
    margin-bottom: 20px;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }

  button {
    width: 100%;
    padding: 12px;
    background-color: #4a6da7;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: #385687;
    }
  }

  .error {
    color: #e53935;
    margin-top: 16px;
    text-align: center;
  }
`;

function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
  useEffect(() => {
    const userRole = sessionStorage.getItem('userRole');
    if (userRole) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Şifre kontrolü ve kullanıcı yetkilerini belirleme
    let userRole = '';
    let filterCriteria = null;
    
    switch(password) {
      case 'erhan1':
        userRole = 'satici';
        filterCriteria = { field: 'siparis_giren', value: 'erhan' };
        break;
      case 'büşra1':
        userRole = 'satici';
        filterCriteria = { field: 'siparis_giren', value: 'büşra' };
        break;
      case 'betül1':
        userRole = 'satici';
        filterCriteria = { field: 'siparis_giren', value: 'betül' };
        break;
      case 'merve1':
        userRole = 'satici';
        filterCriteria = { field: 'siparis_giren', value: 'merve' };
        break;
      case 'ofis1':
        userRole = 'ofis';
        filterCriteria = { field: 'siparis_giren', values: ['merve', 'betül'] };
        break;
      case 'boss1':
        userRole = 'admin';
        filterCriteria = null; // Tüm siparişleri görebilir
        break;
      case 'upload': // Yeni kullanıcı tipi
        userRole = 'upload';
        filterCriteria = { onlyUpload: true }; // Hiçbir siparişi göremez, sadece yükleme yapabilir
        break;
      default:
        setError('Geçersiz şifre! Lütfen tekrar deneyin.');
        return;
    }
    
    // Kullanıcı bilgilerini sessionStorage'a kaydet
    sessionStorage.setItem('userRole', userRole);
    sessionStorage.setItem('filterCriteria', JSON.stringify(filterCriteria));
    
    // Dashboard'a yönlendir
    navigate('/dashboard');
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <h2>Sipariş Takip Sistemi</h2>
        <div className="form-group">
          <label htmlFor="password">Şifre:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifrenizi girin"
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit">Giriş Yap</button>
      </LoginForm>
    </LoginContainer>
  );
}

export default Login;