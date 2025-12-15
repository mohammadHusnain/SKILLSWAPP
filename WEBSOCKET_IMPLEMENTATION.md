# WebSocket Implementation Guide for SkillSwap

## 1. What is this?
This document explains how the **Real-Time Chat** and **Notification** systems work in SkillSwap. 

Think of standard web requests (HTTP) like **sending a letter**: you send it, wait, getting a reply, and the interaction ends.
**WebSockets**, which we use here, are like a **phone call**: once you connect, the line stays open. You and the server can talk back and forth instantly at any time without redialing.

---

## 2. The Technology Stack (Tools Used)

### Backend (Django)
We use **Django Channels** to upgrade our standard Django server to handle these "phone calls" (WebSockets).

*   **`channels`**: The main library that gives Django the power to handle WebSockets.
*   **`daphne`**: The specific request server (ASGI) that runs our application. The standard Django server cannot handle WebSockets; Daphne can.
*   **`channels_redis`**: (Optional/Advanced) Used to manage the "rooms" users talk in. Currently configured to use "InMemory" for easy local development.

### Frontend (Next.js)
We use the native browser built-in **`WebSocket` API** wrapped in custom **React Hooks**.

*   NO extra heavy libraries (like Socket.io client) were needed; we built a lightweight, custom solution for maximum control.

---

## 3. How It Works: The Flow

### Step 1: The Connection (Handshake)
1.  **User Opens Chat**: When a user selects a conversation, the Frontend (`useChat.js`) initiates a call.
2.  **Authentication**: The URL includes the user's secret login token:
    `ws://localhost:8000/ws/chat/123/?token=eyJ...`
3.  **Backend Verification**: The Backend (`ChatConsumer.py`) grabs this token from the URL, verifies it determines *exactly* who the user is. If valid, the "Phone call" is accepted.

### Step 2: Sending & Receiving (Real-time)
*   **Sending a Message**:
    1.  User types "Hello" and hits send.
    2.  Frontend converts this to JSON text: `{"type": "send_message", "text": "Hello"}`.
    3.  It shoots this text down the open WebSocket "tube".
    4.  Backend receives it, saves it to the database (MongoDB), and broadcasts it to the recipient.

*   **Receiving a Message**:
    1.  The WebSocket `onmessage` event triggers on the Frontend.
    2.  Our code parses the incoming text data.
    3.  React updates the `messages` list immediately.
    4.  The user sees the new bubble appear instantly, without refreshing the page.

### Step 3: Stability (Staying Connected)
WebSockets can be fragile; they often disconnect if "silent" for too long. We implemented two safety features:

1.  **The Heartbeat (Ping/Pong)**:
    *   Every **30 seconds**, the Frontend sends a tiny "ping" message.
    *   The Backend replies "pong".
    *   This keeps the connection "active" so the router/browser doesn't kill it.

2.  **Auto-Reconnection**:
    *   If the internet drops or the server restarts, the Frontend detects the error (Code `1006`).
    *   It waits 3 seconds and automatically attempts to call back.
    *   This happens in a loop until the connection is restored.

---

## 4. Key Files Structure

### Backend
*   **`api/messages/consumers.py`**: The "Brain". Handles the socket events (connect, receive, disconnect) and logic.
*   **`api/messages/routing.py`**: The "Phonebook". Maps URLs (like `/ws/chat/`) to the correct Consumer.
*   **`skillswap/asgi.py`**: The entry point that tells Django how to listen for these special connections.

### Frontend
*   **`src/hooks/useChat.js`**: Manages the Chat connection. Handles sending messages, typing indicators, and the message list.
*   **`src/hooks/useNotifications.js`**: Manages the Global Notification connection (separate line). Listens for alerts like "New Match" or "Session Request".

---

## Troubleshooting Common Errors

*   **Error 1006 (Abnormal Closure)**: Usually means the server crashed or `daphne` isn't installed/running.
*   **"Invalid Hook Call"**: Means you tried to use a React feature (like `useRef`) inside a regular Javascript function.
*   **Messages not appearing**: Check if the `onmessage` handler in `useChat.js` is correctly updating the state variable `conversations`.
