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

app.use(express.static(path.join(__dirname, 'public')));

let botsData = {};
if (fs.existsSync(DATA_FILE)) {
    try {
        botsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch(e) {
        botsData = {};
    }
}

const activeBots = {};
const botTimers = {};

function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(botsData, null, 2));
}

// 1.20+ Sürümlerinde socketClosed Hatasını Önleyen Güvenli Komut/Mesaj Gönderici
function sendMCMessage(client, botId, message) {
    if (!client || client.state !== 'play') return;

    if (message.startsWith('/')) {
        const cmd = message.slice(1); // Baştaki '/' işaretini kaldır
        try {
            // Modern 1.19+ / 1.20+ / 1.21 Chat Command Paketi
            client.write('chat_command', {
                command: cmd,
                timestamp: BigInt(Date.now()),
                salt: 0n,
                argumentSignatures: [],
                signedPreview: false,
                messageCount: 0,
                acknowledged: Buffer.alloc(3)
            });
        } catch (err) {
            // Eski sürümler için fallback
            try {
                client.write('chat', { message: message });
            } catch (e) {
                io.emit('terminal_log', { id: botId, msg: `[Hata] Komut gönderilemedi: ${e.message}`, type: 'error' });
            }
        }
    } else {
        try {
            client.write('chat', { message: message });
        } catch (err) {
            try {
                client.write('chat_message', {
                    message: message,
                    timestamp: BigInt(Date.now()),
                    salt: 0n,
                    offset: 0,
                    acknowledged: Buffer.alloc(3)
                });
            } catch (e) {
                io.emit('terminal_log', { id: botId, msg: `[Hata] Mesaj gönderilemedi: ${e.message}`, type: 'error' });
            }
        }
    }
}

function startBot(botId) {
    if (activeBots[botId]) return;

    const data = botsData[botId];
    if (!data || !data.ip) return;

    try {
        io.emit('terminal_log', { id: botId, msg: `[Sistem] Sunucuya bağlanılıyor (${data.ip})...`, type: 'info' });

        const client = mc.createClient({
            host: data.ip.split(':')[0],
            port: parseInt(data.ip.split(':')[1]) || 25565,
            version: data.version || false,
            username: data.login || `Bot_${Math.floor(Math.random()*1000)}`,
            auth: 'offline'
        });

        activeBots[botId] = client;
        botTimers[botId] = Date.now();

        client.on('login', () => {
            io.emit('bot_status', { id: botId, status: 'Online' });
            io.emit('terminal_log', { id: botId, msg: `[Sistem] Başarıyla giriş yapıldı!`, type: 'success' });

            // Alt sunucu geçişi (/gir komutu)
            if (data.subServer) {
                setTimeout(() => {
                    io.emit('terminal_log', { id: botId, msg: `[Sistem] Alt sunucuya geçiliyor: /gir ${data.subServer}`, type: 'info' });
                    sendMCMessage(client, botId, `/gir ${data.subServer}`);
                }, 2500);
            }

            // AFK Hareketi
            const afkInterval = setInterval(() => {
                if (client.state === 'play') {
                    try {
                        client.write('look', {
                            yaw: Math.floor(Math.random() * 360) - 180,
                            pitch: Math.floor(Math.random() * 40) - 20,
                            onGround: true
                        });
                    } catch(e){}
                } else {
                    clearInterval(afkInterval);
                }
            }, 5000);
        });

        // Sohbet Dinleyici
        client.on('chat', (packet) => {
            try {
                let msg = '';
                if (packet.message) {
                    const parsed = JSON.parse(packet.message);
                    msg = parsed.text || parsed.value || (parsed.extra ? parsed.extra.map(e => e.text).join('') : '');
                }
                if (msg) io.emit('terminal_log', { id: botId, msg: `[Shat] ${msg}`, type: 'chat' });
            } catch(e) {}
        });

        // Radar & Player Spawns
        client.on('named_entity_spawn', (packet) => {
            io.emit('radar_update', { id: botId, entity: packet.playerName || `Entity_${packet.entityId}` });
        });

        client.on('end', (reason) => {
            io.emit('bot_status', { id: botId, status: 'Offline' });
            io.emit('terminal_log', { id: botId, msg: `[Sistem] Bağlantı kesildi: ${reason}. 10sn sonra tekrar denenecek.`, type: 'warn' });
            delete activeBots[botId];
            delete botTimers[botId];

            if (data.autoReconnect !== false) {
                setTimeout(() => startBot(botId), 10000);
            }
        });

        client.on('error', (err) => {
            io.emit('terminal_log', { id: botId, msg: `[Hata] ${err.message}`, type: 'error' });
        });

    } catch (err) {
        io.emit('terminal_log', { id: botId, msg: `[Hata] Başlatma hatası: ${err.message}`, type: 'error' });
    }
}

function stopBot(botId) {
    if (activeBots[botId]) {
        activeBots[botId].end('Kullanıcı kapattı');
        delete activeBots[botId];
        delete botTimers[botId];
        io.emit('bot_status', { id: botId, status: 'Offline' });
    }
}

io.on('connection', (socket) => {
    socket.emit('init_data', botsData);
    socket.emit('active_bots', Object.keys(activeBots));

    socket.on('save_bot', (data) => {
        botsData[data.id] = { ...botsData[data.id], ...data };
        saveData();
        io.emit('init_data', botsData);
    });

    socket.on('delete_bot', (botId) => {
        stopBot(botId);
        delete botsData[botId];
        saveData();
        io.emit('init_data', botsData);
    });

    socket.on('start_bot', (botId) => startBot(botId));
    socket.on('stop_bot', (botId) => stopBot(botId));

    socket.on('start_all', () => {
        Object.keys(botsData).forEach(botId => startBot(botId));
    });

    socket.on('stop_all', () => {
        Object.keys(activeBots).forEach(botId => stopBot(botId));
    });

    socket.on('send_command', (data) => {
        const { target, command } = data;
        if (target === 'all') {
            Object.keys(activeBots).forEach(id => sendMCMessage(activeBots[id], id, command));
            io.emit('terminal_log', { id: 'all', msg: `[Global Komut] > ${command}`, type: 'info' });
        } else {
            sendMCMessage(activeBots[target], target, command);
            io.emit('terminal_log', { id: target, msg: `[Komut] > ${command}`, type: 'info' });
        }
    });

    setInterval(() => {
        const uptimes = {};
        for (let id in botTimers) {
            const diff = Date.now() - botTimers[id];
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            uptimes[id] = `${hours}s ${minutes}d ${seconds}s`;
        }
        socket.emit('uptime_update', uptimes);
    }, 1000);
});

server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
