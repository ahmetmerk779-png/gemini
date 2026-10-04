# MC Multi Bot Panel (Minecraft-Protocol Tabanlı)

Bu proje Render üzerinde çalışmak üzere Node.js ve `minecraft-protocol` kütüphanesi kullanılarak geliştirilmiş bir çoklu Minecraft bot yönetim panelidir. 

## Sürüm Notları (v1.0.0)

**Eklenen Özellikler ve Güncellemeler:**
- [x] **Altyapı:** Mineflayer **kullanılmadı**, istendiği gibi sadece `minecraft-protocol` entegre edildi.
- [x] **Panel Düzeni:** Her bot için ayrı "kart (card)" görünümü yapıldı. IP, Versiyon, Login, Alt sunucu isimleri eklendi.
- [x] **Alt Sunucu Komutu:** Ledger notlarına istinaden proxy/sunucu geçişleri `/server` değil, `/gir` komutu ile otomatik hale getirildi.
- [x] **Terminal Sistemi:** Her botun kendi özel terminali eklendi. Ayrıca sayfa üstüne tüm botlara aynı anda komut gönderebileceğin **Global Terminal** konuldu.
- [x] **AFK Sistemi:** Oyuna girildiğinde botun kick yememesi için rastgele etrafa bakmasını sağlayan "Auto Look" mekanizması eklendi.
- [x] **Auto Reconnect:** Bot sunucudan düşer veya hata alırsa 10 saniye sonra otomatik yeniden bağlanma döngüsü kuruldu.
- [x] **Uptime:** Her bot için ekranda anlık olarak "Kaç saat, kaç dakika oyunda olduğu" (Süre) sayacı oluşturuldu.
- [x] **Dinamik Veri & Render Uyumu:** Panelden IP, Kullanıcı Adı veya Ayar değiştirildiğinde bilgiler canlı olarak `bots.json` dosyasına kaydedilir. Sunucu yeniden başlasa bile veriler silinmez.
- [x] **Toplu Kontroller:** "Tümünü Başlat" ve "Tümünü Durdur" butonları tepeye yerleştirildi.
- [x] **Radar & Tab/Scoreboard Taslağı:** Arayüzde Radar ve Tab listesi için özel bölmeler açıldı. (Radar şu an entity spawn paketlerini yakalıyor).

## Kurulum ve Çalıştırma

1. Terminal'i (veya Termux/Replit) açın.
2. `npm install` komutuyla bağımlılıkları indirin (Express, Socket.io, minecraft-protocol).
3. `npm start` veya `node server.js` yazarak sunucuyu başlatın.
4. `http://localhost:3000` adresine (veya Render size hangi URL'yi verdiyse oraya) tarayıcıdan girip paneli kullanmaya başlayın.
