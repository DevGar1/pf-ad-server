import { Router } from "express";
import { descargarRespuesta, guardarRespuesta, listarRespuesta, servirVideo } from "./controller.js";
import { upload } from "./uploadFiles.js";

export const router = Router();

router.post("/guardar", upload.single("archivo"), guardarRespuesta);
router.post("/descargar", descargarRespuesta);
router.get("/video/:file", servirVideo);
router.get("/listar", listarRespuesta);
