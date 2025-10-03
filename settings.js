const fs = require('fs');
const path = require('path');

class SettingsManager {
    constructor() {
        this.settingsFile = './data/settings.json';
        this.defaultSettings = {
            prefix: '.',
            owner: '94701234567@s.whatsapp.net', // Change this
            botName: 'KEVO-MD',
            autotype: 'off',
            autoread: true,
            antibadword: false,
            welcome: true,
            // Add more settings as needed
        };
        this.loadSettings();
    }

    loadSettings() {
        try {
            if (fs.existsSync(this.settingsFile)) {
                const data = fs.readFileSync(this.settingsFile, 'utf8');
                this.settings = { ...this.defaultSettings, ...JSON.parse(data) };
            } else {
                this.settings = this.defaultSettings;
                this.saveSettings();
            }
        } catch (error) {
            this.settings = this.defaultSettings;
        }
    }

    saveSettings() {
        try {
            const dir = path.dirname(this.settingsFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        return true;
    }

    // Get current prefix
    getPrefix() {
        return this.settings.prefix;
    }

    // Check if user is owner
    isOwner(jid) {
        return jid === this.settings.owner;
    }
}

module.exports = SettingsManager;
