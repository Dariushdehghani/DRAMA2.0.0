const participants = new Map()
const streams = new Map()
const dataChannels = new Map()
let audioEnabled = true;
let videoEnabled = true;

const urlparams = new URLSearchParams(location.search)
const room = urlparams.get('room')
const roomname = urlparams.get('roomname') || room
let joinBtn;

window.onload = () => {
    if (room) {
        let data = localStorage.getItem('user');
        socket.emit('analyse_user_data', JSON.parse(data))
        joinBtn = document.getElementById("joinBtn");
        lucide.createIcons();
        change_theme(localStorage.getItem('theme_color'))
        initCamera()
    } else {
        location.pathname = '/home'
    }
}

socket.on('analyse_request_not_accepted', () => {
    alert('not accepted')
    window.location.pathname = '/signin'
    localStorage.clear()
})

socket.on('analyse_request_accepted', user => {
    document.querySelector('.username_initiator').innerHTML = `Logging in as ${user.username}`
    localStorage.setItem('user', JSON.stringify(user))
    const profilePic = localStorage.getItem('profilePic')
    document.querySelectorAll('.roomname').forEach(r => r.innerHTML = roomname)
    document.getElementById('initiator_profile_pic').src = profilePic || ''
    document.querySelector('title').innerHTML = `DRAMA || Room: ${roomname}`
})

socket.on('room_not_found', () => {
    alert('Room not found')
    location.pathname = '/home'
})

const pendingCandidates = {};
const peers = {}

let myId = null;
let localStream = null;
let streamReady = false;
let socketReady = false;

function joinbtnClick() {
    socket.emit("join-room", { room });
    joinBtn.disabled = true;
    joinBtn.textContent = "Joined";
    document.querySelector('.initiator').style.display = 'none'
};

function checkIfReady() {
    if (socketReady && streamReady) {
        joinBtn.disabled = false;
        joinBtn.textContent = "Join Room";
    }
}

async function initCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: audioEnabled });
        document.getElementById("localVideo").srcObject = localStream;
        streamReady = true;
        checkIfReady();
    } catch (err) {
        console.error("getUserMedia error:", err);
    }
}

function flushCandidates(id) {
    if (pendingCandidates[id]) {
        pendingCandidates[id].forEach(c => peers[id].addIceCandidate(new RTCIceCandidate(c)));
        delete pendingCandidates[id];
    }
}

socket.on("connect", () => {
    socketReady = true;
    checkIfReady();
    myId = socket.id
});

socket.on("user-joined-room", ({ id }) => {
    createPeer(id, true);
});

socket.on("offer", async ({ from, offer, username, profilePic }) => {
    console.log('offer received from:' + username)
    createPeer(from, false, username, profilePic);
    await peers[from].setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peers[from].createAnswer();
    await peers[from].setLocalDescription(answer);
    socket.emit("answer", { to: from, answer });
    flushCandidates(from);
});

socket.on("answer", ({ from, answer }) => {
    peers[from].setRemoteDescription(new RTCSessionDescription(answer));
    flushCandidates(from);
});

socket.on("ice-candidate", ({ from, candidate }) => {
    if (peers[from]?.remoteDescription) {
    peers[from].addIceCandidate(new RTCIceCandidate(candidate));
    } else {
    if (!pendingCandidates[from]) pendingCandidates[from] = [];
    pendingCandidates[from].push(candidate);
    }
});

function user_left_room(id) {
    console.log(id + ' left')

    const video = document.getElementById('remote-' + id )
    if(video) {
        video.classList.add("removed")
        setTimeout(() => video.remove(), 300)
    }

    if (peers[id]) {
    peers[id].close()
    delete peers[id]
    participants.delete(id)
    streams.delete(id)
    dataChannels.delete(id)
    }
}

function toggleVideo() {
    videoEnabled = !videoEnabled
    localStream.getVideoTracks().forEach(track => {
        track.enabled = videoEnabled
    })
    document.getElementById('video-toggle').innerHTML = videoEnabled? '<i data-lucide="video" ></i>' : '<i data-lucide="video-off" ></i>'
    lucide.createIcons()
}

