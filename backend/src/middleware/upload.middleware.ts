import multer from "multer";

const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (!file.mimetype.startsWith("image/")) {
    callback(new Error("Only image files are allowed"));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRODUCT_IMAGE_SIZE },
  fileFilter,
});

export const uploadSingleProductImage = upload.single("image");