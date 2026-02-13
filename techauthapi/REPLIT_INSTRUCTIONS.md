# Replit Deployment Instructions

Bu projeyi Replit üzerinde yayınlamak için aşağıdaki adımları izleyin.

## 1. Dosyaları Yükleme
Bu klasörü bir ZIP dosyası haline getirin ve Replit'e yükleyin.

## 2. Kurulum
Replit otomatik olarak `package.json` dosyasını algılayacak ve `npm install` komutunu çalıştıracaktır.
Eğer otomatik çalışmazsa, Shell (Console) sekmesinde manuel olarak çalıştırın:
```bash
npm install
```

## 3. Environment Variables (Gizli Değişkenler)
Projenin çalışması için `.env` dosyasındaki değerleri Replit'in **Secrets** (Kilit simgesi) bölümüne eklemeniz gerekir.

Aşağıdaki anahtarları ve değerlerini Secrets bölümüne ekleyin:

| Key | Value (Örnek) | Açıklama |
|-----|---------------|----------|
| `NODE_ENV` | `production` | Prodüksiyon modu |
| `PORT` | `3000` | Replit portu |
| `APP_NAME` | `Auth Service` | Uygulama adı |
| `APP_URL` | `https://sizin-replit-urlniz.replit.app` | Replit'in size verdiği URL |
| `FRONTEND_URL` | `https://sizin-frontend-urlniz.com` | Frontend adresi |
| `DATABASE_URL` | `postgresql://...` | Veritabanı bağlantı linki (MySQL veya Postgres) |
| `REDIS_URL` | `redis://...` | Redis bağlantı linki (Opsiyonel ama önerilir) |
| `JWT_ACCESS_SECRET` | (Rastgele Uzun Şifre) | JWT Access Token şifresi |
| `JWT_REFRESH_SECRET` | (Rastgele Uzun Şifre) | JWT Refresh Token şifresi |
| `SMTP_HOST` | `smtp.gmail.com` | Email sunucusu |
| `SMTP_USER` | `email@gmail.com` | Email adresi |
| `SMTP_PASSWORD` | `uygulama-sifresi` | Email şifresi |

### Veritabanı Notu
Replit içinde **PostgreSQL** eklentisini kullanarak bir veritabanı oluşturabilirsiniz. Oluşturduğunuzda size otomatik bir `DATABASE_URL` verecektir. Bunu kullanabilirsiniz.

## 4. Başlatma
Replit `Run` butonuna bastığınızda `.replit` dosyasındaki komutu çalıştıracaktır:
```bash
npm run build && npm start
```
Bu komut önce TypeScript kodlarını derler (`dist/` klasörüne), sonra sunucuyu başlatır.

## 5. Olası Hatalar

### Bcrypt Hatası
Eğer `bcrypt` modülü ile ilgili hata alırsanız (Replit ortamında derleme sorunu olabilir), `package.json` dosyasında `bcrypt` yerine `bcryptjs` kullanmanız gerekebilir.
Bunun için:
1. Shell'de: `npm uninstall bcrypt && npm install bcryptjs`
2. Kodlarda `import * as bcrypt from 'bcrypt'` yerine `import * as bcrypt from 'bcryptjs'` yapın.
## 6. Docker ile Çalıştırma (Alternatif)

Eğer Replit üzerinde **Bash** veya **Docker** şablonu kullanıyorsanız, veya projeyi **Render/Railway** gibi Docker destekleyen başka bir platforma taşıyacaksanız:

`Dockerfile` ve `docker-compose.yml` dosyaları hazırdır.

### Replit/Bash üzerinde:
```bash
# Docker kurulu ise
docker-compose up -d
```
*Not: Replit'in standart Node.js şablonunda Docker daemon çalışmayabilir. Bu durumda yukarıdaki standart kurulum (npm install & start) en garantisidir.*

### Railway/Render üzerinde:
Bu projeyi GitHub'a yükleyip Railway/Render'a bağladığınızda `Dockerfile` otomatik algılanacak ve uygulama ayağa kalkacaktır. Redis ve Postgres için platformun sunduğu veritabanı servislerini kullanıp `.env` dosyasına (veya platformun variable ekranına) bağlantı bilgilerini girdiğinizden emin olun.
