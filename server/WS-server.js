import jwt from 'jsonwebtoken';
import * as ws from "ws";
import { saveMessage } from "./database.js"
import dotenv from "dotenv";
dotenv.config();
const SESSION_SECRET = process.env.SESSION_SECRET;


export const runWSserver = (WS_PORT) => {
	const Websocket = new ws.WebSocketServer({ port: WS_PORT });

	Websocket.on("connection", (client) => {
		let auth = false;
		setTimeout(() => {if (!auth) client.close()}, 10_000); // close connection if not authenticated after 10 seconds
		console.log("new websocket connection");
		client.on("message", (rawData) => {
			let data;
			try {
				data = JSON.parse(rawData);
			} catch (e) {return} // data is not a json object

			if (!auth) {
				if (data.type == "auth") {
					try {
				    data = jwt.verify(data.token, SESSION_SECRET);
						if (data) auth = true;
				  } catch (err) { // close on invalid token
				    client.close();
				  }
				}
			} else {
				if (data.type == "message") {
                    console.log("received message from", data.from, "to", data.to, ":", data.message);
					saveMessage(data.message, data.to, data.from);
                    client.send(JSON.stringify({
                        type: "message",
                        message: data.message,
                        from: data.from,
                        to: data.to
                    }));
				}
			}
		});
		/*client.on("message", (data) => {
        debug(data);
        try {
            JSON.parse(data);
        } catch(e){ // data is a string
            return;
        }
        // data is a json object
        let packet = JSON.parse(data);
        debug("json");
        if (packet.type == "echo") {
            Websocket.clients.forEach((otherClient) => {
                otherClient.send(packet.data);
            });
        }
        console.log("received: %s", packet);
    });*/
	});
	console.log("websocket listening on *:" + WS_PORT);
};