# 🔐 Password Manager Web Uygulaması

Modern ve güvenli bir şifre yöneticisi web uygulaması. React.js, Supabase ve Gemini AI teknolojileri ile geliştirilmiştir.

## ✨ Özellikler

- 🛡️ **Güvenli Şifre Saklama**: Şifrelerinizi güvenle saklayın ve yönetin
- 🎯 **Platform Desteği**: Farklı platformlar için özelleştirilmiş simgeler
- 🔒 **Şifre Gücü Analizi**: Şifrelerinizin güvenlik seviyesini görün
- 🤖 **AI Destekli Şifre Üretimi**: Gemini AI ile güçlü şifreler oluşturun
- 🌙 **Karanlık/Aydınlık Tema**: Göz dostu tema seçenekleri
- 📱 **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- ⚡ **Hızlı Kopyalama**: Tek tıkla şifre kopyalama
- 🔍 **Arama ve Filtreleme**: Şifrelerinizi kolayca bulun

## 🚀 Teknolojiler

- **Frontend**: React.js 19, Vite
- **Backend**: Supabase (Database, Authentication)
- **AI**: Google Gemini AI
- **Styling**: CSS3, Custom Components
- **Icons**: Unicode Emojis

## 📦 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Supabase hesabı
- Google Gemini AI API key'i

### Adımlar

1. **Projeyi klonlayın**
   ```bash
   git clone [repository-url]
   cd password_manager
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarlayın**
   
   `src/services/` klasöründe aşağıdaki dosyaları oluşturun:
   
   **supabaseClient.js**
   ```javascript
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = 'YOUR_SUPABASE_URL'
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
   
   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```
   
   **geminiClient.jsx**
   ```javascript
   import { GoogleGenerativeAI } from '@google/generative-ai'
   
   const API_KEY = 'YOUR_GEMINI_API_KEY'
   const genAI = new GoogleGenerativeAI(API_KEY)
   
   export { genAI }
   ```

4. **Supabase veritabanını hazırlayın**
   
   Aşağıdaki SQL tablosunu oluşturun:
   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     full_name VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE TABLE passwords (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id),
     platform VARCHAR(255) NOT NULL,
     username VARCHAR(255) NOT NULL,
     password_encrypted TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

5. **Uygulamayı çalıştırın**
   ```bash
   npm run dev
   ```

## 🎮 Kullanım

1. **Kayıt Olun**: Yeni hesap oluşturun
2. **Giriş Yapın**: Mevcut hesabınızla giriş yapın
3. **Şifre Ekleyin**: Platform bilgileri ile şifrelerinizi kaydedin
4. **Şifre Üretetin**: AI destekli güçlü şifreler oluşturun
5. **Yönetin**: Şifrelerinizi görüntüleyin, kopyalayın, düzenleyin

## 📁 Proje Yapısı

```
password_manager/
├── src/
│   ├── components/
│   │   ├── auth/          # Login/Register bileşenleri
│   │   └── dashboard/     # Ana şifre yöneticisi
│   ├── services/          # API servisler (Supabase, Gemini)
│   ├── styles/            # CSS dosyaları
│   └── data/              # Statik veriler (platform listesi)
├── public/                # Statik dosyalar
└── README.md
```

## 🔧 Geliştirme

### Önemli Komutlar
```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run preview  # Build önizleme
npm run lint     # ESLint kontrolü
```

### Kod Kalitesi
- ESLint kuralları aktif
- Modern React patterns (Hooks, Functional Components)
- CSS modüler yapı
- Responsive design prensipler

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Ahmet Can Yılmaz** - [Hetabil Yazılım]

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## ⚠️ Güvenlik Notları

- Şifreler client-side'da basit hash ile saklanır (Production'da bcrypt kullanın)
- API anahtarlarını environment variables ile yönetin
- HTTPS kullanın
- Düzenli güvenlik güncellemeleri yapın

---

💡 **Not**: Bu proje eğitim ve geliştirme amaçlıdır. Production kullanımı için ek güvenlik önlemleri alınmalıdır.
