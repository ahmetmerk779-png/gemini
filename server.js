const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mc = require('minecraft-protocol');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'bots.json');

// Statik dosyaları sun
app.use(express.static(path.join(__dirname, 'public')));

// Bot verilerini yükle
let botsData = {};
if (fs.existsSync(DATA_FILE)) {
    botsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

const activeBots = {}; // Çalışan bot istemcilerini tutar
const botTimers = {};  // Uptime takibi için

// Verileri JSON dosyasına kaydetme fonksiyonu (Render'da veri kaybını önler)
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(botsData, null, 2));
}

function startBot(botId) {
    if (activeBots[botId]) return; // Zaten çalışıyorsa geç

    const data = botsData[botId];
    try {
        const client = mc.createClient({
            host: data.ip,
            version: data.version || false,
            username: data.login,
            auth: 'offline' // Premium ise 'microsoft' yapabilirsin
        });

        activeBots[botId] = client;
        botTimers[botId] = Date.now();

        client.on('login', () => {
            io.emit('bot_status', { id: botId, status: 'Online' });
            
            // Alt sunucuya geçiş (Kendi kuralın olan /gir komutu ile)
            if (data.subServer) {
                setTimeout(() => {
                    // Sürüme göre chat paketi değişebilir, temel kullanım:
                    client.write('chat', { message: `/gir ${data.subServer}` });
                    io.emit('terminal_log', { id: botId, msg: `[Sistem] Alt sunucuya geçiliyor: /gir ${data.subServer}` });
                }, 2000);
            }

            // AFK Hareketi: Sürekli etrafa bakınma
            setInterval(() => {
                if(client.state === 'play') {
                    client.write('look', {
                        yaw: Math.random() * 360,
                        pitch: 0,
                        onGround: true
                    });
                }
            }, 4000);
        });

        // Sohbet ve Terminal
        client.on('chat', (packet) => {
            const msg = JSON.parse(packet.message).text || "Mesaj";
            io.emit('terminal_log', { id: botId, msg: `[Oyun] ${msg}` });
        });

        // Radar: Çevredeki oyuncuları algılama
        client.on('named_entity_spawn', (packet) => {
            io.emit('radar_update', { id: botId, entity: packet.playerName || "Oyuncu" });
        });

        // Tab Listesi
        client.on('player_info', (packet) => {
            io.emit('tab_update', { id: botId, data: packet });
        });

        client.on('end', (reason) => {
            io.emit('bot_status', { id: botId, status: 'Offline' });
            io.emit('terminal_log', { id: botId, msg: `[Sistem] Bot düştü: ${reason}. Auto-reconnect 10s...` });
            delete activeBots[botId];
            delete botTimers[botId];
            
            // Auto Reconnect
            if(data.autoReconnect) {
                setTimeout(() => startBot(botId), 10000);
            }
        });

        client.on('error', (err) => {
            io.emit('terminal_log', { id: botId, msg: `[Hata] ${err.message}` });
        });

    } catch (err) {
        console.error("Bot başlatılamadı:", err);
    }
}

function stopBot(botId) {
    if (activeBots[botId]) {
        activeBots[botId].end('Kullanıcı tarafından kapatıldı');
        delete activeBots[botId];
        delete botTimers[botId];
        io.emit('bot_status', { id: botId, status: 'Offline' });
    }
}

// Socket.io Haberleşmesi (Dinamik Web Paneli)
io.on('connection', (socket) => {
    socket.emit('init_data', botsData); // Panele güncel verileri yolla
    socket.emit('active_bots', Object.keys(activeBots));

    // Yeni Bot Ekleme/Güncelleme
    socket.on('save_bot', (data) => {
        botsData[data.id] = data;
        saveData(); // JSON'a kaydet
        io.emit('init_data', botsData);
    });

    // Tekil Bot Kontrolleri
    socket.on('start_bot', (botId) => startBot(botId));
    socket.on('stop_bot', (botId) => stopBot(botId));

    // Tümünü Kontrol Etme
    socket.on('start_all', () => {
        Object.keys(botsData).forEach(botId => startBot(botId));
    });
    socket.on('stop_all', () => {
        Object.keys(activeBots).forEach(botId => stopBot(botId));
    });

    // Terminalden Komut Gönderme (Tekil veya Tümüne)
    socket.on('send_command', (data) => {
        const { target, command } = data; // target: 'all' veya botId
        if (target === 'all') {
            Object.values(activeBots).forEach(client => {
                if (client.state === 'play') client.write('chat', { message: command });
            });
            io.emit('terminal_log', { id: 'all', msg: `[Global] > ${command}` });
        } else {
            if (activeBots[target] && activeBots[target].state === 'play') {
                activeBots[target].write('chat', { message: command });
                io.emit('terminal_log', { id: target, msg: `[${target}] > ${command}` });
            }
        }
    });

    // Uptime (Kaç saat/dakika oyunda) verisini 5 saniyede bir panele yolla
    setInterval(() => {
        const uptimes = {};
        for(let id in botTimers) {
            const diff = Date.now() - botTimers[id];
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            uptimes[id] = `${hours}s ${minutes}dk`;
        }
        socket.emit('uptime_update', uptimes);
    }, 5000);
});

server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
