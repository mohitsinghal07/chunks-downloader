const https = require('https');
const fs = require('fs');
const url = require('url');
const path = require('path');
const { spawn } = require('child_process');

// Replace the API endpoint with your own
// https://hsprepack.akamaized.net/videos/bharat/rakrsb/2/master_Layer4_00012.ts
const apiUrl = 'https://hsprepack.akamaized.net/videos/bharat/rakrsb/2/master_Layer4_';

// Define the options for the GET request
const options = {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
  }
};

// Create the downloads directory if it doesn't exist
if (!fs.existsSync('downloads')) {
    fs.mkdirSync('downloads');
}

// Send the GET request to the API endpoint multiple times
const numOfRequests = 5;
const chunkFilenames = [];
for (let i = 1; i <= numOfRequests; i++) {
    const fileNumber = i.toString().padStart(5, '0'); // convert the file number to string and pad with leading zeros
  
    const newUrl = apiUrl + fileNumber + '.ts'; // generate the URL for the request

    // Get the filename from the API endpoint URL
    const filename = 'downloads/' + url.parse(newUrl).pathname.split('/').pop();
  
    // Send the GET request to the API endpoint
    https.get(newUrl, options, res => {
        // Create a write stream to save the file
        const fileStream = fs.createWriteStream(filename);
    
        // Pipe the response stream to the write stream to save the file
        res.pipe(fileStream);
    
        // Handle errors during the download
        fileStream.on('error', err => console.error(err));
        res.on('error', err => console.error(err));
        res.on('end', () => {
          console.log(`Downloaded ${filename}`);
          chunkFilenames.push(filename);
          if (chunkFilenames.length === numOfRequests) {
            // Sort the chunk filenames in ascending order
            chunkFilenames.sort();

            // Concatenate the chunks into an MP4 file
            const mp4Filename = 'downloads/output.mp4';
            const ffmpeg = spawn('ffmpeg', ['-i', `concat:${chunkFilenames.join('|')}`, '-c', 'copy', mp4Filename]);
    
            // Handle errors during the concatenation
            ffmpeg.stderr.on('data', data => console.error(data.toString()));
            ffmpeg.on('exit', () => {
              console.log(`Finished concatenating the chunks into ${mp4Filename}`);
              // Delete the chunk files
              for (const filename of chunkFilenames) {
                fs.unlinkSync(filename);
              }
            });
          }
        });
      });
  }

