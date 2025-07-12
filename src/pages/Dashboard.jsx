import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { generateAIPassword } from '../services/geminiClient'
import '../styles/components.css'
import { popularPlatforms } from '../data/platforms'


function App({ theme, isDarkMode, toggleTheme }) {

    const [passwords, setPasswords] = useState([]) // Şifreleri tutacak state
    const [editingId, setEditingId] = useState(null) // Düzenleme modunda hangi şifrenin düzenleneceğini tutacak state
    const [selectedPlatform, setSelectedPlatform] = useState('') // Seçilen platform
    const [isCustomPlatform, setIsCustomPlatform] = useState(false) // Özel platform modu
    const [visiblePasswords, setVisiblePasswords] = useState({}) // Gösterilen şifreler için state
    const [copiedPasswords, setCopiedPasswords] = useState({}) // Kopyalanan şifreler için state
    const [copiedUsernames, setCopiedUsernames] = useState({}) // Kopyalanan kullanıcı adları için state
    
    // Ana form şifre alanı için state'ler
    const [formPasswordVisible, setFormPasswordVisible] = useState(false) // Ana form şifre görünürlüğü
    const [formPasswordCopied, setFormPasswordCopied] = useState(false) // Ana form şifre kopyalama durumu
    const [formData, setFormData] = useState({ // Form verilerini tutacak state
        title: '', // Başlık (Platform)
        username: '', // Kullanıcı adı / E-posta
        password: '' // Şifre
    })
    const [isLoading, setIsLoading] = useState(false) // Yükleme durumu
    const [currentUser, setCurrentUser] = useState(null) // Giriş yapmış kullanıcı

    // Güçlü şifre oluşturma için state'ler
    const [showPasswordGenerator, setShowPasswordGenerator] = useState(false)
    const [passwordLength, setPasswordLength] = useState(12)
    const [generatedPassword, setGeneratedPassword] = useState('')
    const [copiedGenerated, setCopiedGenerated] = useState(false)
    
    // AI şifre oluşturma için state'ler
    const [activeTab, setActiveTab] = useState('random') // 'random' veya 'ai'
    const [aiUserInfo, setAiUserInfo] = useState({
        name: '',
        number: '',
        favorite: '',
        platform: ''
    })
    const [aiLoading, setAiLoading] = useState(false)



    // Giriş yapmış kullanıcı bilgisini al
    useEffect(() => {
        const user = localStorage.getItem('currentUser')
        if (user) {
            setCurrentUser(JSON.parse(user))
        }
    }, [])

    // Kullanıcının şifrelerini Supabase'den çek
    useEffect(() => {
        if (currentUser) {
            fetchPasswords()
        }
    }, [currentUser])

    // Data-attributes'ları CSS variables'a çevir
    useEffect(() => {
        const updateStrengthColors = () => {
            document.querySelectorAll('[data-strength-color]').forEach(element => {
                const color = element.getAttribute('data-strength-color');
                if (color) {
                    element.style.setProperty('--strength-color', color);
                    element.style.setProperty('--strength-color-alpha', `${color}40`);
                }
            });
        };
        
        const observer = new MutationObserver(updateStrengthColors);
        observer.observe(document.body, { 
            childList: true, 
            subtree: true, 
            attributes: true, 
            attributeFilter: ['data-strength-color'] 
        });
        
        updateStrengthColors(); // İlk yükleme
        
        return () => observer.disconnect();
    }, [])

    // Şifreleri veritabanından çek
    const fetchPasswords = async () => {
        if (!currentUser) return

        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('passwords')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Şifreler çekilemedi:', error)
                alert('Şifreler yüklenirken bir hata oluştu.')
            } else {
                setPasswords(data || [])
            }
        } catch (err) {
            console.error('Beklenmeyen hata:', err)
        } finally {
            setIsLoading(false)
        }
    }

    // Basit şifre şifreleme (production'da güçlü şifreleme kullanılmalı)
    const encryptPassword = (password) => {
        return btoa(password + 'password_salt_2024')
    }

    // Şifre çözme
    const decryptPassword = (encryptedPassword) => {
        try {
            const decoded = atob(encryptedPassword)
            return decoded.replace('password_salt_2024', '')
        } catch {
            return encryptedPassword // Şifrelenmiş değilse olduğu gibi döndür
        }
    }

    // Platform seçimi
    const handlePlatformSelect = (platform) => {
        setSelectedPlatform(platform.name)
        setFormData(prev => ({
            ...prev,
            title: platform.name
        }))
        setIsCustomPlatform(false)
    }

    // Özel platform seçimi
    const handleCustomPlatform = () => {
        setIsCustomPlatform(true)
        setSelectedPlatform('custom')
        setFormData(prev => ({
            ...prev,
            title: ''
        }))
    }

    // Form verilerini güncelleme   
    const handleInputChange = (e) => 
        { 
            const { name, value } = e.target // Form alanının adı ve değerini al
             setFormData(prev => ({
                 ...prev, // Önceki verileri koru
                 [name]: value // Yeni değeri güncelle
         }))
     }

    // Yeni şifre ekleme veya güncelleme
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.title || !formData.username || !formData.password) { 
            alert('Lütfen tüm alanları doldurunuz!')
            return
        }

        if (!currentUser) {
            alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.')
            return
        }

        try {
            setIsLoading(true)

            if (editingId) { 
                // Güncelleme - Supabase'de güncelle
                const { data, error } = await supabase
                    .from('passwords')
                    .update({
                        title: formData.title.trim(),
                        username: formData.username.trim(),
                        password_encrypted: encryptPassword(formData.password),
                        platform: formData.title.trim(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingId)
                    .eq('user_id', currentUser.id)
                    .select()

                if (error) {
                    console.error('Güncelleme hatası:', error)
                    alert('Şifre güncellenirken bir hata oluştu.')
                } else {
                    // Local state'i güncelle
                    setPasswords(prev => prev.map(item => 
                        item.id === editingId 
                            ? { ...data[0], password_encrypted: data[0].password_encrypted }
                            : item
                    ))
                    setEditingId(null)
                    console.log('Şifre başarıyla güncellendi')
                }
            } else {
                // Yeni ekleme - Supabase'e ekle
                const { data, error } = await supabase
                    .from('passwords')
                    .insert([{
                        user_id: currentUser.id,
                        title: formData.title.trim(),
                        username: formData.username.trim(),
                        password_encrypted: encryptPassword(formData.password),
                        platform: formData.title.trim()
                    }])
                    .select()

                if (error) {
                    console.error('Ekleme hatası:', error)
                    alert('Şifre eklenirken bir hata oluştu.')
                } else {
                    // Local state'e ekle
                    setPasswords(prev => [data[0], ...prev])
                    console.log('Şifre başarıyla eklendi')
                }
            }

            // Formu temizle
            setFormData({
                title: '',
                username: '',
                password: ''
            })
            setSelectedPlatform('')
            setIsCustomPlatform(false)
            // Yeni şifre state'lerini de temizle
            setFormPasswordVisible(false)
            setFormPasswordCopied(false)

        } catch (err) {
            console.error('Beklenmeyen hata:', err)
            alert('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }

    // Şifre silme
    const handleDelete = async (id) => {
        if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
            return
        }

        if (!currentUser) {
            alert('Kullanıcı bilgisi bulunamadı.')
            return
        }

        try {
            setIsLoading(true)

            // Supabase'den sil
            const { error } = await supabase
                .from('passwords')
                .delete()
                .eq('id', id)
                .eq('user_id', currentUser.id)

            if (error) {
                console.error('Silme hatası:', error)
                alert('Şifre silinirken bir hata oluştu.')
            } else {
                // Local state'den sil
                setPasswords(prev => prev.filter(item => item.id !== id))
                console.log('Şifre başarıyla silindi')
            }
        } catch (err) {
            console.error('Beklenmeyen hata:', err)
            alert('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }

    // Düzenleme modunu başlat
    const handleEdit = (item) => {
        setFormData({
            title: item.title,
            username: item.username, 
            password: decryptPassword(item.password_encrypted) // Şifrelenmiş şifreyi çöz
        })
        setEditingId(item.id)
        
        // Platform seçimini güncelle
        const foundPlatform = popularPlatforms.find(p => p.name === item.title)
        if (foundPlatform) {
            setSelectedPlatform(foundPlatform.name)
            setIsCustomPlatform(false)
        } else {
            setSelectedPlatform('custom')
            setIsCustomPlatform(true)
        }
    }

    // Düzenleme modunu iptal et
    const handleCancel = () => {
        setEditingId(null)                  // düzenleme modundaki düzenlencek sifre ıd'sini yine default değer olan null yapıyoruz
        setFormData({                       // düzenlemden cıks yaptığımız için formun içindeki verileri temizliyoruz
            title: '',
            username: '',
            password: ''
        })
        setSelectedPlatform('')
        setIsCustomPlatform(false)
        // Yeni şifre state'lerini de temizle
        setFormPasswordVisible(false)
        setFormPasswordCopied(false)
    }

    // Şifreyi kopyalama
    const handleCopyPassword = async (encryptedPassword, id) => {
        try {
            const decryptedPassword = decryptPassword(encryptedPassword)
            await navigator.clipboard.writeText(decryptedPassword)
            setCopiedPasswords(prev => ({
                ...prev,
                [id]: true
            }))
            
            // 2 saniye sonra normale dön
            setTimeout(() => {
                setCopiedPasswords(prev => ({
                    ...prev,
                    [id]: false
                }))
            }, 2000)
        } catch (err) {
            alert('Kopyalama hatası!')
        }
    }

    // Kullanıcı adını kopyalama
    const handleCopyUsername = async (username, id) => {
        try {
            await navigator.clipboard.writeText(username)
            setCopiedUsernames(prev => ({
                ...prev,
                [id]: true
            }))
            
            // 2 saniye sonra normale dön
            setTimeout(() => {
                setCopiedUsernames(prev => ({
                    ...prev,
                    [id]: false
                }))
            }, 2000)
        } catch (err) {
            alert('Kopyalama hatası!')
        }
    }

    // Şifreyi göster/gizle
    const togglePasswordVisibility = (id) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    // Ana form şifre görünürlüğünü değiştir
    const toggleFormPasswordVisibility = () => {
        setFormPasswordVisible(prev => !prev)
    }

    // Ana form şifresini kopyala
    const handleCopyFormPassword = async () => {
        if (!formData.password) return

        try {
            await navigator.clipboard.writeText(formData.password)
            setFormPasswordCopied(true)
            setTimeout(() => {
                setFormPasswordCopied(false)
            }, 2000)
        } catch (err) {
            console.error('Kopyalama hatası:', err)
            alert('Şifre kopyalanamadı!')
        }
    }

    // Şifre gücü hesaplama
    const calculatePasswordStrength = (password) => {
        if (!password) return { score: 0, text: '', color: '#e9ecef', }
        
        let score = 0
        
        // Uzunluk kontrolü
        if (password.length >= 8) 
        {
            score += 20
        } 
        
        // Büyük harf kontrolü
        if (/[A-Z]/.test(password)) 
        {
            score += 20
        } 
        
        // Küçük harf kontrolü
        if (/[a-z]/.test(password)) 
        {
            score += 20
        } 
        
        // Sayı kontrolü
        if (/\d/.test(password)) 
        {
            score += 20
        } 
        
        // Özel karakter kontrolü
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) 
        {
            score += 20
        } 
        // Bonus puanlar
        if (password.length >= 12) score += 10
        if (password.length >= 16) score += 10
        
        // Skor ve metin belirleme
        let text, color
        if (score < 40) {
            text = 'Çok Zayıf'
            color = '#dc3545'
        } else if (score < 60) {
            text = 'Zayıf'
            color = '#fd7e14'
        } else if (score < 80) {
            text = 'Orta'
            color = '#ffc107'
        } else if (score < 100) {
            text = 'İyi'
            color = '#20c997'
        } else {
            text = 'Mükemmel'
            color = '#28a745'
        }
        
        return { score: Math.min(score, 100), text, color}
    }

    // Güçlü şifre oluşturma fonksiyonu
    const generateStrongPassword = (length = 12) => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz'
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const numbers = '0123456789'
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        
        // Her kategoriden en az bir karakter olacak
        let password = ''
        password += lowercase[Math.floor(Math.random() * lowercase.length)]
        password += uppercase[Math.floor(Math.random() * uppercase.length)]
        password += numbers[Math.floor(Math.random() * numbers.length)]
        password += symbols[Math.floor(Math.random() * symbols.length)]
        
        // Kalan karakterleri rastgele seç
        const allChars = lowercase + uppercase + numbers + symbols
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)]
        }
        
        // Karakterleri karıştır
        return password.split('').sort(() => Math.random() - 0.5).join('')
    }

    // Şifre oluşturma modal'ını açma
    const openPasswordGenerator = () => {
        setShowPasswordGenerator(true)
        setPasswordLength(12)
        setGeneratedPassword('')
        setActiveTab('random') // Rastgele sekmesini aç
    }

    // AI şifre modal'ını açma
    const openAIPasswordGenerator = () => {
        setShowPasswordGenerator(true)
        setGeneratedPassword('')
        setActiveTab('ai') // AI sekmesini aç
    }

    // Şifre oluşturma modal'ını kapatma
    const closePasswordGenerator = () => {
        setShowPasswordGenerator(false)
        setGeneratedPassword('')
        setCopiedGenerated(false)
        setActiveTab('random') // Varsayılan sekmeye dön
        setAiUserInfo({ // AI form bilgilerini temizle
            name: '',
            number: '',
            favorite: '',
            platform: ''
        })
        setAiLoading(false)
    }

    // Şifre oluştur ve göster
    const handleGeneratePassword = () => {
        const newPassword = generateStrongPassword(passwordLength)
        setGeneratedPassword(newPassword)
    }

    // Oluşturulan şifreyi forma uygula
    const applyGeneratedPassword = () => {
        if (generatedPassword) {
            setFormData(prev => ({ ...prev, password: generatedPassword }))
            closePasswordGenerator()
        }
    }

    // Oluşturulan şifreyi kopyala
    const handleCopyGeneratedPassword = async () => {
        if (!generatedPassword) return

        try {
            await navigator.clipboard.writeText(generatedPassword)
            setCopiedGenerated(true)
            setTimeout(() => {
                setCopiedGenerated(false)
            }, 2000)
        } catch (err) {
            console.error('Kopyalama hatası:', err)
            alert('Şifre kopyalanamadı!')
        }
    }

    // AI kullanıcı bilgilerini güncelle
    const handleAiInputChange = (field, value) => {
        setAiUserInfo(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // AI ile şifre oluştur
    const handleGenerateAIPassword = async () => {
        if (!aiUserInfo.name || !aiUserInfo.number || !aiUserInfo.favorite) {
            alert('Lütfen en az İsim, Özel Sayı ve Favori Şey alanlarını doldurun!')
            return
        }

        setAiLoading(true)
        
        try {
            const result = await generateAIPassword(aiUserInfo)
            
            if (result.success) {
                setGeneratedPassword(result.password)
                // Başarı mesajı göster
                console.log(result.message)
            } else {
                setGeneratedPassword(result.password)
                // Uyarı mesajı göster
                alert(result.message)
            }
        } catch (error) {
            console.error('AI Şifre oluşturma hatası:', error)
            alert('Şifre oluşturulurken bir hata oluştu!')
        } finally {
            setAiLoading(false)
        }
    }

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/login');
    };

    return (
        <div className="app-container">
            {/* Başlık Bölümü */}
            <div className="app-header">
                <h1 className="app-title">
                    🔐 Şifre Yöneticisi
                </h1>
                
                {/* Theme Toggle Butonu */}
                <button
                    onClick={toggleTheme}
                    className="theme-toggle"
                    title={isDarkMode ? 'Açık Tema' : 'Koyu Tema'}
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
                
                {/* Çıkış Butonu */}
                <button
                    onClick={handleLogout}
                    className="logout-btn"
                    title="Çıkış Yap"
                >
                    Çıkış
                </button>
            </div>

            {/* Ana İçerik Alanı */}
            <div className="main-layout main-content" id="main-content">
                {/* Form Bölümü - Sol Taraf */}
                <div className="form-container form-section">
                    <h2 className="section-title">
                        {editingId ? '✏️ Şifre Güncelle' : '➕ Yeni Şifre Ekle'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Platform Seçimi */}
                        <div className="mb-20">
                            <label className="label mb-10">
                                🌐 Platform
                            </label>
                            <div className="platform-grid">
                                {popularPlatforms.map(platform => (
                                    <div
                                        key={platform.name}
                                        onClick={() => setFormData({...formData, title: platform.name})}
                                        className={`platform-item ${formData.title === platform.name ? 'selected' : ''}`}
                                    >
                                        <div 
                                            className="platform-icon"
                                            dangerouslySetInnerHTML={{ __html: platform.svg }}
                                        />
                                        <span className="platform-name">
                                            {platform.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Veya özel platform adı girin..."
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="input mt-8"
                            />
                        </div>

                        {/* Kullanıcı Adı */}
                        <div className="mb-15">
                            <label className="label">
                                👤 Kullanıcı Adı / E-posta
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                placeholder="Kullanıcı adınızı giriniz"
                                required
                                className="input"
                            />
                        </div>

                        {/* Şifre */}
                        <div className="mb-20">
                            <label className="label">
                                🔑 Şifre
                            </label>
                            
                            {/* Şifre Input Container */}
                            <div className="input-container">
                                <input
                                    type={formPasswordVisible ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="Şifrenizi giriniz"
                                    required
                                    className={`input transition-padding ${formData.password ? 'input-with-actions' : ''}`}
                                />
                                
                                {/* İç Butonlar - Sağ tarafta */}
                                {formData.password && (
                                    <div className="input-actions">
                                        {/* Görünürlük Butonu */}
                                        <button
                                            type="button"
                                            onClick={toggleFormPasswordVisibility}
                                            className={`btn-mini ${formPasswordVisible ? 'btn-mini-visible' : ''}`}
                                            title={formPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
                                        >
                                            {formPasswordVisible ? '🙈' : '👁'}
                                        </button>
                                        
                                        {/* Kopyala Butonu */}
                                        <button
                                            type="button"
                                            onClick={handleCopyFormPassword}
                                            className={`btn-mini ${formPasswordCopied ? 'btn-mini-copied' : ''}`}
                                            title={formPasswordCopied ? 'Kopyalandı!' : 'Şifreyi kopyala'}
                                        >
                                            {formPasswordCopied ? '✅' : '📄'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Şifre Gücü Göstergesi */}
                            {formData.password && (
                                <div className="strength-indicator-form">
                                    {(() => {
                                        const strength = calculatePasswordStrength(formData.password)
                                        const level = Math.ceil(strength.score / 20) // 0-5 seviye
                                        
                                        return (
                                            <div className="strength-box-form">
                                                {/* Şifre Gücü İkonu */}
                                                <div 
                                                    className="strength-info-form"
                                                    data-strength-color={strength.color}
                                                >
                                                    <span className="strength-icon">🛡️</span>
                                                    <span className="strength-text">
                                                        {strength.text}
                                                    </span>
                                                </div>

                                                {/* Daireli Gösterge */}
                                                <div className="strength-dots-container">
                                                    {[1, 2, 3, 4, 5].map((dot) => (
                                                        <div
                                                            key={dot}
                                                            className={`strength-dot-enhanced ${dot <= level ? 'active' : ''}`}
                                                            data-strength-color={strength.color}
                                                            data-dot-active={dot <= level}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Skor */}
                                                <div className="strength-score-display">
                                                    {strength.score}/100
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Butonlar */}
                        <div className="flex gap-md flex-center">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`btn btn-primary ${editingId ? 'btn-full' : 'btn-full'}`}
                            >
                                {isLoading 
                                    ? (editingId ? '⏳ Güncelleniyor...' : '⏳ Kaydediliyor...') 
                                    : (editingId ? '💾 Güncelle' : '💾 Kaydet')
                                }
                            </button>
                            
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="btn btn-secondary btn-full"
                                >
                                    ❌ İptal
                                </button>
                            )}
                        </div>
                        
                        {/* Güçlü Şifre Oluştur Butonu */}
                        <div className="mt-15">
                            <button
                                type="button"
                                onClick={openPasswordGenerator}
                                className="btn btn-primary btn-full"
                            >
                                🎯 Güçlü Şifre Oluştur
                            </button>
                        </div>

                        {/* AI Şifre Öner Butonu */}
                        <div className="mt-15">
                            <button
                                type="button"
                                onClick={openAIPasswordGenerator}
                                className="btn btn-ai btn-full"
                            >
                                🤖 AI ile Şifre Öner
                                <span className="ai-badge">
                                    YENİ
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Kayıtlı Şifreler - Sağ Taraf */}
                <div className="passwords-container">
                        <h2>
                        <span>📋 Kayıtlı Şifreler</span>
                        <span className="passwords-count">
                            {passwords.length}
                        </span>
                    </h2>

                    <div className="passwords-grid-container">
                    {isLoading ? (
                        <div className="empty-state">
                            <div className="empty-icon">⏳</div>
                            <p className="empty-title">
                                Şifreler yükleniyor...
                            </p>
                            <p className="empty-subtitle">
                                Lütfen bekleyin
                            </p>
                        </div>
                    ) : passwords.length === 0 ? (
                        <div className="empty-state">
                                <div className="empty-icon">🔒</div>
                            <p className="empty-title">
                                    Henüz şifre eklenmemiş
                            </p>
                            <p className="empty-subtitle">
                                    Yeni şifre eklemek için formu kullanın
                            </p>
                        </div>
                    ) : (
                        <div className="passwords-grid">
                            {passwords.map(item => (
                                <div
                                    key={item.id}
                                    className="card card-custom"
                                >
                                    {/* Platform Başlığı */}
                                    <div className="card-header">
                                        <div className="card-platform-header">
                                            <span className="platform-icon-wrapper">
                                                {(() => {
                                                    const platform = popularPlatforms.find(p => p.name === item.title);
                                                    if (platform) {
                                                        return (
                                                            <div 
                                                                className="platform-icon-size"
                                                                dangerouslySetInnerHTML={{ __html: platform.svg }}
                                                            />
                                                        );
                                                    }
                                                    return <span className="text-2xl">🔗</span>;
                                                })()}
                                            </span>
                                            <h3 className="platform-title">
                                                {item.title}
                                            </h3>
                                        </div>

                                        {/* Mini 5 Noktalı Şifre Gücü Göstergesi */}
                                        <div className="mini-strength-indicator">
                                            {(() => {
                                                const strength = calculatePasswordStrength(decryptPassword(item.password_encrypted));
                                                const filledDots = Math.ceil((strength.score / 100) * 5);
                                                return Array.from({ length: 5 }, (_, index) => (
                                                    <div
                                                        key={index}
                                                        className={`mini-strength-dot ${index < filledDots ? 'active' : ''}`}
                                                        data-strength-color={strength.color}
                                                    />
                                                ));
                                            })()}
                                        </div>
                                    </div>

                                    {/* Kullanıcı Bilgileri */}
                                    <div className="card-body">
                                        {/* Kullanıcı Adı Satırı */}
                                        <div className="card-row">
                                            <div className="card-info-left">
                                                <span className="card-icon">👤</span>
                                                <span className="card-text">
                                                    {item.username}
                                                </span>
                                            </div>
                                            
                                            {/* Buton Container - Şifre satırıyla aynı */}
                                            <div className="mini-buttons">
                                                {/* Boş alan (göz butonunun yerine) */}
                                                <div className="spacer-btn"></div>
                                                
                                                {/* Kullanıcı Adı Kopyalama Butonu */}
                                                <button
                                                    onClick={() => handleCopyUsername(item.username, item.id)}
                                                    className={`btn-mini ${copiedUsernames[item.id] ? 'btn-mini-copied' : ''}`}
                                                    title={copiedUsernames[item.id] ? 'Kopyalandı!' : 'Kullanıcı adını kopyala'}
                                                >
                                                    {copiedUsernames[item.id] ? '✅' : '📄'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Şifre Satırı */}
                                        <div className="card-row-no-margin">
                                            <div className="card-info-left">
                                                <span className="card-icon">🔑</span>
                                                <span className={`card-password-text ${!visiblePasswords[item.id] ? 'card-password-hidden' : ''}`}>
                                                    {visiblePasswords[item.id] ? decryptPassword(item.password_encrypted) : '•'.repeat(Math.min(decryptPassword(item.password_encrypted).length, 12))}
                                                </span>
                                            </div>
                                            
                                            {/* Mini Butonlar */}
                                            <div className="mini-buttons">
                                                <button
                                                    onClick={() => togglePasswordVisibility(item.id)}
                                                    className={`btn-mini ${visiblePasswords[item.id] ? 'btn-mini-visible' : ''}`}
                                                    title={visiblePasswords[item.id] ? 'Şifreyi gizle' : 'Şifreyi göster'}
                                                >
                                                    {visiblePasswords[item.id] ? '🙈' : '👁'}
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleCopyPassword(item.password_encrypted, item.id)}
                                                    className={`btn-mini ${copiedPasswords[item.id] ? 'btn-mini-copied' : ''}`}
                                                    title={copiedPasswords[item.id] ? 'Kopyalandı!' : 'Şifreyi kopyala'}
                                                >
                                                    {copiedPasswords[item.id] ? '✅' : '📄'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Butonlar */}
                                    <div className="card-footer">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="btn btn-warning btn-sm card-footer-buttons"
                                        >
                                            ✏️ Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="btn btn-danger btn-sm card-footer-buttons"
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* Güçlü Şifre Oluşturma Modal'ı */}
            {showPasswordGenerator && (
                <div className="modal-overlay">
                    <div className="modal">
                                                 {/* Modal Başlığı ve Sekmeler */}
                         <div className="modal-header">
                             <div className="modal-header-row">
                                 <h3 className="modal-title">
                                     <span className="icon-lg">🎯</span>
                                     Şifre Oluşturucu
                                 </h3>
                                 <button
                                     onClick={closePasswordGenerator}
                                     className="modal-close"
                                 >
                                     ✕
                                 </button>
                             </div>

                             {/* Sekme Butonları */}
                             <div className="tabs">
                                 <button
                                     onClick={() => setActiveTab('random')}
                                     className={`tab ${activeTab === 'random' ? 'active' : ''}`}
                                 >
                                     <span className="tab-icon">🎲</span>
                                     Rastgele
                                 </button>
                                 <button
                                     onClick={() => setActiveTab('ai')}
                                     className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
                                 >
                                     <span className="tab-icon">🤖</span>
                                     AI Asistan
                                 </button>
                             </div>
                         </div>

                                                 {/* Rastgele Şifre Sekmesi */}
                         {activeTab === 'random' && (
                             <>
                                 {/* Şifre Uzunluğu Seçimi */}
                                 <div className="mb-25">
                                     <label className="label label-lg">
                                         📏 Şifre Uzunluğu: <span className="primary-color-text">{passwordLength}</span> karakter
                                     </label>
                                     <input
                                         type="range"
                                         min="6"
                                         max="32"
                                         value={passwordLength}
                                         onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                                         className="slider-container"
                                     />
                                     <div className="slider-labels">
                                         <span>6 (Min)</span>
                                         <span>32 (Max)</span>
                                     </div>
                                 </div>

                                 {/* Şifre Oluştur Butonu */}
                                 <button
                                     onClick={handleGeneratePassword}
                                     className="btn btn-primary btn-lg btn-full mb-25"
                                 >
                                     <span className="icon-md">⚡</span>
                                     {generatedPassword ? 'Tekrar Oluştur' : 'Şifre Oluştur'}
                                 </button>
                             </>
                         )}

                         {/* AI Asistan Sekmesi */}
                         {activeTab === 'ai' && (
                             <>
                                 {/* AI Form */}
                                 <div className="mb-25">
                                     {/* İsim/Lakap */}
                                     <div className="mb-15">
                                         <label className="label">
                                             👤 İsminiz veya Lakabınız
                                         </label>
                                         <input
                                             type="text"
                                             value={aiUserInfo.name}
                                             onChange={(e) => handleAiInputChange('name', e.target.value)}
                                             placeholder="Örn: Ahmet, Ace, Kaptan"
                                             className="input"
                                         />
                                     </div>

                                     {/* Özel Sayı */}
                                     <div className="mb-15">
                                         <label className="label">
                                             🔢 Özel Sayınız
                                         </label>
                                         <input
                                             type="text"
                                             value={aiUserInfo.number}
                                             onChange={(e) => handleAiInputChange('number', e.target.value)}
                                             placeholder="Örn: 1995, 42, 2023"
                                             className="input"
                                         />
                                     </div>

                                     {/* Favori Şey */}
                                     <div className="mb-15">
                                         <label className="label">
                                             ❤️ Favori Bir Şeyiniz
                                         </label>
                                         <input
                                             type="text"
                                             value={aiUserInfo.favorite}
                                             onChange={(e) => handleAiInputChange('favorite', e.target.value)}
                                             placeholder="Örn: Mavi, Kediler, Futbol, Kitap"
                                             className="input"
                                         />
                                     </div>

                                     {/* Platform (Opsiyonel) */}
                                     <div className="mb-20">
                                         <label className="label">
                                             🌐 Platform (Opsiyonel)
                                         </label>
                                         <input
                                             type="text"
                                             value={aiUserInfo.platform}
                                             onChange={(e) => handleAiInputChange('platform', e.target.value)}
                                             placeholder="Örn: Instagram, Gmail, Netflix"
                                             className="input"
                                         />
                                     </div>
                                 </div>

                                 {/* AI Şifre Oluştur Butonu */}
                                 <button
                                     onClick={handleGenerateAIPassword}
                                     disabled={aiLoading}
                                     className="btn btn-primary btn-lg btn-full mb-25"
                                 >
                                     {aiLoading ? (
                                         <>
                                             <span className="icon-md">⏳</span>
                                             AI Düşünüyor...
                                         </>
                                     ) : (
                                         <>
                                             <span className="icon-md">🤖</span>
                                             {generatedPassword ? 'Yeni AI Şifre' : 'AI Şifre Oluştur'}
                                         </>
                                     )}
                                 </button>
                             </>
                         )}

                        {/* Oluşturulan Şifre */}
                        {generatedPassword && (
                            <div className="generated-password-box">
                                <label className="label label-md">
                                    🔑 Oluşturulan Şifre:
                                </label>
                                                                 <div className="password-display">
                                     {generatedPassword}
                                     <button
                                         onClick={handleCopyGeneratedPassword}
                                         className={`btn-mini copy-btn-absolute ${copiedGenerated ? 'btn-mini-copied' : ''}`}
                                         title={copiedGenerated ? 'Kopyalandı!' : 'Şifreyi kopyala'}
                                     >
                                         {copiedGenerated ? '✅' : '📄'}
                                     </button>
                                 </div>
                                
                                {/* Şifre Gücü Göstergesi */}
                                <div className="strength-indicator-generated">
                                    {(() => {
                                        const strength = calculatePasswordStrength(generatedPassword)
                                        const level = Math.ceil(strength.score / 20)
                                        
                                        return (
                                            <div className="strength-box-generated">
                                                <div 
                                                    className="strength-info-generated"
                                                    data-strength-color={strength.color}
                                                >
                                                    <span className="strength-icon">🛡️</span>
                                                    <span className="strength-text-generated">
                                                        {strength.text}
                                                    </span>
                                                </div>
                                                <div className="strength-dots-generated">
                                                    {[1, 2, 3, 4, 5].map((dot) => (
                                                        <div
                                                            key={dot}
                                                            className={`strength-dot-generated ${dot <= level ? 'active' : ''}`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="strength-score-generated">
                                                    {strength.score}/100
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Alt Butonlar */}
                        <div className="modal-footer-buttons">
                            <button
                                onClick={applyGeneratedPassword}
                                disabled={!generatedPassword}
                                className={`btn ${generatedPassword ? 'btn-success' : 'btn-secondary'} btn-lg flex-1`}
                            >
                                <span className="icon-base">✅</span>
                                Şifreyi Kullan
                            </button>
                            <button
                                onClick={closePasswordGenerator}
                                className="btn btn-secondary btn-lg flex-1"
                            >
                                <span className="icon-base">❌</span>
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    )
}

export default App;