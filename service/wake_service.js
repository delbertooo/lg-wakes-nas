const Service = require('webos-service');
const dgram = require('dgram');

const service = new Service("de.delbertooo.app.wakenas.service");

service.register("wake", function(message) {
    const payload = message.payload;
    const mac = payload.mac;
    const ip = payload.ip || "255.255.255.255";
    const port = payload.port || 9;

    if (!mac) {
        message.respond({
            returnValue: false,
            errorText: "Missing MAC address parameter."
        });
        return;
    }

    try {
        // Clean MAC address (remove colons, dashes, and other characters)
        const cleanMac = mac.replace(/[^a-fA-F0-9]/ig, '');
        if (cleanMac.length !== 12) {
            message.respond({
                returnValue: false,
                errorText: "Invalid MAC address structure. Must be exactly 12 hex characters."
            });
            return;
        }

        // Create Magic Packet: 6 bytes of 0xFF followed by MAC repeated 16 times
        const macBuffer = Buffer.from(cleanMac, 'hex');
        const packet = Buffer.alloc(6 + 16 * 6);
        
        packet.fill(0xff, 0, 6);
        for (let i = 0; i < 16; i++) {
            macBuffer.copy(packet, 6 + i * 6);
        }

        // Send raw UDP broadcast packet
        const socket = dgram.createSocket('udp4');
        
        socket.bind(() => {
            socket.setBroadcast(true);
            socket.send(packet, 0, packet.length, port, ip, (err) => {
                socket.close();
                if (err) {
                    message.respond({
                        returnValue: false,
                        errorText: "UDP Send Fail: " + err.message
                    });
                } else {
                    message.respond({
                        returnValue: true,
                        message: `WOL magic packet sent broadcast to ${ip}:${port} for MAC ${mac}`
                    });
                }
            });
        });

        // Fail-safe error handling for socket binding
        socket.on('error', (err) => {
            try { socket.close(); } catch(e) {}
            message.respond({
                returnValue: false,
                errorText: "UDP Socket Binding Error: " + err.message
            });
        });

    } catch (e) {
        message.respond({
            returnValue: false,
            errorText: "Internal JS Service Exception: " + e.message
        });
    }
});
