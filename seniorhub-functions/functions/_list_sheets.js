const { google } = require("googleapis");
const fs = require('fs');
async function run() {
    const auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/drive.readonly"]
    });
    const drive = google.drive({ version: 'v3', auth });
    
    try {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: 'files(id, name)',
        });
        console.log("Arquivos compartilhados com a service account:");
        res.data.files.forEach((file) => {
            console.log(`Name: ${file.name}, ID: ${file.id}`);
        });
    } catch (err) {
        console.error('Error fetching files:', err.message);
    }
}
run();
