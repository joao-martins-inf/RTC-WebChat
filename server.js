const http = require("http");
const service = require("restana")();
const files = require("serve-static");
const path = require("path");
const socket = require("socket.io");
const server = http.createServer(service);
const io = socket(server);

io.on("connection", (socket) => {
  socket.on("join room", (roomID, userId) => {
    socket.join(roomID);
    socket.to(roomID).broadcast.emit("user connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomID).broadcast.emit("user disconnected", userId);
    });

    //chat stuff
    /* socket.on("send-chat-message", (message) => {
      socket.broadcast.emit("chat-message", { message: message, userId });
    }); */
  });
});

server.listen(1234, "0.0.0.0", function () {
  console.log("running");
});
