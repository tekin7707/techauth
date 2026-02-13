# 🔐 OAuth Providers Kurulum Rehberi

Bu rehber Google, GitHub ve Apple OAuth entegrasyonu için gerekli adımları açıklar.

---

## 📋 Genel Bakış

OAuth 2.0 ile kullanıcılar, üçüncü parti hesaplarıyla (Google, GitHub, Apple) giriş yapabilir. Her provider için:
1. Developer Console'da uygulama oluşturulması
2. Client ID ve Secret alınması
3. Callback URL yapılandırması
4. `.env` dosyasına credential eklenmesi gerekir

---

## 🌐 Google OAuth

### Adım 1: Google Cloud Console

1. **Console'a git**: https://console.cloud.google.com/
2. **Yeni Proje Oluştur** (veya mevcut projeyi seç)
3. **APIs & Services** > **OAuth consent screen**
   - User Type: External (veya Internal - sadece kendi domain'inizdekiler için)
   - App name: `Auth Service` (veya istediğiniz isim)
   - User support email: Kendi email'iniz
   - Developer contact: Kendi email'iniz
   - **Save and Continue**

### Adım 2: Credentials Oluştur

1. **Credentials** > **Create Credentials** > **OAuth client ID**
2. Application type: **Web application**
3. Name: `Auth Service Web Client`
4. **Authorized redirect URIs** ekle:
   ```
   http://localhost:3000/api/oauth/google/callback
   https://yourdomain.com/api/oauth/google/callback
   ```
5. **Create** tıkla
6. **Client ID** ve **Client Secret** kopyala

### Adım 3: .env Dosyasına Ekle

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback
```

### Test için Kullanıcı Ekle (Development)

OAuth consent screen "In Production" durumunda değilse:
- **Test users** bölümüne test email'leri ekleyin
- Sadece bu kullanıcılar OAuth ile giriş yapabilir

---

## 🐙 GitHub OAuth

### Adım 1: GitHub Developer Settings

1. **GitHub'a git**: https://github.com/settings/developers
2. **OAuth Apps** > **New OAuth App**

### Adım 2: Uygulama Bilgileri

- **Application name**: `Auth Service`
- **Homepage URL**: `http://localhost:3000` (veya domain'iniz)
- **Application description**: `Central authentication service`
- **Authorization callback URL**:
  ```
  http://localhost:3000/api/oauth/github/callback
  ```
- **Register application** tıkla

### Adım 3: Client Secret Oluştur

1. **Generate a new client secret**
2. **Client ID** ve **Client Secret** kopyala (Secret sadece bir kez gösterilir!)

### Adım 4: .env Dosyasına Ekle

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/oauth/github/callback
```

### Not

GitHub OAuth daha az kısıtlayıcıdır:
- Test user listesi yok
- Herkese açık (public)
- Email scope için ek onay gerekebilir

---

## 🍎 Apple Sign In

> [!WARNING]
> Apple Sign In kurulumu daha karmaşıktır ve **Apple Developer Program** ($99/yıl) gerektirir.

### Ön Koşullar

- Apple Developer Program üyeliği
- Verified domain (apple-developer-domain-association dosyası)

### Adım 1: App ID Oluştur

1. **Apple Developer Console**: https://developer.apple.com/account/
2. **Certificates, Identifiers & Profiles**
3. **Identifiers** > **+** (yeni identifier)
4. **App IDs** seç
5. Description: `Auth Service`
6. Bundle ID: `com.yourcompany.authservice`
7. **Sign in with Apple** capability'yi aktif et
8. **Continue** ve **Register**

### Adım 2: Services ID Oluştur

1. **Identifiers** > **+** > **Services IDs**
2. Description: `Auth Service Web`
3. Identifier: `com.yourcompany.authservice.web`
4. **Sign in with Apple** checkbox'ı işaretle
5. **Configure** tıkla:
   - **Domains and Subdomains**: `yourdomain.com`
   - **Return URLs**: `https://yourdomain.com/api/oauth/apple/callback`
   - **Verified Email**: Domain verification email

### Adım 3: Key Oluştur

1. **Keys** > **+**
2. Key Name: `AuthService Sign In Key`
3. **Sign in with Apple** aktif et
4. **Configure** > App ID seç
5. **Continue** ve **Register**
6. **Download** (.p8 dosyası - sadece bir kez!)
7. **Key ID** kopyala

### Adım 4: .env Dosyasına Ekle

```bash
APPLE_CLIENT_ID=com.yourcompany.authservice.web
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_KEYID.p8
# veya private key'i doğrudan (multiline):
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
APPLE_CALLBACK_URL=https://yourdomain.com/api/oauth/apple/callback
```

### Not

- Apple Sign In sadece **HTTPS** ile çalışır (localhost hariç)
- Email adresi kullanıcının tercihine göre gizlenebilir (private relay)
- İlk giriş sonrası kullanıcı bilgileri sadece **bir kez** gelir

---

## 🔄 Callback URL Yapısı

Tüm provider'lar için callback URL pattern:

```
[PROTOCOL]://[DOMAIN]/api/oauth/[PROVIDER]/callback

Örnekler:
http://localhost:3000/api/oauth/google/callback
https://api.myapp.com/api/oauth/github/callback
https://auth.myservice.com/api/oauth/apple/callback
```

---

## 🧪 Test Etme

### Development (Localhost)

```bash
# Auth service'i başlat
docker-compose up -d

# Tarayıcıda test et
open http://localhost:3000/api/oauth/google
open http://localhost:3000/api/oauth/github
# Apple localhost'ta çalışmaz (HTTPS gerekli)
```

### Production

```bash
# Production URL'leri güncelle
# Her provider console'da production callback URL ekle
# .env.production dosyasına production URL'leri yaz

GOOGLE_CALLBACK_URL=https://api.yourapp.com/api/oauth/google/callback
GITHUB_CALLBACK_URL=https://api.yourapp.com/api/oauth/github/callback
APPLE_CALLBACK_URL=https://api.yourapp.com/api/oauth/apple/callback
```

---

## 📊 OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthService
    participant Provider
    
    User->>Frontend: OAuth ile giriş yap tıkla
    Frontend->>AuthService: GET /api/oauth/google?projectApiKey=xxx
    AuthService->>Provider: Redirect to consent screen
    Provider->>User: Göster permissions
    User->>Provider: Approve
    Provider->>AuthService: Callback with code
    AuthService->>Provider: Exchange code for token
    Provider->>AuthService: Return access token + profile
    AuthService->>AuthService: Create/update user
    AuthService->>Frontend: Redirect with JWT tokens
    Frontend->>User: Giriş başarılı
```

---

## ⚙️ .env Tam Örnek

```bash
# Google OAuth
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
GITHUB_CALLBACK_URL=http://localhost:3000/api/oauth/github/callback

# Apple Sign In (Production only)
APPLE_CLIENT_ID=com.mycompany.authservice.web
APPLE_TEAM_ID=ABC123DEF4
APPLE_KEY_ID=XYZ123ABC4
APPLE_PRIVATE_KEY_PATH=/app/keys/AuthKey_XYZ123ABC4.p8
APPLE_CALLBACK_URL=https://api.myapp.com/api/oauth/apple/callback
```

---

## 🚨 Güvenlik Notları

> [!CAUTION]
> **Client Secret'ları asla Git'e eklemeyin!**
> - `.env` dosyası `.gitignore`'da olmalı
> - Production secret'lar environment variables ile yönetilmeli

> [!IMPORTANT]
> **Callback URL Doğrulama**
> - Provider console'da eklenen URL'ler ile kod'daki URL'ler **tam olarak eşleşmeli**
> - Trailing slash farkı bile hata verebilir: `/callback` ≠ `/callback/`

> [!TIP]
> **Multiple Environments**
> - Development ve Production için ayrı OAuth apps oluşturun
> - Test email'leri development app'e ekleyin
> - Production app consent screen'i "In Production" yapın

---

## 📞 Yardım & Troubleshooting

### Google OAuth Hataları

| Hata | Çözüm |
|------|-------|
| `redirect_uri_mismatch` | Callback URL'i console'da kontrol et |
| `access_denied` | User consent screen'de reddetti |
| `invalid_client` | Client ID veya Secret yanlış |

### GitHub OAuth Hataları

| Hata | Çözüm |
|------|-------|
| `redirect_uri_mismatch` | Callback URL kontrolü |
| `bad_verification_code` | Code süresi dolmuş, yeniden dene |
| `incorrect_client_credentials` | Client ID/Secret kontrol et |

### Apple Sign In Hataları

| Hata | Çözüm |
|------|-------|
| `invalid_client` | Services ID veya private key hatalı |
| `invalid_grant` | Authorization code süresi dolmuş |
| Domain verification failed | apple-developer-domain-association dosyası |

---

## 📚 Faydalı Linkler

- **Google**: https://console.cloud.google.com/apis/credentials
- **GitHub**: https://github.com/settings/developers
- **Apple**: https://developer.apple.com/account/resources/identifiers/list/serviceId
- **OAuth 2.0 Spec**: https://oauth.net/2/

---

## ✅ Checklist

Kurulum tamamlandıktan sonra:

- [ ] Her provider için credentials alındı
- [ ] `.env` dosyasına eklendi
- [ ] Callback URL'leri provider console'da kaydedildi
- [ ] Localhost'ta test edildi
- [ ] Production URL'leri eklendi (production için)
- [ ] `.env` dosyası `.gitignore`'a eklendi

---

**Hazır olduğunuzda**, auth service'deki OAuth endpoint'leri çalışır durumda olacak! 🚀
