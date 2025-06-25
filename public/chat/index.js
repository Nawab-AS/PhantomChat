const userlist = document.getElementById("userlist");
const greeting = document.getElementById("greeting");
const sendMessage = document.getElementById("sendMessage");
const textarea = sendMessage.querySelector("textarea");
const messageArea = document.getElementById("messages");
const cookies = new URLSearchParams(document.cookie.replaceAll("; ", "&"));


// load messages
var messages;
var currentChat;
var userData;
var friends;
fetch("/chat/api/userdata.json")
	.then((res) => res.json())
	.then((data) =>{
		console.log("loaded",data)
		messages = data.messages;
		friends = data.friends;
		userData = data.userData;
		for (let i = 0; i < friends.length; i++) {
			addUser(friends[i].username, friends[i].user_id);
		}
		loadChat(friends[0]?.username || 'No one', friends[0]?.user_id);
		document.getElementById("loadingGIF").style.display = "none";
		messageArea.style.display = "flex";
});


// UI functions
greeting.innerHTML = cookies.get("username");

sendMessage.addEventListener("submit", (e) => {
	e.preventDefault();
	if (textarea.value == "") return; // don't send empty messages
	if (!WS_sendData) return; // don't send if not connected to websocket
	console.log({type: "message", message: textarea.value, to: currentChat, from: userData.user_id});
	WS_sendData({type: "message", message: textarea.value, to: currentChat, from: userData.user_id});
	textarea.value="";
});

textarea.addEventListener('keydown', function(event) {
	if (event.key === 'Enter') {
		if (event.shiftKey) return; // Allow new line with Shift + Enter
    event.preventDefault(); // Prevent the default newline
		sendMessage.dispatchEvent(new Event("submit")) // Trigger the form submission
  }
});

function nameClicked(event) {
	let name = event.target.name || event.target.parentElement.name;
	console.log(name, "clicked");
	loadChat(name, event.target.user_id || event.target.parentElement.user_id);
}

function addUser(username, user_id) {
	var li = document.createElement("li");
	var icon = document.createElement("icon");
	var p = document.createElement("p");
	icon.innerHTML = username.charAt(0).toUpperCase();
	p.innerHTML = username;
	li.appendChild(icon);
	li.appendChild(p);
	userlist.appendChild(li);

	li.name = username;
	li.user_id = user_id;
	li.addEventListener("click", nameClicked);
}

function removeUser(username) {
	for (let i = 0; i < userlist.children.length; i++) {
		if (userlist.children[i].children[1].innerHTML == username) {
			userlist.removeChild(userlist.children[i]);
			return true;
		}
	}
	return false;
}

function loadChat(name, user_id) {
	document.getElementById("loadingGIF").style.display = "none";
	document.getElementsByTagName("titlebar")[0].innerHTML = name;
	messageArea.innerHTML = ""; // clear messages
	currentChat = user_id;
	let currentMessages = messages.filter(i=>(i.to == currentChat || i.from == currentChat));
	currentMessages.sort((a, b) => (new Date(a.sent_at)).getTime() - (new Date(b.sent_at)).getTime());
	currentMessages.forEach(i => {
		addMessage(i);
	});
}

function addMessage(messageObj) {
	let message = document.createElement("p");
	message.innerHTML = messageObj.message;
	messageArea.appendChild(message);
	messageArea.scrollTop = messageArea.scrollHeight; // scroll to bottom
	messages.push(messageObj);
}

// Websocket functions
function setup_WS_client(websocket) {
	websocket.addEventListener("message", (data) => {
		let packet;
		try {
			packet = JSON.parse(data.data);
		} catch (e) {
			console.error("received invalid data from websocket", data);
			return;
		}		
		if (packet.type == "message") {
			if (packet.to == userData.user_id || packet.from == userData.user_id) return addMessage(packet);
		}
	});
}