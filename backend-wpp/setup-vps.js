const { Client } = require('ssh2');
const conn = new Client();

console.log('Connecting to VPS to configure permanent HTTPS/SSL endpoint...');

conn.on('ready', () => {
  const script = `
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y nginx certbot python3-certbot-nginx
    
    cat > /etc/nginx/sites-available/wpp << 'EOF'
server { 
    listen 80; 
    server_name 76-13-251-220.sslip.io; 
    
    location / { 
        proxy_pass http://localhost:3005; 
        proxy_set_header Host $host; 
        proxy_set_header X-Real-IP $remote_addr; 
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    } 
}
EOF

    ln -sf /etc/nginx/sites-available/wpp /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    systemctl restart nginx
    
    certbot --nginx -d 76-13-251-220.sslip.io --non-interactive --agree-tos -m admin@tienda24-7.com
    
    ufw allow 80
    ufw allow 443
    systemctl restart nginx
  `;
  
  conn.exec(script, (err, stream) => {
     if(err) throw err;
     stream.on('close', () => { 
        console.log('NGINX and SSL deployed successfully!'); 
        conn.end(); 
     }).on('data', d => process.stdout.write('OUT: ' + d)).stderr.on('data', d => process.stderr.write('ERR: ' + d));
  });
}).connect({
  host: '76.13.251.220', 
  port: 22, 
  username: 'root', 
  password: '4bHQx&@fU&H(eN#\'qu?C'
});
