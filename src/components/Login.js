import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { loginUser } from '../services/userService'; // Yeni servisi içe aktar

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
    
    &:disabled {
      background-color: #a0b1d1;
      cursor: not-allowed;
    }
  }

  .error {
    color: #e53935;
    margin-top: 16px;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    width: 90%;
    padding: 25px;
    
    button {
      min-height: 44px;
    }
  }
`;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
  useEffect(() => {
    const userRole = sessionStorage.getItem('userRole');
    if (userRole) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Kullanıcı servisini kullanarak giriş yap
      const result = await loginUser(username, password);
      
      if (result.success) {
        // Oturum bilgilerini kaydet
        sessionStorage.setItem('userRole', result.userRole);
        sessionStorage.setItem('filterCriteria', JSON.stringify(result.filterCriteria));
        sessionStorage.setItem('userId', result.userData.id);
        sessionStorage.setItem('userName', result.userData.kullanici_adi);
        
        // Dashboard'a yönlendir
        navigate('/dashboard');
      } else {
        setError(result.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <h2>Sipariş Takip Sistemi</h2>
        <div className="form-group">
          <label htmlFor="username">Kullanıcı Adı:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adınızı girin"
            required
          />
        </div>
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
        <button type="submit" disabled={loading}>
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
      </LoginForm>
    </LoginContainer>
  );
}

export default Login;