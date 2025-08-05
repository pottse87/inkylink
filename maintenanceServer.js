const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = 3002;
const ALLOWED_PAGES = process.env.ALLOWED_PAGES ? process.env.ALLOWED_PAGES.split(",") : [];
let maintenanceMode = false;
const logsDir = "E:\\logs\\archive";

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

function logEvent(message) {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const filePath = path.join(logsDir, `maintenance-${timestamp}.log`);
    fs.writeFileSync(filePath, message, "utf8");
}

const wss = new WebSocket.Server({ port: PORT });

wss.on("connection", ws => {
    console.log("🔌 WebSocket client connected");
    ws.send(JSON.stringify({ type: "status", maintenance: maintenanceMode, allowedPages: ALLOWED_PAGES }));

    ws.on("message", msg => {
        try {
            const data = JSON.parse(msg);
            if (data.type === "toggle") {
                maintenanceMode = !!data.state;
                logEvent(`Maintenance mode set to ${maintenanceMode}`);
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "status", maintenance: maintenanceMode }));
                    }
                });
            }
            if (data.type === "setAllowed") {
                ALLOWED_PAGES.length = 0;
                ALLOWED_PAGES.push(...data.pages);
                logEvent(`Allowed pages updated: ${ALLOWED_PAGES.join(", ")}`);
            }
        } catch (err) {
            console.error("❌ WS Error:", err);
        }
    });
});

console.log(`✅ Maintenance WS Server running on port ${PORT}`);
