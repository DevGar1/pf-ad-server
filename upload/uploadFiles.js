import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./upload`);
  },
  filename: function (req, file, cb) {
    const [text] = file.originalname.split('.');
    cb(null, text.replace(" ", "_") + "-" + new Date().getMilliseconds() + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100, // 5 MB (ajusta según tus necesidades)
  },
});
