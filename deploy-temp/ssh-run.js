const { Client } = require('ssh2');

const config = {
  host: '76.13.251.220',
  port: 22,
  username: 'root',
  password: '7Nqz9?Za9f(xosnOF(gT'
};

const runCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log('Client :: ready');
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let output = '';
        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ output, code });
        }).on('data', (data) => {
          output += data;
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    }).on('error', reject).connect(config);
  });
};

const main = async () => {
  try {
    const cmd = process.argv.slice(2).join(' ');
    if (!cmd) {
      console.log('Usage: node ssh-run.js "command"');
      process.exit(1);
    }
    await runCommand(cmd);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

main();
