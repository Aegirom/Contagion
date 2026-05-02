import crypto from "crypto";

const getR2Config = () => {
  const endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : null);

  const config = {
    endpoint,
    bucket: process.env.R2_BUCKET_NAME,
    accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY,
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY,
  };

  if (
    !config.endpoint ||
    !config.bucket ||
    !config.accessKeyId ||
    !config.secretAccessKey
  ) {
    const error = new Error("Cloudflare R2 is not configured");
    error.statusCode = 500;
    throw error;
  }

  return config;
};

const hashHex = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const hmac = (key, value, encoding) =>
  crypto.createHmac("sha256", key).update(value).digest(encoding);

const getAmzDate = (date = new Date()) => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
};

const encodePathSegment = (segment) =>
  encodeURIComponent(segment).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const encodeS3Key = (key) => key.split("/").map(encodePathSegment).join("/");

const getSigningKey = (secretAccessKey, dateStamp) => {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
};

const signRequest = ({
  method,
  key,
  bodyHash,
  contentType,
  expiresSeconds,
}) => {
  const config = getR2Config();
  const endpoint = new URL(config.endpoint);
  const { amzDate, dateStamp } = getAmzDate();
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalUri = `/${config.bucket}/${encodeS3Key(key)}`;

  if (method === "GET") {
    const query = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expiresSeconds),
      "X-Amz-SignedHeaders": "host",
    });

    const canonicalQuery = [...query.entries()]
      .map(
        ([name, value]) =>
          `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
      )
      .sort()
      .join("&");
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQuery,
      `host:${endpoint.host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      hashHex(canonicalRequest),
    ].join("\n");
    const signature = hmac(
      getSigningKey(config.secretAccessKey, dateStamp),
      stringToSign,
      "hex",
    );
    query.set("X-Amz-Signature", signature);

    return `${endpoint.origin}${canonicalUri}?${query.toString()}`;
  }

  const headers = {
    host: endpoint.host,
    "content-type": contentType,
    "x-amz-content-sha256": bodyHash,
    "x-amz-date": amzDate,
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((name) => `${name}:${headers[name]}\n`)
    .join("");
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hashHex(canonicalRequest),
  ].join("\n");
  const signature = hmac(
    getSigningKey(config.secretAccessKey, dateStamp),
    stringToSign,
    "hex",
  );

  return {
    url: `${endpoint.origin}${canonicalUri}`,
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": bodyHash,
      "x-amz-date": amzDate,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
};

export const uploadBufferToR2 = async ({ buffer, key, contentType }) => {
  const bodyHash = hashHex(buffer);
  const signed = signRequest({
    method: "PUT",
    key,
    bodyHash,
    contentType: contentType || "application/octet-stream",
  });

  const response = await fetch(signed.url, {
    method: "PUT",
    headers: signed.headers,
    body: buffer,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    const error = new Error(`R2 upload failed with status ${response.status}`);
    error.statusCode = 502;
    error.details = message;
    throw error;
  }

  return {
    key,
    storagePath: `r2://${getR2Config().bucket}/${key}`,
    etag: response.headers.get("etag"),
  };
};

export const createSignedR2DownloadUrl = ({ key, expiresSeconds = 300 }) =>
  signRequest({
    method: "GET",
    key,
    expiresSeconds,
  });

export const convertR2ToHttpUrl = (storagePath) => {
  if (!storagePath?.startsWith("r2://")) return storagePath;
  const match = /^r2:\/\/[^/]+\/(.+)$/.exec(storagePath);
  if (!match) return storagePath;
  return `/avatar/${match[1]}`;
};
