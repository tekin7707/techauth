# 🚀 Docker Quick Start

## Servisler Çalışıyor ✅

- **PostgreSQL**: `localhost:5432` (admin / Ta96121337!)
- **Redis**: `localhost:6379` (Ta96121337!)

## Hızlı Komutlar

### Servisleri Yönet
```bash
# Durumu kontrol
docker-compose -f docker-compose.infra.yml ps

# Logları izle
docker-compose -f docker-compose.infra.yml logs -f

# Durdur
docker-compose -f docker-compose.infra.yml stop

# Başlat
docker-compose -f docker-compose.infra.yml start

# Tamamen kaldır (veri korunur)
docker-compose -f docker-compose.infra.yml down
```

### PostgreSQL
```bash
# Bağlan
docker exec -it auth-postgres psql -U admin -d auth_service

# Tabloları göster
\dt

# Çıkış
\q
```

### Redis
```bash
# Bağlan
docker exec -it auth-redis redis-cli -a Ta96121337!

# Test
PING

# Çıkış
exit
```

### pgAdmin (Development)
```bash
# Başlat
docker-compose -f docker-compose.infra.yml --profile dev up -d pgadmin

# Tarayıcıda aç
open http://localhost:5050
# Login: admin@admin.com / Ta96121337!
```

## Connection Strings

```bash
# PostgreSQL
DATABASE_URL=postgresql://admin:Ta96121337!@localhost:5432/auth_service

# Redis
REDIS_URL=redis://:Ta96121337!@localhost:6379
```

## Uygulama Hazır Olunca

```bash
# Tam stack'i başlat
docker-compose up -d --build

# Migration çalıştır
docker-compose exec app npx prisma migrate deploy

# API test
curl http://localhost:3000/health
```

## Detaylı Dokümantasyon

📖 [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) - Detaylı kullanım kılavuzu

---

✅ Infrastructure hazır! Uygulama geliştirmeye başlayabilirsiniz.
