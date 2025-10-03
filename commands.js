const SettingsManager = require('./settings.js');

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.settings = bot.settings;
        this.commands = new Map();
        this.initializeCommands();
    }

    initializeCommands() {
        // Settings Commands
        this.commands.set('setprefix', {
            handler: this.setPrefix.bind(this),
            usage: 'current_prefix setprefix <new_prefix>',
            example: '. setprefix !',
            description: 'Change bot prefix'
        });

        this.commands.set('autotype', {
            handler: this.autoType.bind(this),
            usage: 'prefix autotype <all/pm/group/off>',
            example: '. autotype group',
            description: 'Enable/disable auto typing'
        });

        this.commands.set('owner', {
            handler: this.owner.bind(this),
            usage: 'prefix owner',
            example: '. owner',
            description: 'Show bot owner'
        });

        this.commands.set('menu', {
            handler: this.menu.bind(this),
            usage: 'prefix menu',
            example: '. menu',
            description: 'Show all commands'
        });

        // Download Commands
        this.commands.set('tiktok', {
            handler: this.tiktokDownload.bind(this),
            usage: 'prefix tiktok <url>',
            example: '. tiktok https://tiktok.com/...',
            description: 'Download TikTok video'
        });

        this.commands.set('play', {
            handler: this.playSong.bind(this),
            usage: 'prefix play <song_name>',
            example: '. play shape of you',
            description: 'Search and play music'
        });

        // AI Commands
        this.commands.set('ai', {
            handler: this.aiChat.bind(this),
            usage: 'prefix ai <question>',
            example: '. ai what is AI?',
            description: 'Chat with AI'
        });

        this.commands.set('gemini', {
            handler: this.geminiAI.bind(this),
            usage: 'prefix gemini <prompt>',
            example: '. gemini explain quantum physics',
            description: 'Use Gemini AI'
        });

        // Group Management
        this.commands.set('kick', {
            handler: this.kickUser.bind(this),
            usage: 'prefix kick @user',
            example: '. kick @user',
            description: 'Kick user from group'
        });

        this.commands.set('promote', {
            handler: this.promoteUser.bind(this),
            usage: 'prefix promote @user',
            example: '. promote @user',
            description: 'Make user admin'
        });

        // Fun Commands
        this.commands.set('sticker', {
            handler: this.createSticker.bind(this),
            usage: 'prefix sticker (reply to image)',
            example: '. sticker',
            description: 'Create sticker from image'
        });

        this.commands.set('joke', {
            handler: this.tellJoke.bind(this),
            usage: 'prefix joke',
            example: '. joke',
            description: 'Get a random joke'
        });

        // Tools
        this.commands.set('ping', {
            handler: this.ping.bind(this),
            usage: 'prefix ping',
            example: '. ping',
            description: 'Check bot response time'
        });

        this.commands.set('runtime', {
            handler: this.runtime.bind(this),
            usage: 'prefix runtime',
            example: '. runtime',
            description: 'Show bot uptime'
        });

        // Add more commands here...
    }

    async handleMessage(message, sock) {
        try {
            const body = message.message.conversation || 
                        message.message.extendedTextMessage?.text || 
                        message.message.imageMessage?.caption || '';

            const prefix = this.settings.getPrefix();
            
            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            const fullArgs = args.join(' ');

            const cmd = this.commands.get(command);
            if (!cmd) return;

            await cmd.handler(message, sock, args, fullArgs);

        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    // ========== COMMAND HANDLERS ==========

    async setPrefix(message, sock, args, fullArgs) {
        if (!this.settings.isOwner(message.key.remoteJid)) {
            return sock.sendMessage(message.key.remoteJid, { 
                text: '❌ This command is for owner only!' 
            });
        }

        if (args.length === 0) {
            return sock.sendMessage(message.key.remoteJid, {
                text: `📝 Usage: ${this.settings.getPrefix()}setprefix <new_prefix>\nExample: ${this.settings.getPrefix()}setprefix !`
            });
        }

        const newPrefix = args[0];
        this.settings.set('prefix', newPrefix);
        
        await sock.sendMessage(message.key.remoteJid, {
            text: `✅ Prefix changed to: ${newPrefix}`
        });
    }

    async autoType(message, sock, args, fullArgs) {
        const usage = `📝 Usage: ${this.settings.getPrefix()}autotype <all/pm/group/off>\n\nOptions:\n• all - Enable everywhere\n• pm - Only in private chats\n• group - Only in groups\n• off - Disable auto typing`;

        if (args.length === 0) {
            const current = this.settings.get('autotype');
            return sock.sendMessage(message.key.remoteJid, {
                text: `🔄 Current auto type: ${current}\n\n${usage}`
            });
        }

        const option = args[0].toLowerCase();
        const validOptions = ['all', 'pm', 'group', 'off'];

        if (!validOptions.includes(option)) {
            return sock.sendMessage(message.key.remoteJid, { text: usage });
        }

        this.settings.set('autotype', option);
        await sock.sendMessage(message.key.remoteJid, {
            text: `✅ Auto type set to: ${option}`
        });
    }

    async owner(message, sock, args, fullArgs) {
        const owner = this.settings.get('owner').split('@')[0];
        await sock.sendMessage(message.key.remoteJid, {
            text: `👑 Bot Owner: ${owner}\n📞 Contact for support!`
        });
    }

    async menu(message, sock, args, fullArgs) {
        let menuText = `┏▣ ◈ *${this.settings.get('botName')}* ◈\n`;
        menuText += `┃ *ᴏᴡɴᴇʀ* : ${this.settings.get('owner').split('@')[0]}\n`;
        menuText += `┃ *ᴘʀᴇғɪx* : [ ${this.settings.getPrefix()} ]\n`;
        menuText += `┃ *ᴘʟᴜɢɪɴs* : ${this.commands.size}\n`;
        menuText += `┃ *ᴍᴏᴅᴇ* : Public\n`;
        menuText += `┗▣ \n\n`;

        // Group commands by category
        const categories = {
            '⚙️ SETTINGS': ['setprefix', 'autotype', 'owner'],
            '📥 DOWNLOAD': ['tiktok', 'play'],
            '🤖 AI': ['ai', 'gemini'],
            '👥 GROUP': ['kick', 'promote'],
            '🎉 FUN': ['sticker', 'joke'],
            '🔧 TOOLS': ['ping', 'runtime']
        };

        for (const [category, commands] of Object.entries(categories)) {
            menuText += `┏▣ ${category}\n`;
            commands.forEach(cmd => {
                const command = this.commands.get(cmd);
                if (command) {
                    menuText += `│➽ ${cmd}\n`;
                }
            });
            menuText += `┗▣ \n\n`;
        }

        menuText += `💡 Type: ${this.settings.getPrefix()}help <command> for more info!`;

        await sock.sendMessage(message.key.remoteJid, { text: menuText });
    }

    async ping(message, sock, args, fullArgs) {
        const start = Date.now();
        await sock.sendMessage(message.key.remoteJid, { text: '🏓 Pinging...' });
        const latency = Date.now() - start;
        
        await sock.sendMessage(message.key.remoteJid, {
            text: `✅ *PONG!*\n⏱️ Speed: ${latency}ms\n⚡ Status: Super Fast!`
        });
    }

    async runtime(message, sock, args, fullArgs) {
        const now = new Date();
        const uptime = now - this.bot.startTime;
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        
        await sock.sendMessage(message.key.remoteJid, {
            text: `⏰ *Runtime*\n📅 ${days}d ${hours}h ${minutes}m\n🚀 Since: ${this.bot.startTime.toLocaleString()}`
        });
    }

    // Placeholder for other commands - you can implement these
    async tiktokDownload(message, sock, args, fullArgs) {
        await sock.sendMessage(message.key.remoteJid, {
            text: '📥 TikTok downloader - Coming soon!\nUse: .play for music download'
        });
    }

    async playSong(message, sock, args, fullArgs) {
        if (args.length === 0) {
            return sock.sendMessage(message.key.remoteJid, {
                text: `🎵 Usage: ${this.settings.getPrefix()}play <song_name>\nExample: ${this.settings.getPrefix()}play shape of you`
            });
        }
        await sock.sendMessage(message.key.remoteJid, {
            text: `🔍 Searching: "${fullArgs}"\n⏳ This feature is being implemented...`
        });
    }

    async aiChat(message, sock, args, fullArgs) {
        if (args.length === 0) {
            return sock.sendMessage(message.key.remoteJid, {
                text: `🤖 Usage: ${this.settings.getPrefix()}ai <question>\nExample: ${this.settings.getPrefix()}ai what is artificial intelligence?`
            });
        }
        await sock.sendMessage(message.key.remoteJid, {
            text: `🧠 AI Response for: "${fullArgs}"\n\n🤔 Thinking... This feature requires AI API integration.`
        });
    }

    // Add other command handlers similarly...
}

module.exports = CommandHandler;
