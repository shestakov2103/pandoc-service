import 'dotenv/config';
import express from 'express';
import { spawn } from 'node:child_process';
import path from 'node:path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '20mb' }));

const TEMPLATES_DIR = path.join(process.cwd(), 'templates');
const REFERENCE_DOC = path.join(TEMPLATES_DIR, 'reference.docx');
const LUA_FILTER = path.join(TEMPLATES_DIR, 'filters.lua');

interface ConvertRequest {
    markdown: string;
}

app.post('/convert', (req: express.Request<{}, {}, ConvertRequest>, res: express.Response) => {
    const { markdown } = req.body;

    if (!markdown) {
        res.status(400).send({ message: 'Markdown content is required' });
        return;
    }

    const args = [
        '-f', 'markdown',
        '-t', 'docx',
        `--reference-doc=${REFERENCE_DOC}`,
        '-M', 'lang=ru-RU',
        `--lua-filter=${LUA_FILTER}`
    ];

    const child = spawn('pandoc', args);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.docx');

    child.stdout.pipe(res);

    let errorOutput = '';
    child.stderr.on('data', (chunk) => errorOutput += chunk.toString());

    child.on('close', (code) => {
        if (code !== 0) {
            console.error(`Pandoc Error: ${errorOutput}`);
            if (!res.headersSent) {
                res.status(500).send({ error: errorOutput });
            }
        }
    });

    child.on('error', (err) => {
        if (!res.headersSent) {
            res.status(500).send({ error: err.message });
        }
    });

    child.stdin.write(markdown);
    child.stdin.end();
});

app.listen(PORT, () => {
    console.log(`Pandoc Microservice running on port ${PORT}`);
});
