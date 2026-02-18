import { PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

const getR2Config = () => {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Missing R2 configuration: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
  };
};

const getR2Client = () => {
  const config = getR2Config();

  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

const sanitizeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, "-");

const buildProductImageKey = (originalName: string) => {
  const safeName = sanitizeFileName(originalName);
  return `products/${crypto.randomUUID()}-${safeName}`;
};

export const uploadProductImageToR2 = async (file: Express.Multer.File) => {
  const config = getR2Config();
  const client = getR2Client();
  const key = buildProductImageKey(file.originalname);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return key;
};

export const getProductImageSignedUrl = async (imageKey: string) => {
  const config = getR2Config();
  const client = getR2Client();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: imageKey,
    }),
    { expiresIn: 60 * 10 },
  );
};