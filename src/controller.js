import path from "path";
import range from "range-parser";
import { createReadStream, createWriteStream, unlink, statSync, existsSync, readdir } from "fs";
import { socket } from "./index.js";

export const guardarRespuesta = (req, res) => {
  const { file } = req;
  const { socketId } = req.body;
  console.log("incia");
  console.log(socketId);
  const connection = socket.getConnection(socketId);
  if (!connection) return console.log("false");
  const { path, originalname, size } = file;

  const filePath = `upload/new-${new Date().getMilliseconds()}-${originalname}`;
  const doesFileExist = existsSync(filePath);
  console.log("------>");
  console.log(connection.id);
  if (doesFileExist && existsSync(path)) {
    reBuildFile({ filePath, completePath: path, res, size, connection });
  } else {
    buildFile({ completePath: path, res, size, filePath, connection });
  }
};

/**
 *
 * La funcion se ejecuta para guardar desde cero al archivo que se esta subiendo al servidor
 */
const buildFile = ({ completePath, res, size, filePath, connection }) => {
  const readStream = createReadStream(completePath);
  const writeStream = createWriteStream(filePath);
  readStream.pipe(writeStream);
  return saveFile({ res, readStream, writeStream, size, completePath, connection });
};

/**
 * La funcion se ejecuta cuando el archivo que se desea guardar ya se tiene y se busca completar
 * de manera que no se carga completamente, solo el fragmento que le haga falta (en caso de que le falte)
 */
const reBuildFile = ({ filePath, completePath, res, size, connection }) => {
  const incompleteSize = statSync(filePath).size;
  const completeSize = statSync(completePath).size;
  const prevPercentage = (incompleteSize * 100) / completeSize;
  const readStream = createReadStream(completePath, { start: incompleteSize });
  const writeStream = createWriteStream(filePath, { flags: "a" });
  readStream.pipe(writeStream);

  return saveFile({ res, readStream, writeStream, size, completePath, prevPercentage, connection });
};

const saveFile = ({ readStream, writeStream, size, prevPercentage = 0, completePath, res, connection }) => {
  let isCorrect = true;
  let bytesRead = 0;
  console.log("llamar");

  readStream.on("error", (si) => {
    isCorrect = false;
    writeStream.emit("finish", si);
  });

  readStream.on("data", (data) => {
    if (!isCorrect) return;
    bytesRead += data.length;
    const progress = (bytesRead / size) * 100;
    connection.emit("progress", progress);
    try {
      // console.log(`Progreso: ${parseFloat(progress.toFixed(2)) + prevPercentage}%`);
    } catch (error) {
      readStream.emit("error", progress);
    }
  });

  writeStream.on("finish", (process) => {
    unlink(completePath, (err) => {
      if (err) console.log("errores");
    });
    if (process < 100) {
      return res.json({ complete: false });
    } else return res.json({ complete: true });
  });
};

export const listarRespuesta = (req, res) => {
  readdir("upload", (err, archivos) => {
    if (err) {
      console.error("Error al leer la carpeta:", err);
      res.status(500).json({ message: "No existe la carpeta" });
      return;
    }

    // console.log("Archivos en la carpeta:", archivos);
    res.json({ archivos });
  });
};

export const descargarRespuesta = (req, res) => {
  const { archivo, socketId } = req.body;
  console.log(socketId);
  const connection = socket.getConnection(socketId);

  const archivoPath = path.join("upload", archivo);

  const doesFileExist = existsSync(archivoPath);

  if (!doesFileExist) return res.status(400).json({ message: "Archivo no existe" });

  const stat = statSync(archivoPath);
  const fileSize = stat.size;

  // Configura los encabezados para la solicitud de rango
  const rangeHeader = req.headers.range || "bytes=0-";
  const ranges = range(fileSize, rangeHeader, { combine: true });

  // Si no hay rango válido, responde con el archivo completo
  if (!ranges || ranges === -1) {
    return res.status(200).sendFile(archivoPath);
  }

  // Responde con el rango solicitado
  const { start, end } = ranges[0];
  const chunkSize = end - start + 1;
  const file = createReadStream(archivoPath, { start, end });
  let bytesRead = 0;
  file.on("data", (data) => {
    bytesRead += data.length;
    const progress = (bytesRead / fileSize) * 100;
    try {
      console.log(`Progreso: ${parseFloat(progress.toFixed(2))}%`);
      connection.emit("progress", parseFloat(progress.toFixed(2)));
    } catch (error) {
      readStream.emit("error", progress);
    }
  });

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": "application/octet-stream",
  });

  file.pipe(res);
};

export const servirVideo = (req, res) => {
  const rangeHeader = req.headers.range || "bytes=0-";
  if (!rangeHeader) return res.status(400).json({ message: "Se necesita el rango para continuar" });
  const archivoPath = path.join("upload", req.params.file);
  const doesFileExist = existsSync(archivoPath);
  if (!doesFileExist) return res.status(400).json({ message: "Archivo no existe" });
  const stat = statSync(archivoPath);
  const fileSize = stat.size;
  const chunkSize = 10 ** 350;
  const start = Number(rangeHeader.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize, fileSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = createReadStream(archivoPath, { start, end });

  // Stream the video chunk to the client
  videoStream.pipe(res);
};
