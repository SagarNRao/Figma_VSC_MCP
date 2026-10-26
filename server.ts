import express, { type Express, type Request, type Response } from 'express';
import CORS from 'cors';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';


dotenv.config();

const app: Express = express();
const port = 3000;
const payloadUploads = new Map<string, { totalChunks: number; nextChunkIndex: number; tempPath: string }>();

app.use(CORS());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use('/convert-to-image', express.raw({ type: 'application/octet-stream', limit: '500mb' }));


// Route 1: Save the raw image bytes
app.post('/convert-to-image', (req: Request, res: Response) => {
    const content = req.body; 
    const nodeId = req.headers['x-node-id'] as string;
    const fileKey = req.headers['x-file-key'] as string;

    if (!content || content.length === 0) {
        res.status(400).json({ error: 'No image data received' });
        return;
    }

    // Target the MCP/resources directory directly
    const cacheDir = path.join(__dirname, 'MCP', 'resources');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const imagePath = path.join(cacheDir, './image.png');
    fs.writeFileSync(imagePath, content);

    res.status(200).json({ success: true, path: imagePath });
});

app.post('/save-payload-chunk', (req: Request, res: Response) => {
    const { uploadId, chunkIndex, totalChunks, chunk } = req.body;

    if (
        typeof uploadId !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(uploadId) ||
        !Number.isInteger(chunkIndex) ||
        !Number.isInteger(totalChunks) ||
        totalChunks < 1 ||
        chunkIndex < 0 ||
        chunkIndex >= totalChunks ||
        typeof chunk !== 'string'
    ) {
        res.status(400).json({ error: 'Invalid payload chunk' });
        return;
    }

    const cacheDir = path.join(__dirname, 'MCP', 'resources');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    let upload = payloadUploads.get(uploadId);
    if (chunkIndex === 0) {
        if (upload) {
            res.status(409).json({ error: 'Payload upload already exists' });
            return;
        }

        const tempPath = path.join(cacheDir, `${uploadId}.payload.tmp`);
        fs.writeFileSync(tempPath, chunk, { encoding: 'utf8', flag: 'wx' });
        upload = { totalChunks, nextChunkIndex: 1, tempPath };
        payloadUploads.set(uploadId, upload);
    } else {
        if (!upload || upload.totalChunks !== totalChunks || upload.nextChunkIndex !== chunkIndex) {
            res.status(409).json({ error: 'Unexpected payload chunk order' });
            return;
        }

        fs.appendFileSync(upload.tempPath, chunk, 'utf8');
        upload.nextChunkIndex++;
    }

    if (chunkIndex === totalChunks - 1) {
        const payloadPath = path.join(cacheDir, 'payload.json');
        fs.renameSync(upload.tempPath, payloadPath);
        payloadUploads.delete(uploadId);
        res.status(200).json({ success: true, path: payloadPath });
        return;
    }

    res.status(200).json({ success: true, received: chunkIndex + 1, totalChunks });
});

// Route 2: Save the payload.json referencing the image location
app.post('/save-payload', (req: Request, res: Response) => {
    const { fileKey, nodeId, documentTree } = req.body;

    const payload = {
        fileKey,
        nodeId,
        imagePath: './resources/image.png',
        documentTree,
        timestamp: new Date().toISOString()
    };

    const payloadPath = path.join(__dirname, 'MCP', 'resources', 'payload.json');
    fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));

    res.status(200).json({ success: true, path: payloadPath });
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});