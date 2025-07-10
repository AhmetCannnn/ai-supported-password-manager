import { useState, useEffect } from 'react'
import Login from './components/auth/Login.jsx'
import Register from './components/auth/Register.jsx'
import PasswordManager from './components/dashboard/password_manager.jsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('login') // 'login' veya 'register'
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Tema renklerini tanımla
  const theme = {
    light: {
      background: '#ffffff',
      surface: '#ffffff',
      surfaceSecondary: '#f8f9fa',
      text: '#495057',
      textSecondary: '#6c757d',
      border: '#e9ecef',
      borderSecondary: '#ddd',
      primary: '#28a745',
      primaryHover: '#218838',
      danger: '#dc3545',
      warning: '#ffc107',
      success: '#28a745',
      inputBg: '#ffffff',
      cardShadow: '0 2px 8px rgba(0,0,0,0.05)',
      headerBg: '#ffffff'
    },
    dark: {
      background: '#1a1a1a',
      surface: '#1a1a1a',
      surfaceSecondary: '#3d3d3d',
      text: '#ffffff',
      textSecondary: '#e0e0e0',
      border: '#4a4a4a',
      borderSecondary: '#555',
      primary: '#4ade80',
      primaryHover: '#22c55e',
      danger: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      inputBg: '#1a1a1a',
      cardShadow: '0 2px 8px rgba(0,0,0,0.15)',
      headerBg: '#2d2d2d'
    }
  }

  // Tema tercihini localStorage'dan yükle
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme) {
      setIsDarkMode(JSON.parse(savedTheme))
    }
  }, [])

  // Tema değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    // Body background'ını güncelle
    document.body.style.backgroundColor = isDarkMode ? theme.dark.background : theme.light.background
  }, [isDarkMode])

  // CSS Variables'ını tema göre ayarla
  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = isDarkMode ? theme.dark : theme.light;
    
    root.style.setProperty('--primary-color', currentTheme.primary);
    root.style.setProperty('--primary-hover', currentTheme.primaryHover);
    root.style.setProperty('--text-color', currentTheme.text);
    root.style.setProperty('--text-secondary', currentTheme.textSecondary);
    root.style.setProperty('--background-color', currentTheme.background);
    root.style.setProperty('--surface-color', currentTheme.surface);
    root.style.setProperty('--surface-secondary', currentTheme.surfaceSecondary);
    root.style.setProperty('--surface-hover', currentTheme.surfaceHover || currentTheme.surfaceSecondary);
    root.style.setProperty('--border-color', currentTheme.border);
    root.style.setProperty('--input-bg', currentTheme.inputBg);
    root.style.setProperty('--card-shadow', currentTheme.cardShadow);
    root.style.setProperty('--card-shadow-hover', currentTheme.cardShadowHover || currentTheme.cardShadow);
    root.style.setProperty('--success-color', currentTheme.success);
    root.style.setProperty('--success-hover', isDarkMode ? '#16a34a' : '#198754');
    root.style.setProperty('--success-bg', isDarkMode ? '#1e3a2e' : '#d4edda');
    root.style.setProperty('--warning-color', currentTheme.warning);
    root.style.setProperty('--warning-hover', isDarkMode ? '#d97706' : '#e0a800');
    root.style.setProperty('--warning-text', isDarkMode ? 'white' : '#212529');
    root.style.setProperty('--danger-color', currentTheme.danger);
    root.style.setProperty('--danger-hover', isDarkMode ? '#b91c1c' : '#c82333');
    root.style.setProperty('--secondary-hover', isDarkMode ? '#9ca3af' : '#5a6268');
    root.style.setProperty('--info-color', isDarkMode ? '#3b82f6' : '#1976d2');
    root.style.setProperty('--info-bg', isDarkMode ? '#1e3a8a' : '#e3f2fd');
    root.style.setProperty('--primary-bg', isDarkMode ? '#1e3a2e' : '#d4edda');
    root.style.setProperty('--primary-rgb', isDarkMode ? '59, 130, 246' : '25, 118, 210');
  }, [isDarkMode, theme])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const currentTheme = isDarkMode ? theme.dark : theme.light

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
  }

  const handleRegisterSuccess = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentPage('login')
  }

  const goToRegister = () => {
    setCurrentPage('register')
  }

  const goToLogin = () => {
    setCurrentPage('login')
  }

  return (
    <div style={{ backgroundColor: currentTheme.background, minHeight: '100vh' }}>
      {isLoggedIn ? (
        <PasswordManager 
          onLogout={handleLogout} 
          theme={currentTheme}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      ) : currentPage === 'login' ? (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onGoToRegister={goToRegister}
          theme={currentTheme}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      ) : (
        <Register 
          onRegisterSuccess={handleRegisterSuccess} 
          onBackToLogin={goToLogin}
          theme={currentTheme}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  )
}

export default App
