
## docker projeyi güncelleme

docker-compose up -d --build app

docker-compose down: Konteynerları durdurur ve kaldırır. Veriler silinmez.

docker-compose down -v: Konteynerları ve volume'ları (verileri) siler. (Bunu yapmayın).

docker-compose up -d --build: Değişiklikleri algılar, sadece değişenleri (veya build parametresi ile hepsini) yeniden oluşturur. Veriler silinmez.


## Global admin oluşturma

```mermaid
curl --location 'http://localhost:3000/api/auth/register' \
--header 'x-api-key: ak_0836de0025dea2d4e00297b64ccc08a1' \
--header 'Content-Type: application/json' \
--data-raw '{
    "invitationKey": "ThisIsGlobalAdminAccountFBDAD4BF",
    "email": "admin@belekvillas.com",
    "password": "Mt96121337.",
    "firstName": "Mustafa",
    "lastName": "Tekin"
}'
```

## Login

```mermaid
curl --location 'http://localhost:3000/api/auth/login' \
--header 'x-api-key: ak_7ecf83631d10baf2f968b1b9ee4ba5bd' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "admin@belekvillas.com",
    "password": "Mt96121337."
}'
```

## Kullanıcı listesi

```mermaid
curl --location 'http://localhost:3000/api/admin/users' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYjhlNjdmYS03MTY1LTQ5MzItYjUyYS0yOTRjZjhlOTE5MTkiLCJlbWFpbCI6ImFkbWluQGJlbGVrdmlsbGFzLmNvbSIsImlhdCI6MTc3MDQ5MzY5MSwiZXhwIjoxNzcwNDk0NTkxfQ.DvubjjSz6hHw4eiTxSpqWxfpAhGNsMGP8iVejkPz7Nw' \
--header 'x-api-key: ak_7ecf83631d10baf2f968b1b9ee4ba5bd' \
--data ''
```

## Davetiye gönder

```mermaid
curl --location 'http://localhost:3000/api/projects/invitations' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYjhlNjdmYS03MTY1LTQ5MzItYjUyYS0yOTRjZjhlOTE5MTkiLCJlbWFpbCI6ImFkbWluQGJlbGVrdmlsbGFzLmNvbSIsImlhdCI6MTc3MDQ5MzY5MSwiZXhwIjoxNzcwNDk0NTkxfQ.DvubjjSz6hHw4eiTxSpqWxfpAhGNsMGP8iVejkPz7Nw' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "mustafa.tekin@flo.com.tr",
    "description": "Test Davetiyesi"
}'
```

## Davetiye ile proje oluşturma

```mermaid
curl --location 'http://localhost:3000/api/projects' \
--header 'Content-Type: application/json' \
--data-raw '{
    "invitationKey": "74a8adeddcf55af83fe9ae315dbac0666bc74319e55da10d05fab12af726a4e4",
    "projectName": "Yeni Müthiş Proje",
    "projectSlug": "yeni-muthis-proje",
    "email": "mustafa.tekin@flo.com.tr",
    "password": "GucluSifre123!",
    "firstName": "Proje",
    "lastName": "Admin"
}'
```