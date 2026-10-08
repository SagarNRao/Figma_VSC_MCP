/* global Buffer, console, process */

import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const PORT = 43123;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const IMAGE_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), "images");
const token = randomBytes(24).toString("hex");

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(value));
}

async function readImage(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_IMAGE_BYTES) {
      throw new Error("Image exceeds the 50 MB limit.");
    }
    chunks.push(chunk);
  }

  if (size === 0) {
    throw new Error("No image data was received.");
  }

  return Buffer.concat(chunks);
}

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Save-Token");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== "POST" || request.url !== "/save") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  const suppliedToken = request.headers["x-save-token"] || "";
  const suppliedBuffer = Buffer.from(suppliedToken);
  const expectedBuffer = Buffer.from(token);
  if (suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    sendJson(response, 401, { error: "Invalid save helper token." });
    return;
  }

  if (request.headers["content-type"] !== "image/png") {
    sendJson(response, 415, { error: "Expected a PNG image." });
    return;
  }

  try {
    const image = await readImage(request);
    await mkdir(IMAGE_DIRECTORY, { recursive: true });
    const file = `frame-${Date.now()}-${randomUUID()}.png`;
    await writeFile(path.join(IMAGE_DIRECTORY, file), image, { flag: "wx" });
    sendJson(response, 201, { file: `images/${file}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save image.";
    sendJson(response, message.includes("50 MB") ? 413 : 500, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Image save helper listening at http://localhost:${PORT}`);
  console.log(`Enter this token in the Figma plugin UI: ${token}`);
  console.log(`PNG files will be saved to ${IMAGE_DIRECTORY}`);
});

server.on("error", (error) => {
  console.error("Image save helper failed:", error);
  process.exitCode = 1;
});
