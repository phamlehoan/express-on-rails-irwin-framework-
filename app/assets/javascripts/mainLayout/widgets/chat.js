document.addEventListener("DOMContentLoaded", () => {
  // Chat Widget Elements
  const chatButton = document.getElementById("chat-widget-button");
  const chatPopup = document.getElementById("chat-popup");
  const closeChatButton = document.getElementById("close-chat-popup");

  if (chatButton && chatPopup && closeChatButton) {
    // Toggle Popup
    chatButton.addEventListener("click", () => {
      chatPopup.style.display = "flex";
      chatButton.style.display = "none";
    });

    closeChatButton.addEventListener("click", () => {
      chatPopup.style.display = "none";
      chatButton.style.display = "block";
    });

    // Socket.io logic
    const socket = io();
    const messages = chatPopup.querySelector("#messages");
    const form = chatPopup.querySelector("#chat-form");
    const input = chatPopup.querySelector("#message-input");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (input.value) {
        socket.emit("chat:message", { content: input.value });
        input.value = "";
      }
    });

    socket.on("chat:message", (data) => {
      const item = document.createElement("div");
      item.style.marginBottom = "10px";
      const timestamp = new Date(data.timestamp).toLocaleTimeString();
      const userName =
        typeof data.user === "object" && data.user.name
          ? data.user.name
          : data.user;
      item.innerHTML = `<div><strong>${userName}:</strong> ${data.content} <div class="text-muted" style="font-size: 0.8em; text-align: right;">${timestamp}</div></div>`;
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
    });
  }
});
