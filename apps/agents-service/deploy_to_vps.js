const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '76.13.251.220',
    port: 22,
    username: 'root',
    password: '5-IatzGYCD,Jsf7N7@hV'
};

async function deploy() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log('✅ Connected to VPS!');
            
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                
                const localFile = path.resolve(__dirname, 'index.js');
                const remoteFile = '/root/whatsapp_agent/index.js';
                
                console.log(`📤 Uploading ${localFile} to ${remoteFile}...`);
                
                sftp.fastPut(localFile, remoteFile, (err) => {
                    if (err) {
                        console.error('❌ Error uploading file:', err.message);
                        conn.end();
                        return reject(err);
                    }
                    console.log('✅ File uploaded successfully!');
                    
                    console.log('🔄 Restarting whatsapp_agent service...');
                    conn.exec('pm2 restart whatsapp_agent', (err, stream) => {
                        if (err) {
                            console.error('❌ Error executing restart:', err.message);
                            conn.end();
                            return reject(err);
                        }
                        
                        stream.on('close', (code, signal) => {
                            console.log(`✅ Service restarted! (Code: ${code})`);
                            conn.end();
                            resolve();
                        }).on('data', (data) => {
                            process.stdout.write(data);
                        }).stderr.on('data', (data) => {
                            process.stderr.write(data);
                        });
                    });
                });
            });
        }).on('error', (err) => {
            console.error('❌ Connection error:', err.message);
            reject(err);
        }).connect(config);
    });
}

deploy().catch(console.error);
