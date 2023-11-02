const APP_ID = '5865b106a0e24b52b567d75495605c1b'
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')

// pip install agora-token-builder ( For token generations because token expires in 24 hours)

let UID = Number(sessionStorage.getItem('UID'))
let NAME = sessionStorage.getItem('name')

const client = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'})

let localTracks = []
let remoteUsers = {}
let joinAndDisplayLocalStream = async() => {
    document.getElementById('room-name').innerText = CHANNEL

    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)

    try {
        await client.join(APP_ID, CHANNEL, TOKEN, UID)
    } catch (error) {
        window.open('/', '_self')
    }

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()

    let member = await createMember()

    let player = `<div class="video-container" id="user-container-${UID}">
                    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                    <div class="video-player" id="user-${UID}"></div>
                </div>`

    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user-${UID}`)

    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserJoined = async (user, mediaType)=> {
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)
    if(mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if(player != null){
            player.remove()
        }

        let member = await getMember(user)
        console.log(member)
            
        player = `<div class="video-container" id="user-container-${user.uid}">
                    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                    <div class="video-player" id="user-${user.uid}"></div>
                </div>`

        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)
    }
    if(mediaType === 'audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft = async (user)=> {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    for (let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()
    deleteMember()
    window.open('/', '_self')
}

let toggleCamera = async (e) => {
    let camImg = document.getElementById('cam')
    var vidOnSrc = document.getElementById('vid-on-src').value
    var vidOffSrc = document.getElementById('vid-off-src').value
    if(localTracks[1].muted){
        camImg.src = vidOnSrc
        await localTracks[1].setMuted(false)
    }
    else{
        camImg.src = vidOffSrc
        await localTracks[1].setMuted(true)
    }
}

let toggleMicrophone = async (e) => {
    let micImg = document.getElementById('mic')
    var micOnSrc = document.getElementById('mic-on-src').value
    var micOffSrc = document.getElementById('mic-off-src').value
    if(localTracks[0].muted){
        micImg.src = micOnSrc
        await localTracks[0].setMuted(false)
    }
    else{
        micImg.src = micOffSrc
        await localTracks[0].setMuted(true)
    }
}

let createMember = async () => {
    let response = await fetch('/create_member/', {
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
    return member
}

let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
} 

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
}

joinAndDisplayLocalStream()
window.addEventListener('beforeunload', deleteMember) // Closing window deletes that user
document.getElementById('leave').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('cam').addEventListener('click', toggleCamera)
document.getElementById('mic').addEventListener('click', toggleMicrophone)