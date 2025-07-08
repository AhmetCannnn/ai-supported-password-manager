import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import '../../styles/components.css'

function Register({ onRegisterSuccess, onBackToLogin, theme, isDarkMode, toggleTheme }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Ad Soyad gereklidir.";
    if (!formData.email) newErrors.email = "E-posta gereklidir.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Geçerli e-posta girin.";
    if (!formData.password) newErrors.password = "Şifre gereklidir.";
    else if (formData.password.length < 6) newErrors.password = "Şifre en az 6 karakter.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Şifreler eşleşmiyor.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Basit password hash fonksiyonu (production'da bcrypt kullanılmalı)
  const hashPassword = (password) => {
    return btoa(password + 'secret_salt_key_2024')
  }

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({}); // Önceki hataları temizle
    
    try {
      // Şifreyi hash'le
      const hashedPassword = hashPassword(formData.password);
      
      // Supabase'e kullanıcı ekle
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: formData.email.toLowerCase().trim(),
            password_hash: hashedPassword,
            full_name: formData.fullName.trim()
          }
        ])
        .select();

      if (error) {
        // Hata durumları
        if (error.code === '23505') { // Unique constraint violation
          setErrors({ email: 'Bu e-posta adresi zaten kullanımda!' });
        } else {
          setErrors({ general: 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.' });
        }
        console.error('Kayıt hatası:', error);
      } else {
        // Başarılı kayıt
        console.log('Kullanıcı başarıyla kaydedildi:', data);
        
        // Kullanıcı bilgilerini localStorage'a kaydet
        localStorage.setItem('currentUser', JSON.stringify({
          id: data[0].id,
          email: data[0].email,
          fullName: data[0].full_name
        }));
        
        // 1.5 saniye sonra başarı sayfasına geç
        setTimeout(() => {
          onRegisterSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error('Beklenmeyen hata:', err);
      setErrors({ general: 'Bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div 
      className="auth-page"
      style={{ backgroundColor: theme.background }}
    >
      {/* Başlık Bölümü */}
      <div 
        className="auth-header"
        style={{ 
          backgroundColor: theme.background, 
          color: theme.primary
        }}
      >
                 {/* Theme Toggle Butonu */}
         <button
           onClick={toggleTheme}
           style={{
             position: 'absolute',
             top: '20px',
             left: '20px',
             background: 'none',
             border: `2px solid ${theme.border}`,
             borderRadius: '50%',
             width: '50px',
             height: '50px',
             cursor: 'pointer',
             fontSize: '20px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             transition: 'all 0.3s',
             backgroundColor: theme.surface
           }}
           className="theme-toggle"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = theme.surfaceSecondary;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = theme.surface;
          }}
          title={isDarkMode ? 'Açık Tema' : 'Koyu Tema'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <h1 className="auth-title">
          🔐 Şifre Yöneticisi Kayıt
        </h1>
      </div>

      {/* Ana İçerik */}
      <div className="auth-main">
        <div 
          className="auth-container register-container"
          style={{
            backgroundColor: theme.surface,
            boxShadow: theme.cardShadow,
            border: `1px solid ${theme.border}`
          }}
        >
          
          <div className="auth-welcome">
            <div className="auth-icon">📝</div>
            <h2 
              className="auth-welcome-title"
              style={{ color: theme.text }}
            >
              Hesap Oluştur
            </h2>
            <p 
              className="auth-welcome-subtitle"
              style={{ color: theme.textSecondary }}
            >
              Şifrelerinizi güvenle yönetmeye başlayın
            </p>
          </div>

          {/* Genel Hata Mesajı */}
          {errors.general && (
            <div 
              className="register-error-general"
              style={{
                backgroundColor: isDarkMode ? '#2d1b1b' : '#f8d7da',
                color: theme.danger,
                border: `1px solid ${theme.danger}`
              }}
            >
              ⚠️ {errors.general}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            {/* Ad Soyad Alanı */}
            <div className="auth-form-group">
              <label 
                className="auth-label"
                style={{ color: theme.text }}
              >
                👤 Ad Soyad
              </label>
              <input 
                type="text" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleInputChange} 
                placeholder="Ahmet Can Yılmaz" 
                className={`auth-input ${errors.fullName ? 'error' : ''}`}
                style={{ 
                  border: errors.fullName ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`, 
                  backgroundColor: theme.inputBg,
                  color: theme.text
                }} 
              />
              {errors.fullName && (
                <div 
                  className="auth-error"
                  style={{ color: theme.danger }}
                >
                  ⚠️ {errors.fullName}
                </div>
              )}
            </div>

            {/* E-posta Alanı */}
            <div className="auth-form-group">
              <label 
                className="auth-label"
                style={{ color: theme.text }}
              >
                📧 E-posta
              </label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="ornek@gmail.com" 
                className={`auth-input ${errors.email ? 'error' : ''}`}
                style={{ 
                  border: errors.email ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`, 
                  backgroundColor: theme.inputBg,
                  color: theme.text
                }} 
              />
              {errors.email && (
                <div 
                  className="auth-error"
                  style={{ color: theme.danger }}
                >
                  ⚠️ {errors.email}
                </div>
              )}
            </div>

            {/* Şifre Alanı */}
            <div className="auth-form-group">
              <label 
                className="auth-label"
                style={{ color: theme.text }}
              >
                🔑 Şifre
              </label>
              <div className="auth-input-container">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  placeholder="En az 6 karakter" 
                  className={`auth-input with-button ${errors.password ? 'error' : ''}`}
                  style={{ 
                    border: errors.password ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`, 
                    backgroundColor: theme.inputBg,
                    color: theme.text
                  }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="auth-input-action"
                  title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && (
                <div 
                  className="auth-error"
                  style={{ color: theme.danger }}
                >
                  ⚠️ {errors.password}
                </div>
              )}
            </div>

            {/* Şifre Tekrar Alanı */}
            <div className="auth-form-group mb-25">
              <label 
                className="auth-label"
                style={{ color: theme.text }}
              >
                🔒 Şifre Tekrar
              </label>
              <div className="auth-input-container">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleInputChange} 
                  placeholder="Şifrenizi tekrar girin" 
                  className={`auth-input with-button ${errors.confirmPassword ? 'error' : ''}`}
                  style={{ 
                    border: errors.confirmPassword ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`, 
                    backgroundColor: theme.inputBg,
                    color: theme.text
                  }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  className="auth-input-action"
                  title={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showConfirmPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.confirmPassword && (
                <div 
                  className="auth-error"
                  style={{ color: theme.danger }}
                >
                  ⚠️ {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Kayıt Butonu */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="auth-submit register-submit"
              style={{ 
                backgroundColor: isLoading ? theme.textSecondary : theme.primary, 
                color: 'white'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = theme.primaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = theme.primary;
                }
              }}
            >
              {isLoading ? 'Kayıt Oluşturuluyor...' : '📝 Kayıt Ol'}
            </button>

            {/* Giriş Linki */}
            <div className="auth-switch">
              <button 
                type="button" 
                onClick={onBackToLogin} 
                className="auth-switch-link"
                style={{ color: theme.primary }}
                onMouseEnter={(e) => {
                  e.target.style.color = theme.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = theme.primary;
                }}
              >
                ← Zaten hesabınız var mı? Giriş yapın
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}

export default Register; 