// Initialize variables
let peer = null;
let conn = null;

// DOM Elements
const myIdDisplay = document.getElementById('my-id');
const peerIdInput = document.getElementById('peer-id-input');
const connectBtn = document.getElementById('connect-btn');
const statusText = document.getElementById('status-text');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendMsgBtn = document.getElementById('send-msg-btn');
const fileInput = document.getElementById('file-input');
const sendFileBtn = document.getElementById('send-file-btn');

// 1. Initialize PeerJS connection to signaling server
peer = new Peer();

// Display unique Peer ID generated for this user
peer.on('open', (id) => {
  myIdDisplay.innerText = id;
});

// Listen for incoming connections from another peer
peer.on('connection', (incomingConn) => {
  conn = incomingConn;
  setupConnection();
});

// 2. Connect to another peer manually
connectBtn.addEventListener('click', () => {
  const targetPeerId = peerIdInput.value.trim();
  if (targetPeerId) {
    statusText.innerText = "Status: Connecting...";
    conn = peer.connect(targetPeerId);
    setupConnection();
  }
});

// 3. Setup event handlers for the connection
function setupConnection() {
  conn.on('open', () => {
    statusText.innerText = "Status: Connected to " + conn.peer;
    toggleInputs(false); // Enable controls
  });

  // Handle incoming data (messages or files)
  conn.on('data', (data) => {
    if (data.type === 'text') {
      appendMessage(`Peer: ${data.content}`, 'received');
    } else if (data.type === 'file') {
      appendImage(data.content, 'received', data.fileName);
    }
  });

  conn.on('close', () => {
    statusText.innerText = "Status: Connection Closed";
    toggleInputs(true); // Disable controls
  });
}

// 4. Send Text Message
sendMsgBtn.addEventListener('click', () => {
  const text = messageInput.value.trim();
  if (text && conn && conn.open) {
    conn.send({ type: 'text', content: text });
    appendMessage(`You: ${text}`, 'sent');
    messageInput.value = '';
  }
});

// 5. Send JPG File
sendFileBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file first!");
    return;
  }

  if (file.type !== "image/jpeg") {
    alert("Please select a valid JPG image.");
    return;
  }

  const reader = new FileReader();
  
  // Read file as Data URL (Base64) to transmit over WebRTC
  reader.onload = (e) => {
    const base64Data = e.target.result;
    
    if (conn && conn.open) {
      conn.send({
        type: 'file',
        content: base64Data,
        fileName: file.name
      });
      appendImage(base64Data, 'sent', file.name);
      fileInput.value = ''; // Reset file input
    }
  };

  reader.readAsDataURL(file);
});

// Helper Function: Append text message to UI
function appendMessage(msg, type) {
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.innerText = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Helper Function: Append received/sent image to UI
function appendImage(base64Src, type, fileName) {
  const div = document.createElement('div');
  div.className = `message ${type}`;
  
  const textSpan = document.createElement('span');
  textSpan.innerText = type === 'sent' ? `You sent: ${fileName}` : `Peer sent: ${fileName}`;
  
  const img = document.createElement('img');
  img.src = base64Src;
  
  div.appendChild(textSpan);
  div.appendChild(img);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Enable/Disable input fields
function toggleInputs(disabled) {
  messageInput.disabled = disabled;
  sendMsgBtn.disabled = disabled;
  fileInput.disabled = disabled;
  sendFileBtn.disabled = disabled;
}
