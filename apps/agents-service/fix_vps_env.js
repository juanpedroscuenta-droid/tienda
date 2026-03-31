const { Client } = require('ssh2');
const config = {
    host: '76.13.251.220',
    port: 22,
    username: 'root',
    password: '#4gsL&L9Quyt(m(a42+A'
};

const envContent = `PORT=3000
VERIFY_TOKEN=hola
WHATSAPP_PHONE_NUMBER_ID=833690719823401
ACCESS_TOKEN=EAAQPOigEjZCwBRJw2V74MjH0VCg8omXKEDEnaZB8R6DmtacGoLDp9L6ZB4dix0jZCIQnY0xcTZAqJ56IWO4fZBWLnqYj0WytCgFo5DklJBGGWWehdkb7CZCe28fVWF45pCrZC5dIVLTQEtrVG1fMiHQLMCIMoj4ePha1OWKZBoMLlKcit4ZCAzr9DZChhcA0w6vURK4WHXxyOBzIaF5AWIUCPVBvrONXdpAXkZA2lC8Q
SUPABASE_URL=https://uwgrmfxxayybglbbvhph.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Rf3YMwPQqBkIZknge2W2cg_mhBN9LTy
DEEPSEEK_API_KEY=sk-ed4f4669f629411f87a48cf7032d118c
GEMINI_API_KEY=AIzaSyCxV6ydO7lqNKzvKsQ6nCSf2Kxt4_UQW64
`;

async function main() {
    const conn = new Client();
    conn.on('ready', () => {
        conn.exec(`cat > /root/whatsapp_agent/.env << 'EOF'\n${envContent}\nEOF`, (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                console.log('✅ VPS .env updated!');
                conn.end();
            }).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
        });
    }).connect(config);
}
main();
