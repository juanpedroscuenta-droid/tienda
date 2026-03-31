const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function stopVPS() {
    try {
        console.log('🔄 Conectando al VPS para liberar el puerto 3005...');
        await ssh.connect({
            host: '76.13.251.220',
            username: 'root',
            password: 'pM#,hVHWn+cgR@;5Aqc5'
        });

        // Detenemos el bot si está corriendo en PM2
        await ssh.execCommand('pm2 stop whatsapp_agent || true');
        console.log('✅ Bot detenido en la VPS. Puerto 3005 liberado.');
        ssh.dispose();
    } catch (err) {
        console.error('❌ Error al detener el bot en el VPS:', err.message);
        if (ssh) ssh.dispose();
    }
}

stopVPS();
