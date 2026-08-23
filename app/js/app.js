(function () {
    // Configuration storage keys
    const STORAGE_KEY_MAC = 'wakenas_mac';
    const STORAGE_KEY_IP = 'wakenas_ip';
    const STORAGE_KEY_PORT = 'wakenas_port';

    // UI elements
    const wakingView = document.getElementById('waking-view');
    const settingsView = document.getElementById('settings-view');

    // Countdown / status elements
    const wakeStatus = document.getElementById('wake-status');
    const wakeDetails = document.getElementById('wake-details');
    const countdownBar = document.getElementById('countdown-bar');

    // Input fields
    const macInput = document.getElementById('mac-input');
    const ipInput = document.getElementById('ip-input');
    const portInput = document.getElementById('port-input');

    // Buttons
    const btnEdit = document.getElementById('btn-edit');
    const btnCloseNow = document.getElementById('btn-close-now');
    const btnSave = document.getElementById('btn-save');
    const btnCancel = document.getElementById('btn-cancel');

    // Execution variables
    let countdownInterval = null;
    let autoCloseTimeout = null;
    const COUNTDOWN_SECONDS = 3;

    // Focus state management for Remote spatial navigation
    let focusableElements = [];
    let currentFocusIndex = 0;

    function init() {
        // Form input autocorrection for easy remote typing
        macInput.addEventListener('input', function(e) {
            // Clean value of non-hex characters
            let val = e.target.value.replace(/[^a-fA-F0-9]/ig, '').toLowerCase();
            // Automatically insert colons for visual convenience
            if (val.length > 0) {
                let formatted = val.match(/.{1,2}/g).join(':');
                e.target.value = formatted.slice(0, 17); // Max length with 5 colons
            }
        });

        // Set button actions
        btnEdit.addEventListener('click', abortAndEdit);
        btnCloseNow.addEventListener('click', closeApp);
        btnSave.addEventListener('click', saveConfiguration);
        btnCancel.addEventListener('click', cancelSettings);

        // Bind keyboard D-pad event listeners
        document.addEventListener('keydown', handleKeyDown);

        // Determine view state based on existing configuration
        const savedMac = getCleanMac();
        if (savedMac) {
            startWakeFlow();
        } else {
            showSettingsView();
        }
    }

    // Helper to get sanitized MAC address
    function getCleanMac() {
        const rawMac = localStorage.getItem(STORAGE_KEY_MAC) || '';
        return rawMac.replace(/[^a-fA-F0-9]/ig, '').toLowerCase();
    }

    // Standard local storage gets with defaults
    function getIP() {
        return localStorage.getItem(STORAGE_KEY_IP) || '255.255.255.255';
    }

    function getPort() {
        return localStorage.getItem(STORAGE_KEY_PORT) || '9';
    }

    // ----------------------------------------------------
    // State Transitions
    // ----------------------------------------------------

    function startWakeFlow() {
        wakingView.classList.remove('hidden');
        settingsView.classList.add('hidden');

        setFocusGroup([btnEdit, btnCloseNow]);

        const mac = getCleanMac();
        const ip = getIP();
        const port = getPort();

        // Format MAC visually (AA:BB:CC:DD:EE:FF)
        const formattedMac = mac.match(/.{1,2}/g).join(':').toUpperCase();
        wakeDetails.textContent = `Target: ${formattedMac} | IP: ${ip} | Port: ${port}`;
        wakeStatus.textContent = "Sending Wake-on-LAN Magic Packet...";

        // Send WOL command via JavaScript service
        sendWolPacket(formattedMac, ip, port);
    }

    function sendWolPacket(mac, ip, port) {
        if (typeof webOS === 'undefined' || !webOS.service) {
            wakeStatus.textContent = "Service unavailable (Running outside webOS TV?)";
            // Wait anyway so user can see/interact with UI locally
            runCountdown(3000);
            return;
        }

        webOS.service.request("luna://de.delbertooo.app.wakenas.service", {
            method: "wake",
            parameters: {
                mac: mac,
                ip: ip,
                port: parseInt(port, 10)
            },
            onSuccess: function (response) {
                wakeStatus.textContent = "WOL magic packet sent successfully!";
                runCountdown(3000);
            },
            onFailure: function (error) {
                wakeStatus.textContent = "Error: " + (error.errorText || "Could not broadcast packet.");
                wakeStatus.classList.add('error-text');
                // Don't auto-close immediately if it failed, give user time to read or edit
                runCountdown(6000);
            }
        });
    }

    function runCountdown(durationMs) {
        clearCountdown();
        
        let timeLeft = durationMs;
        const intervalStep = 50; // smooth 20fps transition
        
        countdownInterval = setInterval(() => {
            timeLeft -= intervalStep;
            if (timeLeft <= 0) {
                clearCountdown();
                countdownBar.style.width = '0%';
                closeApp();
            } else {
                const percentage = (timeLeft / durationMs) * 100;
                countdownBar.style.width = percentage + '%';
            }
        }, intervalStep);
    }

    function clearCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }

    function abortAndEdit() {
        clearCountdown();
        showSettingsView();
    }

    function showSettingsView() {
        wakingView.classList.add('hidden');
        settingsView.classList.remove('hidden');

        // Populate values
        const currentMac = localStorage.getItem(STORAGE_KEY_MAC) || '';
        macInput.value = currentMac;
        ipInput.value = localStorage.getItem(STORAGE_KEY_IP) || '';
        portInput.value = localStorage.getItem(STORAGE_KEY_PORT) || '';

        // Register focusables in settings screen
        setFocusGroup([macInput, ipInput, portInput, btnSave, btnCancel]);
        focusableElements[currentFocusIndex].focus();
    }

    function saveConfiguration() {
        const cleanedMac = macInput.value.replace(/[^a-fA-F0-9]/ig, '').toLowerCase();
        if (cleanedMac.length !== 12) {
            alert("Error: Please enter a valid 12-character MAC Address.");
            macInput.focus();
            return;
        }

        const ipVal = ipInput.value.trim() || '255.255.255.255';
        const portVal = portInput.value.trim() || '9';

        // Save
        localStorage.setItem(STORAGE_KEY_MAC, cleanedMac.match(/.{1,2}/g).join(':').toUpperCase());
        localStorage.setItem(STORAGE_KEY_IP, ipVal);
        localStorage.setItem(STORAGE_KEY_PORT, portVal);

        // Trigger immediate wake sequence
        startWakeFlow();
    }

    function cancelSettings() {
        const savedMac = getCleanMac();
        if (savedMac) {
            startWakeFlow();
        } else {
            // Nothing configured and they cancel, close the app
            closeApp();
        }
    }

    function closeApp() {
        clearCountdown();
        if (typeof window !== 'undefined' && window.close) {
            window.close();
        }
    }

    // ----------------------------------------------------
    // Spatial D-Pad Navigation & Keyboard Control
    // ----------------------------------------------------

    function setFocusGroup(elements) {
        // Clear old focus state
        focusableElements.forEach(el => el.classList.remove('focused'));
        
        focusableElements = elements;
        currentFocusIndex = 0;
        
        if (focusableElements.length > 0) {
            focusableElements[currentFocusIndex].focus();
            focusableElements[currentFocusIndex].classList.add('focused');
        }
    }

    function handleKeyDown(e) {
        if (focusableElements.length === 0) return;

        let nextIndex = currentFocusIndex;

        switch (e.key) {
            case 'ArrowDown':
            case 'Down':
                e.preventDefault();
                nextIndex = (currentFocusIndex + 1) % focusableElements.length;
                break;
            case 'ArrowUp':
            case 'Up':
                e.preventDefault();
                nextIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
                break;
            case 'ArrowLeft':
            case 'Left':
                // Allow left-right shifting specifically inside settings buttons row
                if (focusableElements[currentFocusIndex] === btnSave) {
                    nextIndex = focusableElements.indexOf(btnCancel);
                } else if (focusableElements[currentFocusIndex] === btnCancel) {
                    nextIndex = focusableElements.indexOf(btnSave);
                } else if (focusableElements[currentFocusIndex] === btnEdit) {
                    nextIndex = focusableElements.indexOf(btnCloseNow);
                } else if (focusableElements[currentFocusIndex] === btnCloseNow) {
                    nextIndex = focusableElements.indexOf(btnEdit);
                }
                break;
            case 'ArrowRight':
            case 'Right':
                if (focusableElements[currentFocusIndex] === btnSave) {
                    nextIndex = focusableElements.indexOf(btnCancel);
                } else if (focusableElements[currentFocusIndex] === btnCancel) {
                    nextIndex = focusableElements.indexOf(btnSave);
                } else if (focusableElements[currentFocusIndex] === btnEdit) {
                    nextIndex = focusableElements.indexOf(btnCloseNow);
                } else if (focusableElements[currentFocusIndex] === btnCloseNow) {
                    nextIndex = focusableElements.indexOf(btnEdit);
                }
                break;
            case 'Enter':
                // standard click emulation
                const active = focusableElements[currentFocusIndex];
                if (active.tagName !== 'INPUT') {
                    active.click();
                } else {
                    // Enter on input moves focus to next input field
                    e.preventDefault();
                    nextIndex = (currentFocusIndex + 1) % focusableElements.length;
                }
                break;
            case 'Back':
            case 'Backspace':
            case 'Escape':
                // Handle backing out of settings or app
                if (!wakingView.classList.contains('hidden')) {
                    e.preventDefault();
                    closeApp();
                } else {
                    e.preventDefault();
                    cancelSettings();
                }
                break;
        }

        if (nextIndex !== currentFocusIndex) {
            focusableElements[currentFocusIndex].classList.remove('focused');
            currentFocusIndex = nextIndex;
            focusableElements[currentFocusIndex].focus();
            focusableElements[currentFocusIndex].classList.add('focused');
        }
    }

    // Fire application
    window.onload = init;
})();
