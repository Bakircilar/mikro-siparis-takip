// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body, html {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Mobil uyumluluk için ekstra stilller */
  @media (max-width: 768px) {
    body {
      font-size: 14px;
    }
    
    button {
      min-height: 44px; /* Dokunmatik hedefler için minimum 44px öneriliyor */
      padding: 10px 15px;
    }
    
    input, select {
      font-size: 16px; /* iOS'ta yakınlaştırmayı önlemek için minimum 16px */
      min-height: 44px;
    }
  }
`;

export default GlobalStyles;