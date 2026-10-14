import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();
const port = 3000;

app.get('/getImage', async (req: Request, res: Response) => {
    const getImageURL = req.query.url as string | undefined;
    const FigmaKEY = process.env.FIGMA_TOKEN;

    if (!getImageURL || !FigmaKEY) {
        res.status(400).json({ error: 'Missing image URL or Figma token' });
        return;
    }

    try {
        const response = await fetch(getImageURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${FigmaKEY}`,
                'X-Figma-Token': FigmaKEY
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