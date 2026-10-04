# MC Multi Bot Panel (Minecraft-Protocol Tabanlı)

Bu proje Render üzerinde çalışmak üzere Node.js ve `minecraft-protocol` kütüphanesi kullanılaMC Multi Bot Panel (Minecraft-Protocol Tabanlı)

Minecraft sunucularında (özellikle 1.21.11 ve altı sürümlerde) çoklu AFK bot yönetimi sağlayan, Render uyumlu modern Node.js web paneli.

Sürüm Notları (v1.3.0 - Bota Özel Terminaller ve Gelişmiş Yönetim)

Yenilikler ve Düzenlemeler:

[x] Global Terminal Kaldırıldı: Ekranı kaplayan ve karmaşa yaratan en üstteki devasa genel terminal kaldırıldı. Artık her botun kendi kartı içinde sadece o bota ait logları gösteren Kişisel Terminaller bulunuyor.

[x] Hızlı Menü Butonları (Toolbar): Her bot kartının içine /gir pvp ve /gir faction gibi sık kullanılan alt sunucu geçiş komutlarını tek tıkla göndermeni sağlayan hızlı eylem butonları eklendi.

[x] Gelişmiş Anti-AFK (Protocol Tabanlı): Mineflayer kullanılmadan, doğrudan minecraft-protocol ile look (kafa çevirme) paketleri gönderilerek sunucuların botu "hareketsiz" algılayıp atması engellendi. Bu özellik her bot için özel bir butonla açılıp kapatılabiliyor.

[x] Dinamik Grid (Izgara) Tasarımı: Yeni eklenen botlar yan yana şık kutular (kartlar) halinde sıralanacak şekilde arayüz yeniden kodlandı.

[x] Canlı Durum Göstergesi: Botların isminin yanına anlık durumlarını (Online = Yeşil, Offline/Hata = Kırmızı) belirten neon durum noktaları (Status Dot) eklendi.

[x] Toplu Kapatma: Üst panele acil durumlar için "Tüm Botları Kapat" butonu yerleştirildi.

Önceki Sürümler

v1.2.0 - Mobil Arayüz & Auth Sistemi

Şifre ile giriş (/login <şifre>) otomasyonu eklendi.

Mobil uyumlu akordiyon (açılır/kapanır) kart tasarımı yapıldı.

v1.1.0 - Protocol Fix

1.19+ ve 1.20+ sürümlerindeki /gir komutlarında yaşanan socketClosed hatası (Chat Command protokolü ile) çözüldü.

v1.0.0 - İlk Çıkış

minecraft-protocol altyapısı kuruldu.

Temel bot bağlama ve log okuma işlemleri yapıldı.rak geliştirilmiş bir çoklu Minecraft bot yönetim panelidir. 

## Sürüm Notları (v1.0.0)

**Eklenen Özellikler ve Güncellemeler:**
- [x] **Altyapı:** Mineflayer **kullanılmadı**, istendiği gibi sadece `minecraft-protocol` entegre edildi.
- [x] **Panel Düzeni:** Her bot için ayrı "kart (card)" görünümü yapıldı. IP, Versiyon, Login, Alt sunucu isimleri eklendi.
- [x] **Alt Sunucu Komutu:** Ledger notlarına istinaden proxy/sunucu geçişleri `/server` değil, `/gir` komutu ile otomatik hale getirildi.
- [x] **Terminal Sistemi:** Her botun kendi özel terminali eklendi. Ayrıca sayfa üstüne tüm botlara aynı anda komut gönderebileceğin **Global Terminal** konuldu.
- [x] **AFK Sistemi:** Oyuna girildiğinde botun kick yememesi için rastgele etrafa bakmasını sağlayan "Auto Look" mekanizması eklendi.
- [x] **Auto Reconnect:** Bot sunucudan düşer veya hata alırsa 10 saniye sonra otomatik yeniden bağlanma döngüsü kuruldu.
- [x] **Uptime:** Her bot için ekranda anlık olarak "Kaç saat, kaç dakika oyunda olduğu" (Süre) sayacı oluşturuldu.
- [x] **Dinamik Veri & Render Uyumu:** # MC Multi Bot Panel (Minecraft-Protocol Tabanlı)

Minecraft sunucularında çoklu AFK bot yönetimi sağlayan, Render uyumlu modern Node.js web paneli.

## Sürüm Notları (v1.1.0 - UI & Protocol Fix Güncellemesi)

### Düzeltilen Hatalar:
- [x] **SocketClosed Hatası Çözüldü:** 1.19+ ve 1.20.6+ sürümlerinde `/gir` komutları gönderilirken sunucunun soketi kapatıp atma sorunu giderildi. Komutlar artık doğrudan modern Minecraft `chat_command` paket yapısı ile iletiliyor.
- [x] **Bağlantı Stabilizasyonu:** Sunucu ip ayrıştırmaları (ip:port) ve paket yönlendirme mantığı güçlendirildi.

### Yenilikler & Tasarım (UI):
- [x] **Ultra Modern Dark UI:** Glassmorphism (cam efekti), modern Inter/Plus Jakarta Sans tipografisi ve neon renk tonlarıyla arayüz sıfırdan tasarlandı.
- [x] **Canlı Süre Sayacı (Uptime):** Saniye hassasiyetinde canlı süre göstergesi güncellendi.
- [x] **Terminal Renklendirmesi:** Sistem mesajları, hatalar, komutlar ve sohbet yazıları ayrı renk tonlarıyla renklendirildi.
- [x] **Bot Silme Özelliği:** Artık istemediğin botları paneli temiz tutmak için çöp kutusu ikonuyla silebiliyorsun.
- [x] **Mobil Uyum:** Mobil ekranlarda rahat kontrol için ızgara (grid) ve flex düzeni optimize edildi.

---

## Sürüm Notları (v1.0.0)
- [x] Ilk sürüm yayını (Tüm temel bot fonksiyonları, AFK hareketleri, JSON kaydetme sistemi).Panelden IP, Kullanıcı Adı veya Ayar değiştirildiğinde bilgiler canlı olarak `bots.json` dosyasına kaydedilir. Sunucu yeniden başlasa bile veriler silinmez.
- [x] **Toplu Kontroller:** "Tümünü Başlat" ve "Tümünü Durdur" butonları tepeye yerleştirildi.
- [x] **Radar & Tab/Scoreboard Taslağı:** Arayüzde Radar ve Tab listesi için özel bölmeler açıldı. (Radar şu an entity spawn paketlerini yakalıyor).

## Kurulum ve Çalıştırma

1. Terminal'i (veya Termux/Replit) açın.
2. `npm install` komutuyla bağımlılıkları indirin (Express, Socket.io, minecraft-protocol).
3. `npm start` veya `node server.js` yazarak sunucuyu başlatın.
4. `http://localhost:3000` adresine (veya Render size hangi URL'yi verdiyse oraya) tarayıcıdan girip paneli kullanmaya başlayın.
