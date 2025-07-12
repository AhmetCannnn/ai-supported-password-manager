import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import '../styles/components.css'

function Login({ onGoToRegister, theme, isDarkMode, toggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Eğer kullanıcı zaten girişliyse otomatik olarak dashboard'a yönlendir
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const update_email = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    if (loginError) {
      setLoginError("");
    }
  }

  const update_password = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
    if (loginError) {
      setLoginError("");
    }
  }

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "E-posta adresi gereklidir.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Geçerli bir e-posta giriniz.";
    }
    if (!password) {
      newErrors.password = "Şifre gereklidir.";
    } else if (password.length < 3) {
      newErrors.password = "Şifre 3 karakterden uzun olmalıdır.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const hashPassword = (password) => {
    return btoa(password + 'secret_salt_key_2024')
  }

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();
      if (error || !data) {
        setLoginError("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
      } else {
        const hashedInputPassword = hashPassword(password);
        if (hashedInputPassword === data.password_hash) {
          console.log('Giriş başarılı:', data);
          localStorage.setItem('currentUser', JSON.stringify({
            id: data.id,
            email: data.email,
            fullName: data.full_name
          }));
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          setLoginError("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
        }
      }
    } catch (err) {
      console.error('Giriş hatası:', err);
      setLoginError("Bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  }

  const goToRegister = () => {
    if (onGoToRegister) {
      onGoToRegister();
    } else {
      navigate('/register');
    }
  };

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
          className="theme-toggle"
          title={isDarkMode ? 'Açık Tema' : 'Koyu Tema'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <h1 className="auth-title">
          🔐 Şifre Yöneticisi Girişi
        </h1>
      </div>

      {/* Ana İçerik */}
      <div className="auth-main">
        <div 
          className="auth-container"
          style={{
            backgroundColor: theme.surface,
            boxShadow: theme.cardShadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <div className="auth-welcome">
            <div className="auth-icon">🛡️</div>
            <h2 
              className="auth-welcome-title"
              style={{ color: theme.text }}
            >
              Güvenli Giriş
            </h2>
            <p 
              className="auth-welcome-subtitle"
              style={{ color: theme.textSecondary }}
            >
              Şifrelerinizi yönetmek için giriş yapın
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            {/* Email Alanı */}
            <div className="auth-form-group">
              <label 
                className="auth-label"
                style={{ color: theme.text }}
              >
                📧 E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={update_email}
                placeholder="E-posta adresinizi girin"
                className={`auth-input ${errors.email ? 'error' : ''}`}
                style={{
                  border: errors.email ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`,
                  backgroundColor: theme.inputBg,
                  color: theme.text
                }}
                onFocus={(e) => {
                  if (!errors.email) {
                    e.target.style.borderColor = theme.primary;
                  }
                }}
                onBlur={(e) => {
                  if (!errors.email) {
                    e.target.style.borderColor = theme.border;
                  }
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
            <div className="auth-form-group mb-25">
              <label 
                className="auth-label"
                style={{ color: theme.text }}
              >
                🔑 Şifre
              </label>
              <div className="auth-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={update_password}
                  placeholder="Şifrenizi girin"
                  className={`auth-input with-button ${errors.password ? 'error' : ''}`}
                  style={{
                    border: errors.password ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`,
                    backgroundColor: theme.inputBg,
                    color: theme.text
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = theme.primary;
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = theme.border;
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
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

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit"
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
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Giriş Yapılıyor...
                </>
              ) : (
                <>
                  🚀 Giriş Yap
                </>
              )}
            </button>
          </form>

          {/* Giriş Hatası */}
          {loginError && (
            <div 
              className="auth-error-box"
              style={{
                backgroundColor: isDarkMode ? '#2d1b1b' : '#f8d7da',
                border: `1px solid ${theme.danger}`,
                color: theme.danger
              }}
            >
              ⚠️ {loginError}
            </div>
          )}

          {/* Kayıt Ol Linki */}
          <div className="auth-switch">
            <button
              type="button"
              onClick={goToRegister}
              className="auth-switch-link"
              style={{ color: theme.primary }}
              onMouseEnter={(e) => {
                e.target.style.color = theme.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.target.style.color = theme.primary;
              }}
            >
              Hesabınız yok mu? Kayıt olun →
            </button>
          </div>

        </div>
      </div>


    </div>
  )
}

export default Login; 