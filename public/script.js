//socket reference
const socket = io("/");

//reference to the grid where we store the videos
const videoGrid = document.getElementById("video-grid");

//reference to our own video
const myVideo = document.createElement("video");
myVideo.muted = true; //mutes our own video

//setup PeerJs connection
const myPeer = new Peer(undefined, {
  host: "/",
  port: "1235",
  debug: 3,
  config: {
    iceServers: [
      { url: "stun:stun1.l.google.com:19302" },
      {
        url: "turn:numb.viagenie.ca",
        credential: "muazkh",
        username: "webrtc@live.com",
      },
    ],
  },
});

const peers = {};

//messages
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");

//share screen
const shareScreenBtn = document.getElementById("share-button");

//const mute and video btns
const muteBtn = document.getElementById("mute-button");
const camBtn = document.getElementById("cam-button");

// get my media
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    //adds actions to the mute and video buttons
    muteBtn.addEventListener("click", (e) => {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
    });

    camBtn.addEventListener("click", (e) => {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
    });

    /**
     * Handle the on receive call event
     */
    myPeer.on("call", (call) => {
      // Answer the call with your own video/audio stream
      call.answer(stream);

      const video = document.createElement("video");

      // Receive data
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    //send our
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
      appendMessage(`${userId} connected`);
      shareScreenBtn.addEventListener("click", (e) => {
        shareScreen(userId);
      });
    });
  });

//Run this code as soon as a user connects on the PeerServer
myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

//disconnects the user from the call
socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
    appendMessage(`${userId} disconnected`);
  }
});

//chat
socket.on("chat-message", (data) => {
  appendMessage(`${data.userId}: ${data.message}`);
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  appendMessage(`You: ${message}`);
  socket.emit("send-chat-message", message);
  messageInput.value = "";
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
  console.log(peers);
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.classList.add("col-md-6");
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.insertBefore(video, videoGrid.firstChild);
}

function appendMessage(message) {
  const messageElem = document.createElement("div");
  messageElem.innerText = message;
  messageContainer.append(messageElem);
}

function shareScreen(userId) {
  navigator.mediaDevices
    .getDisplayMedia({
      cursor: true,
    })
    .then((stream) => {
      const video = document.createElement("video");
      addVideoStream(video, stream);
      const call = myPeer.call(userId, stream);

      call.on("close", () => {
        video.remove();
      });

      peers[userId] = call;
    });
}

/* function mute() {
  myStream.getTracks().forEach((track) => (track.enabled = !track.enabled));
} */
