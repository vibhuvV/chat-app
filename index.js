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
        if (
            name.length > 0 &&
            db.findIndex((user) => user.name === name) === -1
        ) {
            socket.name = name;
            socket.chattingTo = [];
            db.push(socket);
            const users = db.map((user) => user.name);
            io.emit("new user", { users });
        } else {
            console.log(name, "tried to rejoin");
            socket.emit("redirection", "/");
        }
    });

    socket.on("private message", ({ to, from, text }) => {
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

    socket.on('user typing', ({typing, name}) => {
        const index = db.findIndex((user) => user.name === name);
        if (index !== -1) {
            const rId = db[index].id;
            io.to(rId).emit("user typing", { typing });
        }
    })

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
