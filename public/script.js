const params = new URLSearchParams(window.location.search);
let name;
if (params.has("name") && params.get("name").length > 0) {
    name = params.get("name");
} else {
    window.location.replace("/");
}

// let name = prompt("Enter your name");
name = name.replace(/(<([^>]+)>)/gi, "");
name = name.trim();

const socket = io();

socket.on("redirection", () => {
    window.location.replace("/");
});

const chattingTo = [];
let currentR;
let prevR;

socket.emit("add user", { name });

socket.on("err", ({ error }) => {
    window.location.replace("/");
});

socket.on("new user", ({ users }) => {
    console.log(users);
    const usersList = document.querySelector(".users ul");
    usersList.innerHTML = "";
    users.forEach((user) => {
        const li = document.createElement("li");
        if (user === name) li.innerHTML = `<p>${user}</p> <span>(You)</span>`;
        else li.innerHTML = `<p>${user}</p> <span class="online"></span>`;
        li.addEventListener("click", (e) => {
            const tempName = e.target.firstChild.textContent.trim();
            if (tempName != name.trim()) {
                li.style.backgroundColor = "#eee";
                prevR = currentR;
                currentR = tempName;
                if (!chattingTo.includes(currentR)) {
                    chattingTo.push(currentR);
                    createChatBox(currentR);
                }
                const prevBox = prevR && document.querySelector(`#${prevR}`);
                const currentBox = document.querySelector(`#${currentR}`);
                if (prevBox) prevBox.style.display = "none";
                currentBox.style.display = "block";
                currentBox.children[1].scrollTop =
                    currentBox.children[1].scrollHeight;
            }
        });
        usersList.appendChild(li);
    });
});

socket.on("remove box", ({ user }) => {
    const tempBox =
        chattingTo.includes(user) && document.querySelector(`#${user}`);
    if (tempBox) {
        tempBox.remove();
        const users = document.querySelector(".users");
        users.style.display = "block";
        const index = chattingTo.indexOf(user);
        chattingTo.splice(index, 1);
    }
});

socket.on("private message", ({ to, from, text }) => {
    if (!chattingTo.includes(from)) {
        createChatBox(from);
        chattingTo.push(from);
    }
    const users = Array.from(document.querySelectorAll(".users ul li"));
    users.forEach((user) => {
        if (
            user.textContent.trim().toLowerCase() === from.trim().toLowerCase()
        ) {
            user.style.backgroundColor = "#ff8578";
        }
    });
    userChat(from, text);
    const ms = document.querySelector(`#${from} .messages`);
    ms.scrollTop = ms.scrollHeight;
});

let togglerSwitch = false;

function createChatBox(currName) {
    const ic = document.querySelector(".inner-container");
    const div = document.createElement("div");
    div.classList.add("box");
    div.setAttribute("id", currName);
    div.innerHTML = `<div class="titlebar" >
                        <p class="toggler"><i class="fa fa-users"></i></p>
                        <p>${currName}</p>
                        <span
                            ><p><i class="fa fa-times-circle"></i></p
                        ></span>
                    </div>
                    <div
                        class="messages"
                    >
                        
                    </div>
                    <div class="chatinput">
                        <div
                            class="scrollbottom"
                        ></div>
                        <input
                            type="text"
                            placeholder="Type your message here"
                        />
                        <button class="send">Send</button>
                    </div>`;
    ic.appendChild(div);
    const sendButton = document.querySelector(`#${currName} .chatinput .send`);
    const messageBox = document.querySelector(`#${currName} .messages`);
    const updateScroll = () => {
        messageBox.scrollTop = messageBox.scrollHeight;
    };
    const textArea = document.querySelector(`#${currName} .chatinput input`);
    sendButton.addEventListener("click", (e) => {
        let msg = textArea.value;
        msg = msg.replace(/(<([^>]+)>)/gi, "");
        if (msg) {
            myChat(currName, msg);
            updateScroll();
            textArea.value = "";
            socket.emit("private message", {
                from: name,
                to: currName,
                text: msg,
            });
        }
    });
    textArea.addEventListener("focus", () => {
        const users = Array.from(document.querySelectorAll(".users ul li"));
        users.forEach((user) => {
            if (
                user.textContent.trim().toLowerCase() ===
                currName.trim().toLowerCase()
            ) {
                user.style.backgroundColor = "#eee";
            }
        });
    });
    textArea.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            let msg = e.target.value;
            msg = msg.replace(/(<([^>]+)>)/gi, "");
            if (msg) {
                myChat(currName, msg);
                updateScroll();
                e.target.value = "";
                socket.emit("private message", {
                    from: name,
                    to: currName,
                    text: msg,
                });
            }
        }
    });

    const scrollButton = document.querySelector(
        `#${currName} .chatinput .scrollbottom`
    );
    scrollButton.addEventListener("click", updateScroll);
    messageBox.addEventListener("scroll", (e) => {
        if (messageBox.scrollHeight - messageBox.scrollTop > 700)
            scrollButton.style.display = "block";
        else scrollButton.style.display = "none";
    });
    const users = document.querySelector(".users");
    const toggler = document.querySelector(`#${currName} .titlebar .toggler`);
    toggler.addEventListener("click", (e) => {
        if (!togglerSwitch) {
            users.style.display = "block";
        } else {
            users.style.display = "none";
        }
        togglerSwitch = !togglerSwitch;
    });
}

function userChat(name, text) {
    const box = document.querySelector(`#${name} .messages`);
    const userMessage = document.createElement("div");
    userMessage.classList.add("usermessage-container");
    userMessage.innerHTML = `<p class="usermessage">
                                ${text} <span class="name">${name}</span>
                                <span class="time">${moment().format(
                                    "H:mm"
                                )}</span>
                            </p>`;
    box.appendChild(userMessage);
}

function myChat(name, text) {
    const box = document.querySelector(`#${name} .messages`);
    const mymessage = document.createElement("div");
    mymessage.classList.add("mymessage-container");
    mymessage.innerHTML = `<p class="mymessage">
                                ${text} <span class="name">You</span>
                                <span class="time">${moment().format(
                                    "H:mm"
                                )}</span>
                            </p>`;
    box.appendChild(mymessage);
}
