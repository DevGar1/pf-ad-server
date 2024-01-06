import { Server } from "./Server.js";
import { Socket } from "./Socket.js";

const server = new Server();
export const socket = new Socket(server.getServer());

server.listen();
