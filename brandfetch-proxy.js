import express from 'express';
import fetch from 'node-fetch';
const app = express();
const API_KEY = process.env.BRANDFETCH_KEY;

app.get('/brandkit', async (req, res) => {
    const { domain } = req.query;
    try {
        const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
            headers: { Authorization: `Bearer ${API_KEY}` },
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy listening on port ${PORT}`);
});
