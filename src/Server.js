import http from "http";
import cors from "cors";
import express from "express";
import { router } from "./router.js";

export class Server {
  constructor(port = 5000) {
    this.port = port;
    this.app = express();
    this.setMiddleware();
    this.server = http.createServer(this.app);

    this.app.get("/", (req, res) => {
      res.json({ ok: true });
    });
    this.setRoutes();
  }

  setMiddleware() {
    this.app.use(express.json());
    this.app.use(cors());
  }

  setRoutes() {
    this.app.use("/", router);
  }

  getServer() {
    return this.server;
  }

  listen() {
    this.app.listen(this.port, () => console.log(`The server is running on ${this.port} port`));
  }
}
