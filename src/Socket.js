import { Server } from "socket.io";

export class Socket {
  constructor(server) {
    this.io = new Server(server, {
      path: "/",
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
      },
      upgradeTimeout: 410000,
      pingInterval: 710000, // Intervalo de ping en milisegundos (por defecto es 25000)
      pingTimeout: 910000, // Tiempo de espera del ping en milisegundos (por defecto es 60000)
    });
    this.io.listen(4000);
    this.init = this.init.bind(this);
    this.connect = this.connect.bind(this);
    this.init();
  }

  init() {
    this.io.on("connection", this.connect); // Utiliza función de flecha
  }

  getConnection(socketId) {
    // console.log(this.io.sockets.sockets.get(socketId));
    return this.io.sockets.sockets.get(socketId);
  }

  connect(socket) {
    console.log("Hola, bienvenido", socket.id);
    socket.on("upload-image", (data) => {
      const { name, file, fileName } = data;
      // createIAImage({ fileName, image: file, name, socket });
    });
    socket.on("create-ia-image", (data) => {
      const { token } = data;
      //   createIAImage({ token, socket });
    });
    socket.on("disconnect", () => {
      console.log(`Adios ${socket.id}]\n`);
    });
  }
}
