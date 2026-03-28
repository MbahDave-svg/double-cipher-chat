const FIXED_KEY = 10;

// Encrypt with Caesar cipher
function caesarEncrypt(text, shift) {
    let result = "";

    for (let i = 0; i < text.length; i++) {
        let char = text[i];

        if (char >= "A" && char <= "Z") {
            result += String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
        } else if (char >= "a" && char <= "z") {
            result += String.fromCharCode(((char.charCodeAt(0) - 97 + shift) % 26) + 97);
        } else {
            result += char;
        }
    }

    return result;
}

// Decrypt with Caesar cipher
function caesarDecrypt(text, shift) {
    return caesarEncrypt(text, 26 - shift);
}

// Register a new user
async function registerUser() {
    const username = document.getElementById("username").value.trim();
    const statusBox = document.getElementById("registerStatus");

    if (!username) {
        statusBox.innerText = "Please enter a username.";
        return;
    }

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: username })
        });

        const data = await response.json();

        if (!response.ok) {
            statusBox.innerText = data.message || "Registration failed.";
            return;
        }

        localStorage.setItem("currentUser", username);
        statusBox.innerText = data.message;
    } catch (error) {
        statusBox.innerText = "Registration error: " + error.message;
    }
}

// Initialize chat page
function initChatPage() {
    const currentUser = localStorage.getItem("currentUser");
    const label = document.getElementById("currentUserLabel");

    if (label) {
        label.innerText = currentUser || "Not set";
    }

    loadUsers();
    fetchMessages();
}

// Load all users
async function loadUsers() {
    const userList = document.getElementById("userList");
    if (!userList) return;

    const currentUser = localStorage.getItem("currentUser");

    try {
        const response = await fetch("/users");
        const users = await response.json();

        userList.innerHTML = "";

        users.forEach(user => {
            if (user !== currentUser) {
                const div = document.createElement("div");
                div.className = "user-item";
                div.innerText = user;
                div.onclick = () => {
                    document.getElementById("receiver").value = user;
                };
                userList.appendChild(div);
            }
        });

        if (userList.innerHTML.trim() === "") {
            userList.innerHTML = "<div class='user-item'>No other registered users yet.</div>";
        }
    } catch (error) {
        userList.innerHTML = "<div class='user-item'>Error loading users.</div>";
    }
}

// Send message with double encryption
async function sendMessage() {
    const sender = localStorage.getItem("currentUser");
    const receiver = document.getElementById("receiver").value.trim();
    const message = document.getElementById("messageInput").value.trim();
    const sendKeyInput = document.getElementById("sendKey");
    const sendStatus = document.getElementById("sendStatus");
    const previewBox = document.getElementById("encryptionPreview");

    if (!sender || !receiver || !message) {
        sendStatus.innerText = "Please fill all fields.";
        return;
    }

    if (!sendKeyInput || sendKeyInput.value.trim() === "") {
        sendStatus.innerText = "Please enter sender key.";
        return;
    }

    let key1 = parseInt(sendKeyInput.value.trim(), 10);

    if (isNaN(key1) || key1 < 1 || key1 > 25) {
        sendStatus.innerText = "Sender key must be between 1 and 25.";
        return;
    }

    // 🔐 STEP 1: First encryption (user key)
    const firstEncryption = caesarEncrypt(message, key1);

    // 🔐 STEP 2: Second encryption (fixed key = 10)
    const finalEncryption = caesarEncrypt(firstEncryption, FIXED_KEY);

    // ✅ SHOW PREVIEW TO SENDER
    previewBox.innerText =
        `Original: ${message}\n` +
        `After Key (${key1}): ${firstEncryption}\n` +
        `After Key 10 (Final): ${finalEncryption}`;

    try {
        const response = await fetch("/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sender: sender,
                receiver: receiver,
                encrypted_message: finalEncryption
            })
        });

        const data = await response.json();

        if (!response.ok) {
            sendStatus.innerText = data.message || "Message sending failed.";
            return;
        }

        sendStatus.innerText = "Message sent with double encryption.";
        document.getElementById("messageInput").value = "";

    } catch (error) {
        sendStatus.innerText = "Send error: " + error.message;
    }
}
// Fetch and decrypt messages
async function fetchMessages() {
    const currentUser = localStorage.getItem("currentUser");
    const messagesBox = document.getElementById("messagesBox");

    if (!messagesBox) return;

    if (!currentUser) {
        messagesBox.innerHTML = "<div class='message'>No logged in user found.</div>";
        return;
    }

    try {
        const response = await fetch(`/messages/${currentUser}`);
        const data = await response.json();

        if (!data.messages || data.messages.length === 0) {
            messagesBox.innerHTML = "<div class='message'>No messages yet.</div>";
            return;
        }

        messagesBox.innerHTML = "";

        for (const msg of data.messages) {
            const div = document.createElement("div");
            div.className = "message";

            div.innerHTML = `
                <div class="meta">From: ${msg.sender}</div>
                <div>${msg.encrypted_message}</div>
            `;

            messagesBox.appendChild(div);
        }
    } catch (error) {
        messagesBox.innerHTML = `<div class="message">Error: ${error.message}</div>`;
    }
}

// Show/hide encrypted text
function toggleEncryptedMessage(elementId, button) {
    const encryptedDiv = document.getElementById(elementId);

    if (encryptedDiv.style.display === "none" || encryptedDiv.style.display === "") {
        encryptedDiv.style.display = "block";
        button.innerText = "Hide Encrypted Message";
    } else {
        encryptedDiv.style.display = "none";
        button.innerText = "Show Encrypted Message";
    }
}