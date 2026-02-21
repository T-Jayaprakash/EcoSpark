/**
 * notificationService.js
 * Simulates and sends notifications to supervisors via WhatsApp.
 */
const fs = require('fs');
const path = require('path');

// Mock database of supervisors for zones
const SUPERVISORS = {
    'MKCE_LID_01': { name: 'Raj Kumar', phone: '+917397139329', zone: 'Main Gate' },
    'MKCE_LID_02': { name: 'Ananth S', phone: '+918765432109', zone: 'Academic Block' },
    'MKCE_LID_03': { name: 'Deepak V', phone: '+917654321098', zone: 'Central Avenue' },
    'DEFAULT': { name: 'General Supervisor', phone: '+917397139329', zone: 'MKCE Campus' }
};

const NOTIFICATIONS_FILE = path.join(__dirname, '../../data/notifications.json');

// WhatsApp Config
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || 'your_apikey_here';

// Ensure data directory exists
if (!fs.existsSync(path.dirname(NOTIFICATIONS_FILE))) {
    fs.mkdirSync(path.dirname(NOTIFICATIONS_FILE), { recursive: true });
}

async function sendCriticalAlert(alertData) {
    const { lid_id, area, water_level_value, timestamp } = alertData;
    const supervisor = SUPERVISORS[lid_id] || SUPERVISORS['DEFAULT'];

    // Formatting for WhatsApp
    const message = `🚨 *ECOSPARK CRITICAL*\n\n*Lid:* ${lid_id}\n*Area:* ${area}\n*Status:* ${water_level_value}% Capacity\n*Time:* ${new Date(timestamp).toLocaleTimeString()}\n\n_Immediate action required._`;

    console.log(`[NotificationService] Sending WhatsApp to ${supervisor.name}: ${message}`);

    // --- REAL WHATSAPP SENDING ---
    if (WHATSAPP_API_KEY !== 'your_apikey_here') {
        try {
            const url = `https://api.callmebot.com/whatsapp.php?phone=${supervisor.phone.replace('+', '')}&text=${encodeURIComponent(message)}&apikey=${WHATSAPP_API_KEY}`;

            const response = await fetch(url);
            if (response.ok) {
                console.log(`✅ WhatsApp message sent to ${supervisor.name}`);
            } else {
                console.error(`❌ WhatsApp API Error: ${response.statusText}`);
            }
        } catch (err) {
            console.error(`❌ WhatsApp Network Error: ${err.message}`);
        }
    } else {
        console.log(`ℹ️ WhatsApp API Key missing. Skipping real message.`);
    }

    // Save to file for the mobile simulator
    saveToHistory({
        from: 'EcoSpark System',
        to: supervisor.phone,
        supervisorName: supervisor.name,
        message: message.replace(/\*/g, ''), // Clean markdown for simulator
        lid_id,
        area
    });

    return { success: true, supervisor };
}

function saveToHistory(entry) {
    try {
        const notifications = fs.existsSync(NOTIFICATIONS_FILE) ? JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8')) : [];
        notifications.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...entry
        });
        if (notifications.length > 20) notifications.splice(20);
        fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
    } catch (e) {
        console.error("History Save Error:", e);
    }
}

async function getNotifications() {
    if (!fs.existsSync(NOTIFICATIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8'));
}

module.exports = { sendCriticalAlert, getNotifications };
