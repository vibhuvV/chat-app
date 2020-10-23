const express = require("express");
const http = require("http");
const socketio = require("socket.io");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(__dirname + "/public"));

const db = [];

io.on("connection", (socket) => {
    socket.on("add user", ({ name }) => {
        if (name.length > 0) {
            socket.name = name;
            socket.chattingTo = [];
            if (db.findIndex((user) => user.name === name) === -1) {
                db.push(socket);
                const users = db.map((user) => user.name);
                io.emit("new user", { users });
            } else {
                socket.emit("err", { error: "User already exists" });
            }
        } else {
            socket.emit("redirection", "/");
        }
    });

    socket.on("private message", ({ to, from, text }) => {
        // console.log(to, from, text);
        const index = db.findIndex((user) => user.name === to);
        if (index !== -1) {
            const rId = db[index].id;
            if (!db[index].chattingTo.includes(socket.name)) {
                db[index].chattingTo.push(socket.name);
            }
            if (!socket.chattingTo.includes(db[index].name)) {
                socket.chattingTo.push(db[index].name);
            }
            io.to(rId).emit("private message", { to, from, text });
        }
    });

    socket.on("disconnect", () => {
        const index = db.findIndex((user) => user.name === socket.name);
        if (index !== -1) {
            const tempUser = db.splice(index, 1)[0];
            const users = db.map((user) => user.name);
            io.emit("new user", { users });
            io.emit("remove box", { user: tempUser.name });
        }
    });
});

app.get("/", (req, res) => {
    res.sendFile("/index.html");
});

server.listen(PORT, () => {
    console.log("Server started at port:", PORT);
});
