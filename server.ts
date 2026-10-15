import express, { type Express, type Request, type Response } from 'express';
import CORS from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

const app: Express = express();
const port = 3000;

app.use(CORS());
app.use(express.json());

app.post('/getImage', async (req: Request, res: Response) => {
    let getImageURL = "https://api.figma.com/v1/images/"
    const FigmaKEY = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;

    let nodeId = req.body.nodeId?.toString() || "";
    let fileKey = req.body.fileKey?.toString() || "";

    console.log("fileKey: ", fileKey);
    console.log("nodeId: ", nodeId);
    console.log("FigmaKEY: ", FigmaKEY);

    getImageURL += fileKey + "?ids=" + nodeId + "&format=png&scale=1&use_absolute_bounds=true";

    console.log("getImageURL: ", getImageURL);

    if (!getImageURL || !FigmaKEY) {
        res.status(400).json({ error: 'Missing image URL or Figma token' });
        return;
    }

    try {
        const response = await fetch(getImageURL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Figma-Token': FigmaKEY as string
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});