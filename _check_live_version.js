const https = require('https');
https.get('https://rainha.e-dolphin.info/', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const authMatch = data.match(/auth\.js\?v=([0-9.]+)/);
    console.log('Script auth.js version on LIVE site:', authMatch ? authMatch[1] : 'NOT FOUND');
  });
});
