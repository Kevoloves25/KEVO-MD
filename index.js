const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const SettingsManager = require('./handlers/settings.js');
const CommandHandler = require('./handlers/commands.js');

class KevoMD {
    constructor() {
        this.sock = null;
        this.settings = new SettingsManager();
        this.commandHandler = new CommandHandler(this);
        this.startTime = new Date();
    }

    async initialize() {
        console.log('🚀 Initializing KEVO-MD Bot...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        
        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            syncFullHistory: false
        });

        this.setupEventHandlers(saveCreds);
        console.log('✅ Bot initialized successfully!');
    }

    setupEventHandlers(saveCreds) {
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'close') {
                console.log('🔌 Connection closed, reconnecting...');
                this.initialize();
            } else if (connection === 'open') {
                console.log('✅ Connected to WhatsApp!');
            }
        });

        this.sock.ev.on('creds.update', saveCreds);

        // Message handler
        this.sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (!message.message || message.key.fromMe) return;
            
            await this.commandHandler.handleMessage(message, this.sock);
        });
    }
}

// Start the bot
const bot = new KevoMD();
bot.initialize().catch(console.error);
