import express, { type Express, type Request, type Response } from 'express';
import CORS from 'cors';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { REPLCommand } from 'repl';


dotenv.config();

const app: Express = express();
const port = 3000;

app.use(CORS());
app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/convert-to-image', express.raw({ type: 'application/octet-stream', limit: '10mb' }));


// app.post('/getImage', async (req: Request, res: Response) => {
//     let getImageURL = "https://api.figma.com/v1/images/"
//     const FigmaKEY = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;

//     let nodeId = req.body.nodeId?.toString() || "";
//     let fileKey = req.body.fileKey?.toString() || "";
//     let imageURL;

//     console.log("fileKey: ", fileKey);
//     console.log("nodeId: ", nodeId);

//     getImageURL += fileKey + "?ids=" + nodeId + "&format=png&scale=1&use_absolute_bounds=true";

//     console.log("getImageURL: ", getImageURL);

//     if (!getImageURL || !FigmaKEY) {
//         res.status(400).json({ error: 'Missing image URL or Figma token' });
//         return;
//     }

//     try {
//         const response = await fetch(getImageURL, {
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
//                 'X-Figma-Token': FigmaKEY as string
//             }
//         });

//         const data = await response.json();
//         const imageUrl = data.images && data.images[nodeId];
//         console.log("IMAGE URL HERE: ", imageUrl); // getting rate limited rn

//         res.status(response.status).json(data);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch image' });
//     }

//     const nodeEndpoint = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`;
//     const nodeResponse = await fetch(nodeEndpoint, {
//         method: 'GET',
//         headers: {
//             'Accept': 'application/json',
//             'X-Figma-Token': FigmaKEY as string
//         }
//     });
//     const nodeData = await nodeResponse.json();
//     const documentTree = nodeData.nodes && nodeData.nodes[nodeId]?.document;

//     const payload = {
//         fileKey,
//         nodeId,
//         getImageURL,
//         documentTree,
//         timestamp: new Date().toISOString()
//     };

//     fs.writeFileSync('./payload.json', JSON.stringify(payload, null, 2));

//     newGetImage();

// });


// Route 1: Save the raw image bytes
app.post('/convert-to-image', (req: Request, res: Response) => {
    const content = req.body; // Raw binary buffer
    const nodeId = req.headers['x-node-id'] as string;
    const fileKey = req.headers['x-file-key'] as string;

    if (!content || content.length === 0) {
        res.status(400).json({ error: 'No image data received' });
        return;
    }

    const cacheDir = path.resolve('./images');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const imagePath = path.join(cacheDir, 'image.png');
    fs.writeFileSync(imagePath, content);

    res.status(200).json({ success: true, path: imagePath });
});

// Route 2: Save the payload.json referencing the image location
app.post('/save-payload', (req: Request, res: Response) => {
    const { fileKey, nodeId, documentTree } = req.body;

    const payload = {
        fileKey,
        nodeId,
        imagePath: './images/image.png',
        documentTree,
        timestamp: new Date().toISOString()
    };

    const payloadPath = path.resolve('./payload.json');
    fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));

    res.status(200).json({ success: true, path: payloadPath });
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});