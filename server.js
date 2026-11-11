const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// স্ট্যাটিক ফোল্ডার এবং ভিডিও স্ট্রিমিং রাউট
app.use(express.static('public'));

// মুভি লিস্ট দেখানোর API
app.get('/api/movies', (req, res) => {
    const moviesDir = path.join(__dirname, 'movies');
    if (!fs.existsSync(moviesDir)) {
        fs.mkdirSync(moviesDir);
    }
    fs.readdir(moviesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Unable to scan movies folder" });
        }
        const videoFiles = files.filter(file => file.endsWith('.mp4') || file.endsWith('.mkv'));
        res.json(videoFiles);
    });
});

// ভিডিও স্ট্রিমিং রাউট (যাতে টেনে দেখা যায় / Seek করা যায়)
app.get('/watch/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'movies', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Movie not found!');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});