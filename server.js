const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mc = require('minecraft-protocol');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const bots = {}; // Aktif botları tutacağımız obje
const afkIntervals = {}; // AFK koruması döngüleri

io.on('connection', (socket) => {
    console.log('Yeni web arayüzü bağlandı.');

    // Yeni Bot Ekleme
    socket.on('startBot', (data) => {
        const { host, port, username } = data;
        
        if (bots[username]) {
            socket.emit('botLog', { username, msg: 'Uyarı: Bu bot zaten aktif!' });
            return;
        }

        try {
            const client = mc.createClient({
                host: host,
                port: port || 25565,
                username: username,
                version: '1.21.11' // Belirtilen sürüm
            });

            bots[username] = client;
            io.emit('botStatus', { username, status: 'connecting' });

            client.on('login', () => {
                io.emit('botStatus', { username, status: 'online' });
                io.emit('botLog', { username, msg: 'Sunucuya başarıyla giriş yapıldı.' });
            });

            // Gelen mesajları arayüze aktarma (Sistem logları veya sohbet)
            client.on('systemChat', (packet) => {
                try {
                    const msg = JSON.parse(packet.content).text || 'Sistem Mesajı';
                    io.emit('botLog', { username, msg: `[Sunucu]: ${msg}` });
                } catch (e) {}
            });

            client.on('end', (reason) => {
                io.emit('botStatus', { username, status: 'offline' });
                io.emit('botLog', { username, msg: `Bağlantı kesildi: ${reason}` });
                stopAfk(username);
                delete bots[username];
            });

            client.on('error', (err) => {
                io.emit('botStatus', { username, status: 'error' });
                io.emit('botLog', { username, msg: `Hata: ${err.message}` });
                stopAfk(username);
                delete bots[username];
            });

        } catch (err) {
            console.error('Bot başlatılırken hata:', err);
        }
    });

    // Bota özel komut gönderme
    socket.on('sendCommand', ({ username, command }) => {
        const client = bots[username];
        if (!client) return;

        io.emit('botLog', { username, msg: `> ${command}` });

        if (command.startsWith('/')) {
            // 1.21+ sürümleri için komut gönderme paketi
            client.write('chat_command', {
                command: command.substring(1),
                timestamp: BigInt(Date.now()),
                salt: 0n,
                argument_signatures: [],
                signed_preview: false,
                message_count: 0,
                acknowledged: Buffer.alloc(3),
                previous_messages: []
            });
        } else {
            // Normal sohbet paketi (1.21.11 yapısına göre ayarlanabilir)
            client.write('chat_message', {
                message: command,
                timestamp: BigInt(Date.now()),
                salt: 0n,
                signature: Buffer.alloc(0),
                message_count: 0,
                acknowledged: Buffer.alloc(3),
                previous_messages: []
            });
        }
    });

    // Bota özel AFK korumasını (Kafa çevirme/Hareket) aç/kapat
    socket.on('toggleAfk', ({ username, state }) => {
        if (state) {
            startAfk(username);
            io.emit('botLog', { username, msg: 'AFK Koruması AKTİF edildi.' });
        } else {
            stopAfk(username);
            io.emit('botLog', { username, msg: 'AFK Koruması KAPATILDI.' });
        }
    });

    // Seçili botu sunucudan çıkar
    socket.on('stopBot', (username) => {
        if (bots[username]) {
            bots[username].end("Arayüzden kapatıldı");
        }
    });

    // Tüm botları tek seferde kapat
    socket.on('stopAll', () => {
        Object.keys(bots).forEach(username => {
            bots[username].end("Tüm botlar durduruldu");
        });
    });

    function startAfk(username) {
        if (!bots[username] || afkIntervals[username]) return;
        let yaw = 0;
        afkIntervals[username] = setInterval(() => {
            if (bots[username]) {
                yaw = (yaw + 15) % 360;
                // Botun atılmaması için sahte kafa çevirme paketi yolluyoruz
                bots[username].write('look', {
                    yaw: yaw,
                    pitch: 0,
                    onGround: true
                });
            }
        }, 5000); // 5 saniyede bir tetiklenir
    }

    function stopAfk(username) {
        if (afkIntervals[username]) {
            clearInterval(afkIntervals[username]);
            delete afkIntervals[username];
        }
    }
});

server.listen(3000, () => {
    console.log('Bot Kontrol Paneli başlatıldı: http://localhost:3000');
});
