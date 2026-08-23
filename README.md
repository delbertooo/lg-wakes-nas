# Wake My NAS (LG webOS TV App)

A lightweight, self-closing, OLED-optimized LG webOS TV application that broadcasts a Wake-on-LAN (WOL) magic packet to your NAS (or other local servers) and immediately returns to the TV Home Screen.

---

## 🌟 Features

* **Background Magic Broadcaster:** Uses a native, sandboxed Node.js background service (`dgram` and `Buffer`) to construct and send a raw UDP magic packet.
* **Auto-Closes in 3s:** Wakes the NAS, displays a 3-second visual feedback countdown bar, and exits automatically back to the Home Screen launcher.
* **Smart Hybrid Settings:**
  * Displays the configuration form automatically on first launch.
  * Allows you to press **[Edit Settings]** with the remote during subsequent countdowns to update device addresses.
  * Autocorrects and inserts colons in the MAC address field—simply type 12 alphanumeric characters (e.g. `001122334455`) on the TV remote!
* **10-Foot UI / OLED Optimized:** A high-contrast dark theme (pure black `#000000`) designed specifically to look gorgeous on LG OLED TVs (like the G4) and keep pixels resting. Features high-visibility GPU-accelerated spatial focus D-pad and Magic Remote pointer states.

---

## 📁 File Structure

```text
lg-wakes-nas/
├── README.md                  # This documentation
├── .gitignore                 # Configured Git ignore rules for build files
├── package.json               # Root build/sideload automation scripts
├── logo.svg                   # Standard vector SVG logo for the project
├── app/                       # webOS Web Application (Frontend UI)
│   ├── appinfo.json           # App manifest
│   ├── index.html             # UI HTML markup
│   ├── css/
│   │   └── style.css          # OLED-friendly black theme and focus styles
│   ├── js/
│   │   └── app.js             # Client logic and remote spatial navigation
│   ├── icon.png               # 80x80 App launcher icon
│   └── largeIcon.png          # 130x130 App detail icon
└── service/                   # webOS JavaScript Service (Backend)
    ├── package.json           # Node.js service descriptor
    ├── services.json          # Luna Bus method registration
    └── wake_service.js        # Node.js raw UDP magic packet broadcaster
```

---

## 🚀 How to Build & Sideload (Developer Mode)

### Prerequisites
1. **Node.js** installed on your development machine.
2. **webOS TV CLI Tools** (`@webos-tools/cli`) installed globally. You can install it via:
   ```bash
   npm install -g @webos-tools/cli
   ```

### 1. Enable Developer Mode on your LG G4 TV
1. Go to the LG Content Store / App Store on your TV, search for **Developer Mode**, and install the app.
2. Open the Developer Mode app, log in with your LG Developer Account, and toggle **Dev Mode Status** to **ON** (this will restart your TV).
3. Toggle **Key Server** to **ON** in the Dev Mode app.

### 2. Connect CLI to your TV
On your development machine:
1. Register your TV in the CLI:
   ```bash
   ares-setup-device
   ```
   * Choose `add`.
   * Device Name: `default` (or any name you prefer).
   * IP Address: Enter the IP shown in the TV's Developer Mode app.
   * Port: `9908` (Default).
   * SSH Port: `22` (Default).
2. Fetch the SSH key from the TV:
   ```bash
   ares-novacom --device default --getkey
   ```
   * *When prompted for a passphrase, enter the 6-character **Passphrase** shown on your TV's Developer Mode app (case sensitive).*
3. Verify connection:
   ```bash
   ares-device --system-info default
   ```

---

## 🛠️ Build and Deploy Commands

We've packaged the standard CLI lifecycle tasks into simple npm scripts:

| Command | Action |
|---|---|
| `npm run build` | Cleans old packages and bundles `app/` and `service/` into a single installable `.ipk` file. |
| `npm run install` | Deploys the packaged `.ipk` to your default TV device. |
| `npm run launch` | Launches the "Wake My NAS" app on your TV screen. |
| `npm run close` | Force closes the app from your TV screen. |
| `npm run all` | Bundles, installs, and launches the app in one single step! |

### Quick Deploy:
Simply run:
```bash
npm run all
```

---

## ⚙️ Configuration & Customization

### First-Time Configuration
1. When you first launch the app on your TV, it will open directly to the **WOL Configuration** page.
2. Enter your NAS details:
   * **MAC Address:** 12 alphanumeric characters (e.g. `708bcd89ef01`). Colons are auto-inserted.
   * **Broadcast IP Address:** (Optional) Defaults to `255.255.255.255`. If your router isolates subnet broadcasts, you can specify your subnet broadcast (e.g. `192.168.1.255`).
   * **UDP Port:** (Optional) Defaults to `9`. Some machines listen on `7`.
3. Click **[Save & Wake]** (focused by default).
4. On future launches, the app will instantly broadcast the packet and close back to the Home Screen within 3 seconds!

### Modifying Settings
To change settings at any time:
1. Open the app from your TV Home Screen.
2. Press **[Edit Settings]** using your remote before the 3-second timer expires.
3. Make changes and click **[Save & Wake]**.
