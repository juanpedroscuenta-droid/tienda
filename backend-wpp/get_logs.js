const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('pm2 logs backend-wpp --lines 50 --nostream', (err, stream) => {
     if(err) throw err;
     stream.on('close', () => { conn.end(); })
           .on('data', d => console.log(''+d))
           .stderr.on('data', d => console.error(''+d));
  });
}).connect({host: '76.13.251.220', port: 22, username: 'root', password: '4bHQx&@fU&H(eN#\'qu?C'});
