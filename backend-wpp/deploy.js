const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
console.log('Connecting...');

conn.on('ready', () => {
  console.log('Ready. Sending files...');
  conn.sftp((err, sftp) => {
    
    // Command to execute on server
    const execConfig = () => {
      conn.exec('mkdir -p /root/backend-wpp && cd /root/backend-wpp && npm install && npm i -g pm2 && pm2 delete backend-wpp || true && pm2 start index.js --name "backend-wpp" && ufw allow 3005', (err, stream) => {
        stream.on('close', () => { 
           console.log('Done Deploy!'); 
           conn.end(); 
        }).on('data', d => console.log(''+d)).stderr.on('data', d => console.log('ERR: '+d));
      });
    };

    sftp.mkdir('/root/backend-wpp', () => {
      // Ignore error if dir exists
      sftp.fastPut(path.join(__dirname, 'index.js'), '/root/backend-wpp/index.js', (err) => {
         console.log('index.js -> OK');
         sftp.fastPut(path.join(__dirname, 'package.json'), '/root/backend-wpp/package.json', (err) => {
            console.log('package.json -> OK');
            execConfig();
         });
      });
    });
  });
}).connect({host: '76.13.251.220', port: 22, username: 'root', password: '4bHQx&@fU&H(eN#\'qu?C'});
