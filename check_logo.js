const fs = require('fs');

function getDimensions(imageBuffer) {
    // Basic PNG dimension extraction
    if (imageBuffer.toString('ascii', 1, 4) !== 'PNG') {
        console.log('Not a valid PNG file.');
        return;
    }
    const width = imageBuffer.readUInt32BE(16);
    const height = imageBuffer.readUInt32BE(20);
    console.log(`Width: ${width}, Height: ${height}`);
}

const buffer = fs.readFileSync('public/logo.png');
getDimensions(buffer);
