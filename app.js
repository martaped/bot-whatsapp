//const qrcode = require('qrcode-terminal');
const qrcode = require('qrcode');

sock.ev.on('connection.update', async (update) => {
    const { qr } = update;
    if (qr) {
        // Genera el QR como imagen
        const qrImage = await qrcode.toDataURL(qr);
        
        // Envía el QR a tu número de WhatsApp (reemplaza con tu número en formato internacional)
        const miNumero = '5493547641471@s.whatsapp.net';
        await sock.sendMessage(miNumero, { image: { url: qrImage }, caption: 'Escanea este QR para conectar el bot.' });

        console.log('📤 QR enviado a tu WhatsApp.');
    }
});

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const main = async () => {
    console.log("Iniciando el bot...");

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
    });

    // Evento para manejar la conexión
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("Reconectando...");
                main();
            } else {
                console.log("Sesión cerrada. Escanea el QR nuevamente.");
            }
        } else if (connection === 'open') {
            console.log("✅ Conectado a WhatsApp");
        }
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
    });
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const message = messages[0]; 
        if (!message) return;
    
        console.log("📥 Mensaje recibido:", message);
    
        if (!message.message) return;
        if (!message.key.remoteJid) return;
        if (message.key.fromMe) {
            console.log("⚠️ Mensaje enviado por el bot. Ignorado.");
            return;
        }
    
        const remoteJid = message.key.remoteJid;
    
        let msgText = "";
        if (message.message.conversation) {
            msgText = message.message.conversation;
        } else if (message.message.extendedTextMessage) {
            msgText = message.message.extendedTextMessage.text;
        } else if (message.message.imageMessage?.caption) {
            msgText = message.message.imageMessage.caption;
        } else if (message.message.videoMessage?.caption) {
            msgText = message.message.videoMessage.caption;
        }
    
        msgText = msgText?.toLowerCase().trim();
        console.log("📝 Texto del mensaje:", msgText || "⚠️ [VACÍO]");
    
        if (!msgText) return;
    
        console.log("📩 Mensaje recibido:", msgText);
    
        if (/\b(hola|informaci|info)\b/i.test(msgText)) {
            const menu = `👋 ¡Hola! ¿Cómo puedo ayudarte hoy?  
            
    1️⃣ Ver productos  
    2️⃣ Consultar precios  
    3️⃣ Horarios de atención  
    4️⃣ Ubicación  
    5️⃣ Contactar con un asesor  
    
    Responde con el número de la opción que deseas.`;
            await sock.sendMessage(remoteJid, { text: menu });
            return;
        }
    
        const opciones = {
            '1': '📦 Aquí puedes ver nuestros productos: [enlace o lista]',
            '2': '💰 Nuestros precios varían. ¿Sobre qué producto necesitas información?',
            '3': '🕒 Nuestro horario es de Lunes a Viernes de 9 AM a 6 PM.',
            '4': '📍 Nuestra ubicación es: [dirección o enlace a Google Maps]',
            '5': '📞 Para hablar con un asesor, envíanos un mensaje aquí: [contacto]'
        };
    
        if (opciones[msgText]) {
            await sock.sendMessage(remoteJid, { text: opciones[msgText] });
        } else {
 //           await sock.sendMessage(remoteJid, { text: '❌ Opción no válida. Por favor, elige un número del menú.' });
        }
    });

    sock.ev.on('creds.update', saveCreds);
};

main();
