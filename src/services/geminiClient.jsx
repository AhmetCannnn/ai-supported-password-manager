import { GoogleGenerativeAI } from '@google/generative-ai';

// API Key'inizi buraya yazın
const API_KEY = 'AIzaSyCddKLJh9gUsPhAhE8pXVoy76J6Wb_vQqM'; // Gerçek API key'inizi buraya yazacaksınız

const genAI = new GoogleGenerativeAI(API_KEY);

// AI ile kişiselleştirilmiş şifre oluşturma
export const generateAIPassword = async (userInfo) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Sen bir güvenli şifre oluşturma uzmanısın. Aşağıdaki kullanıcı bilgilerini kullanarak güvenli ve anlamlı bir şifre oluştur:

Kullanıcı Bilgileri:
- İsim/Lakap: ${userInfo.name}
- Özel Sayı: ${userInfo.number}
- Favori Şey: ${userInfo.favorite}
- Platform: ${userInfo.platform}

Şifre Kuralları:
- 8-16 karakter arası olmalı
- En az 1 büyük harf içermeli
- En az 1 küçük harf içermeli
- En az 1 sayı içermeli
- En az 1 özel karakter (!@#$%^&*) içermeli
- Anlamlı ve hatırlanabilir olmalı
- Tahmin edilmesi zor olmalı

Sadece şifreyi döndür, açıklama yapma. Örnek: MyDog123!

Şifre:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const password = response.text().trim();

    // Şifrenin kuralları karşıladığından emin ol
    if (password && password.length >= 8 && password.length <= 16) {
      return {
        success: true,
        password: password,
        message: 'AI şifreniz başarıyla oluşturuldu!'
      };
    } else {
      throw new Error('Şifre uygun formatta oluşturulamadı');
    }

  } catch (error) {
    console.error('AI Şifre oluşturma hatası:', error);
    
    // Hata durumunda fallback şifre
    const fallbackPassword = generateFallbackPassword(userInfo);
    
    return {
      success: false,
      password: fallbackPassword,
      message: 'AI servisi şu anda kullanılamıyor. Alternatif şifre oluşturuldu.',
      error: error.message
    };
  }
};

// AI hata durumunda kullanılacak yedek şifre oluşturucu
const generateFallbackPassword = (userInfo) => {
  const { name, number, favorite } = userInfo;
  
  // Basit ama güvenli şifre oluştur
  const namepart = name ? name.slice(0, 3) : 'User';
  const favoritepart = favorite ? favorite.slice(0, 3) : 'Fun';
  const symbols = ['!', '@', '#', '$', '%', '^', '&', '*'];
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  
  // Büyük harf + küçük harf + sayı + sembol
  const password = namepart.charAt(0).toUpperCase() + 
                  namepart.slice(1).toLowerCase() + 
                  favoritepart.toLowerCase() + 
                  number + 
                  randomSymbol;
  
  return password;
};

// API key kontrolü
export const checkAPIConnection = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Test");
    return { success: true, message: 'API bağlantısı başarılı!' };
  } catch (error) {
    return { success: false, message: 'API bağlantısı başarısız: ' + error.message };
  }
};