function toggleAudio() {
    audioEnabled = !audioEnabled
    localStream.getAudioTracks().forEach(track => {
        track.enabled = audioEnabled
    })
    document.getElementById('audio-toggle').innerHTML = audioEnabled? '<i data-lucide="mic" ></i>' : '<i data-lucide="mic-off" ></i>'
    lucide.createIcons()
}

function endCall() {
    if (dataChannels.keys()) {
        dataChannels.keys().forEach(key => {
            dataChannels.get(key).send(JSON.stringify({
                type:'endCall'
            }))
        })
    }
    location.pathname = '/home'
}

function reloadStreams() {
    document.getElementById('localVideo').srcObject = localStream
    streams.keys().forEach(key => {
        document.getElementById('remote-' + key + '-video').srcObject = streams.get(key).stream
    })
    document.querySelector('.count').innerHTML = streams.size + 1 + ' participants'
}

function reloadUserDatas() {
    participants.keys().forEach(key => {
        document.getElementById('remote-' + key + '-name').innerHTML = participants.get(key).username
        if (!participants.get(key).profilePic || document.querySelector('#remote-' + key + '-pic img')) return;
        let ppic = document.createElement('img')
        ppic.src =  participants.get(key).profilePic
        ppic.classList.add('profilePicture')
        document.getElementById('remote-' + key + '-pic').appendChild(ppic)
    })
}

function setupDataChannel(id, channel, isSender) {
    dataChannels.set(id, channel)

    if(isSender) {
        channel.onopen = () => {
            console.log('channel opened')
            const localUsername = JSON.parse(localStorage.getItem('user')).username
            const localProfilePic = localStorage.getItem('profilePic')
            const payload = {
                username: localUsername,
                profilePic: localProfilePic
            }
            channel.send(JSON.stringify(payload))
        }
        channel.onmessage = event => {
            const msg = JSON.parse(event.data)
            if (msg.type === 'endCall') {
                user_left_room(id)
                return;
            }
            participants.set(id, msg)
            reloadUserDatas()
            reloadStreams()
        }
    } else {
        channel.onmessage = event => {
            const msg = JSON.parse(event.data)
            if (msg.type === 'endCall') {
                user_left_room(id)
                return;
            }
            participants.set(id, msg)
            const localUsername = JSON.parse(localStorage.getItem('user')).username
            const localProfilePic = localStorage.getItem('profilePic')
            const payload = {
                username: localUsername,
                profilePic: localProfilePic
            }
            channel.send(JSON.stringify(payload))
            reloadUserDatas()
            reloadStreams()
        }
    }
}

function createPeer(id, initiator) {
    if (peers[id] || !localStream) return;
    console.log('creating peer:' + id)

    const pc = new RTCPeerConnection({ iceServers: [] });
    peers[id] = pc;

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.onicecandidate = e => {
        if (e.candidate) {
            socket.emit("ice-candidate", { to: id, candidate: e.candidate });
        }
    };

    pc.ontrack = e => {
        if (document.getElementById('remote-' + id + '-video')) return;
        console.log(e)
        let p = {
            isstreaming : true,
        }
        
        let ctx = document.querySelector('.participants');
        ctx.innerHTML += `<div class="participant" id="remote-${id}">
                    <div class="video-box" style='display:flex;justify-content:center;align-items:center;flex-direction:row;'>${p.isstreaming? '<video id="remote-' + id + '-video" class="remoteVideo" autoplay ></video>': '<i data-lucide="video-off" style="color:var(--primary-color);"></i><span>not streaming</span>'}</div>
                    <div class="info">
                        <div id="remote-${id}-pic"></div>
                        <span id="remote-${id}-name"></span>
                    </div>
                </div>`
        streams.set(id, {
            stream: e.streams[0]
        })
        reloadStreams()
    };

    pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'closed' || state === "disconnected" || state === "failed") {
            user_left_room(id)
        }
    }

    if (initiator) {
        const dataChannel = pc.createDataChannel('metadata')
        setupDataChannel(id, dataChannel, true)
        pc.createOffer().then(offer => {
            return pc.setLocalDescription(offer);
        }).then(() => {
            socket.emit("offer", { to: id, offer: pc.localDescription });
        });
    } else {
        pc.ondatachannel = (event) => {
            setupDataChannel(id, event.channel, false)
        }
    }
}