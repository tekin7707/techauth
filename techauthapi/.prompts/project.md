##Yeni proje ekleme.

1. Proje eklemek için bir endpoint yaz.
2. Proje ve o proje için admin hesabı aynı anda eklenir.
3. Proje admini o projenin tüm yetkilerine sahip olur.
4. Öncelikle proje ekleyebilmek için global admin tarafından verilmiş bir davetiye gerekir. Davetiye bir key içeriri ve proje oluşturma endpıintine eklenmesi beklenir. Bu key'i nerede tutacağına sen karar ver. Süreli olması gerekiyor. Süre dolunca davetiye geçersiz olur. Süre 3 gündür.

5. Davetiye sadece bir kez kullanılabilir.
6. Davetiye oluşturma endpointi gerekiyor ve bu global edmin tarafından kullanılabilir. Davetiyeler bir key içerir ve bu key ile proje oluşturulabilir. Davetiyeler global admin tarafından oluşturulur.

Yani, global admin bir endpoint üzerinden davetiye oluşturur. Bu davetiye proje adminine gider. Proje admini bu davetiye ile projeyi oluşturur. Proje admini o projenin tüm yetkilerine sahip olur. Proje ismini belirler. Aynı anda bir de proje admini kullanıcısı oluşturur. Proje admini kendi projesindeki kullanıcıları listeleyebilir. MEvcut ednpointi buna göre güncelle.


1.Proje davetiyesi email'e özel olmalı. Yani bir davetiye sadece atanan email ile kayıt olunarak kullanılabilmeli.
2-Davetiye kullanılarak bir proje oluşturulurken aynı anda bir de kullanıcı oluşturuluyor. Gördüğüm kadarıyla otomatik verify ediliyor. O da email ile verify edilmeli.