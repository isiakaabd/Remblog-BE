import multer from "multer";

const uploadMiddleware = (req, res, next) => {
  const upload = multer({ dest: "uploads/" });
  upload.single("image");
  next();
};

export { uploadMiddleware };
