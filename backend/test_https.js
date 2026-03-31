const https = require('https');

https.get('https://uwgrmfxxayybglbbvhph.supabase.co/rest/v1/', (res) => {
    console.log('Status Code:', res.statusCode);
    res.on('data', (d) => {
        // process.stdout.write(d);
    });
}).on('error', (e) => {
    console.error('❌ Error HTTPS:', e.message);
});
