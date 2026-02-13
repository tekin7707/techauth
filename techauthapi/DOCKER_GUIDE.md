# 🐳 Docker Kurulum ve Kullanım Kılavuzu

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Ön Koşullar](#ön-koşullar)
3. [Hızlı Başlangıç](#hızlı-başlangıç)
4. [Detaylı Kurulum](#detaylı-kurulum)
5. [Docker Komutları](#docker-komutları)
6. [Veritabanı Yönetimi](#veritabanı-yönetimi)
7. [Troubleshooting](#troubleshooting)
8. [Production Deployment](#production-deployment)

---

## Genel Bakış

Bu proje, aşağıdaki servisleri Docker Compose ile yönetir:

- **PostgreSQL 15**: Ana veritabanı
- **Redis 7**: Cache ve session store
- **Node.js App**: Auth service uygulaması
- **pgAdmin** (Opsiyonel): Database management UI

### Mimari Yapı

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP (Port 3000)
       ▼
┌─────────────────┐
│   Auth Service  │
│   (Node.js)     │
└────┬────────┬───┘
     │        │
     │        └──────────┐
     │                   │
     ▼                   ▼
┌──────────┐      ┌──────────┐
│PostgreSQL│      │  Redis   │
│(Port 5432)      │(Port 6379)
└──────────┘      └──────────┘
```

---

## Ön Koşullar

### Gerekli Yazılımlar

- **Docker**: v20.10+
- **Docker Compose**: v2.0+

### Kurulum Kontrolü

```bash
# Docker versiyonunu kontrol et
docker --version
# Çıktı: Docker version 20.10.x ...

# Docker Compose versiyonunu kontrol et
docker-compose --version
# Çıktı: Docker Compose version 2.x.x
```

### Docker Kurulumu (macOS)

```bash
# Homebrew ile Docker Desktop kurulumu
brew install --cask docker

# Docker Desktop'ı başlat
open /Applications/Docker.app
```

---

## Hızlı Başlangıç

### 1. Environment Dosyası Oluştur

```bash
# .env.example dosyasını kopyala
cp .env.example .env

# .env dosyasını düzenle (gerekirse)
nano .env
```

### 2. Servisleri Başlat

```bash
# Tüm servisleri arka planda başlat
docker-compose up -d
```

### 3. Database Migration

```bash
# Prisma migration'ları çalıştır
docker-compose exec app npx prisma migrate deploy

# (Opsiyonel) Seed data ekle
docker-compose exec app npx prisma db seed
```

### 4. Durumu Kontrol Et

```bash
# Container durumlarını gör
docker-compose ps

# Application loglarını kontrol et
docker-compose logs -f app
```

### 5. Uygulamaya Erişim

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

---

## Detaylı Kurulum

### Adım 1: Environment Variables

`.env` dosyasında önemli ayarlar:

```bash
# Veritabanı
DATABASE_URL=postgresql://admin:Ta96121337!@postgres:5432/auth_service?schema=public

# Redis
REDIS_URL=redis://:Ta96121337!@postgres:6379

# JWT Secrets (ÖNEMLİ: Production'da değiştirin!)
JWT_ACCESS_SECRET=your-super-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# OAuth Credentials (Google, GitHub, Apple)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
# ... diğer provider'lar
```

### Adım 2: Docker Build

```bash
# Docker image'ını build et
docker-compose build

# No-cache ile build (temiz build)
docker-compose build --no-cache
```

### Adım 3: Container'ları Başlat

```bash
# Detached mode (arka plan)
docker-compose up -d

# Foreground mode (logları görmek için)
docker-compose up

# Belirli bir servisi başlat
docker-compose up -d postgres redis
```

### Adım 4: Database Setup

```bash
# Migration dosyalarını çalıştır
docker-compose exec app npx prisma migrate deploy

# Prisma Studio'yu aç (database GUI)
docker-compose exec app npx prisma studio
# Tarayıcıda: http://localhost:5555
```

---

## Docker Komutları

### Container Yönetimi

```bash
# Tüm servisleri başlat
docker-compose up -d

# Tüm servisleri durdur
docker-compose stop

# Tüm servisleri durdur ve kaldır
docker-compose down

# Volumes ile birlikte kaldır (DİKKAT: Veri silinir!)
docker-compose down -v

# Belirli bir servisi restart et
docker-compose restart app
```

### Logs

```bash
# Tüm servis logları
docker-compose logs

# Belirli servis logları
docker-compose logs app
docker-compose logs postgres

# Canlı log takibi (follow)
docker-compose logs -f app

# Son 100 satır
docker-compose logs --tail=100 app
```

### Container İçine Giriş

```bash
# App container'a shell erişimi
docker-compose exec app sh

# PostgreSQL shell
docker-compose exec postgres psql -U admin -d auth_service

# Redis CLI
docker-compose exec redis redis-cli -a Ta96121337!
```

### Container Durumu

```bash
# Çalışan container'ları listele
docker-compose ps

# Detaylı bilgi
docker-compose ps -a

# Resource kullanımı (CPU, Memory)
docker stats
```

### Image Yönetimi

```bash
# Image'ları listele
docker images

# Kullanılmayan image'ları temizle
docker image prune

# Tüm image'ları temizle (DİKKAT!)
docker-compose down --rmi all
```

---

## Veritabanı Yönetimi

### PostgreSQL

```bash
# PostgreSQL container'a bağlan
docker-compose exec postgres psql -U admin -d auth_service

# SQL komutları
\dt                  # Tabloları listele
\d users             # User tablosunu göster
\l                   # Tüm database'leri listele
\q                   # Çıkış

# Backup al
docker-compose exec postgres pg_dump -U admin auth_service > backup.sql

# Restore et
docker-compose exec -T postgres psql -U admin auth_service < backup.sql
```

### Redis

```bash
# Redis CLI
docker-compose exec redis redis-cli -a Ta96121337!

# Redis komutları
KEYS *               # Tüm key'leri listele
GET key_name         # Key'i oku
SET test "value"     # Key set et
DEL test             # Key sil
FLUSHALL             # Tüm cache'i temizle (DİKKAT!)
INFO                 # Redis bilgileri
```

### pgAdmin (Development)

```bash
# pgAdmin'i dev profile ile başlat
docker-compose --profile dev up -d pgadmin

# Tarayıcıda aç
open http://localhost:5050

# Giriş Bilgileri:
# Email: admin@admin.com
# Password: Ta96121337!
```

**Server Ekleme**:
1. Add New Server
2. General Tab:
   - Name: `Auth Service`
3. Connection Tab:
   - Host: `postgres`
   - Port: `5432`
   - Database: `auth_service`
   - Username: `admin`
   - Password: `Ta96121337!`

---

## Troubleshooting

### Problem: Container Başlamıyor

```bash
# Detaylı hata mesajını gör
docker-compose logs app

# Container'ı restart et
docker-compose restart app

# Tamamen yeniden başlat
docker-compose down
docker-compose up -d
```

### Problem: Port Çakışması

```bash
# Port kullanımını kontrol et
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Çakışan servisi durdur veya
# docker-compose.yml'de portları değiştir
```

örnek: `docker-compose.yml`
```yaml
services:
  app:
    ports:
      - "3001:3000"  # Host:Container
```

### Problem: Database Bağlantı Hatası

```bash
# PostgreSQL çalışıyor mu?
docker-compose ps postgres

# Health check
docker-compose exec postgres pg_isready -U admin

# Container loglarını kontrol et
docker-compose logs postgres

# Restart et
docker-compose restart postgres
```

### Problem: Migration Hataları

```bash
# Migration durumunu kontrol et
docker-compose exec app npx prisma migrate status

# Migration'ları sıfırla (DİKKAT: Development only!)
docker-compose exec app npx prisma migrate reset

# Fresh migration
docker-compose exec app npx prisma migrate deploy
```

### Problem: Build Hataları

```bash
# Cache'siz build
docker-compose build --no-cache app

# Image'ı sil ve yeniden build et
docker-compose down --rmi all
docker-compose build
docker-compose up -d
```

### Problem: Disk Dolu

```bash
# Kullanılmayan kaynakları temizle
docker system prune

# Volumes dahil temizle (DİKKAT: Veri silinir!)
docker system prune -a --volumes
```

---

## Production Deployment

### Production Environment

Production için `.env.production` oluştur:

```bash
NODE_ENV=production

# Güçlü JWT secrets
JWT_ACCESS_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Production database
DATABASE_URL=postgresql://user:pass@prod-db:5432/auth_service

# Production Redis
REDIS_URL=redis://:pass@prod-redis:6379

# SSL/TLS
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### Production Komutları

```bash
# Production mode ile başlat
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Environment dosyası belirt
docker-compose --env-file .env.production up -d

# Health check
curl -f https://your-domain.com/health || exit 1
```

### Monitoring

```bash
# Container resource kullanımı
docker stats

# Disk kullanımı
docker system df

# Container health
docker inspect --format='{{.State.Health.Status}}' auth-service
```

### Backup Strategy

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)

docker-compose exec -T postgres pg_dump -U admin auth_service | \
  gzip > "$BACKUP_DIR/auth_db_$DATE.sql.gz"

# Redis backup
docker-compose exec redis redis-cli -a Ta96121337! SAVE
docker cp auth-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"
```

---

## Faydalı Komutlar (Cheat Sheet)

```bash
# Hızlı başlatma
docker-compose up -d && docker-compose logs -f app

# Hızlı restart
docker-compose restart app && docker-compose logs -f app

# Temiz silme
docker-compose down -v && docker system prune -f

# Database sıfırlama
docker-compose exec app npx prisma migrate reset --force

# Shell erişimi
docker-compose exec app sh

# PostgreSQL erişimi
docker-compose exec postgres psql -U admin -d auth_service

# Redis erişimi
docker-compose exec redis redis-cli -a Ta96121337!

# Tüm logları temizle ve restart
docker-compose down && docker-compose up -d

# Health check loop
watch -n 5 'curl -s http://localhost:3000/health | jq'
```

---

## Yararlı Linkler

- **Swagger API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **pgAdmin**: http://localhost:5050 (--profile dev ile)
- **Prisma Studio**: http://localhost:5555 (npx prisma studio ile)

---

## Notlar

> [!IMPORTANT]
> - Production'da mutlaka güçlü JWT secrets kullanın
> - OAuth credentials'ı `.env` dosyasına ekleyin
> - `.env` dosyasını Git'e eklemeyin

> [!WARNING]
> - `docker-compose down -v` komutu tüm verileri siler!
> - Production database'de `migrate reset` kullanmayın!

> [!TIP]
> - Development için pgAdmin kullanabilirsiniz
> - Logları `docker-compose logs -f` ile takip edin
> - Health check'ları düzenli kontrol edin
