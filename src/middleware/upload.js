const uploadMiddleware = (req, res, next) => {
  upload.single("image");
  next();
};

export { uploadMiddleware };
