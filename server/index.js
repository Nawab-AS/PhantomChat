import express, { urlencoded } from "express";
var app = express();
import { router, onSIGINT } from "./routes.js"
import { runWSserver } from "./WS-server.js"
import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;
const dev = process.env.ENVIRONMENT == "DEV";

// debug logs
function debug(message) {
  if (dev) {
    console.log(message);
  }
}
debug("DEVELOPMENT MODE");

// use routes.js for routes
app.use(urlencoded({extended:true}));
app.use("/", router(WS_PORT, app));

// listen fot https requests
app.listen(PORT, () => {
    console.log("express listening on *:" + PORT);
});


// Websocket server
runWSserver(WS_PORT);


// handle SIGINT
process.on('SIGINT', async ()=>{
  console.log("\nSIGINT received, shutting down");
  await onSIGINT();
  process.exit(0);
});