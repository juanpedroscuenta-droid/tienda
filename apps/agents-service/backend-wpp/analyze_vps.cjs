const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec("ls -la /root/tienda; ls -la /root/backend-wpp; pm2 list; cat /etc/nginx/sites-enabled/tienda.conf; cat /etc/nginx/sites-enabled/wpp", (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '76.13.251.220',
  port: 22,
  username: 'root',
  password: '3d+H&p/GB3nAx;qfWH#a'
});
