const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Para desarrollo local, puedes usar servicios como Mailtrap o EmailJS
// Para producción, considera usar SendGrid, Mailgun, o Amazon SES

// Configurar el transporte de correo electrónico usando variables de entorno
// Esto es más seguro que tener las credenciales directamente en el código
// Puedes configurar estas variables en la consola de Firebase o en un .env local
let transporter;

// Intentar configurar el transporte de correo con variables de entorno
try {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'j24291972@gmail.com',
pass: process.env.EMAIL_PASSWORD || 'ufxx grvv atvb jued'    }
  });
} catch (error) {
  console.error('Error configurando transporte de email:', error);
}

// Función de utilidad para crear el HTML del correo
const createWelcomeEmailHTML = (userName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/tienda-arg.appspot.com/o/logo-regala-algo.png?alt=media" alt="REGALA ALGO Logo" style="max-width: 200px;">
      </div>
      
      <h1 style="color: #3b82f6; text-align: center; margin-bottom: 20px;">🎉 ¡Bienvenidos a Regala Algo!</h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333;">Hola <strong>${userName}</strong>,</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333;">En nuestro local vas a encontrar todo lo que necesitas y mucho más: desde artículos para tu hogar 🏠, decoración y cotillón para tus fiestas 🪅, hasta electrodomésticos y productos que te facilitan el día a día ⚡.</p>
      
      <p style="font-size: 18px; line-height: 1.6; color: #3b82f6; font-weight: bold; text-align: center; margin: 25px 0;">💡 Un solo lugar, mil soluciones.</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333;">Te esperamos para que descubras ofertas, novedades y la mejor atención.</p>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
        <p style="font-size: 16px; line-height: 1.6; margin: 0;">
          <strong>📍 Dirección:</strong> Olavarría 610 (esquina San luis)
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin: 10px 0 0 0;">
          <strong>📞 WhatsApp:</strong> 3815087142
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://maps.app.goo.gl/gonu6cj9cJnDfJBz5?g_st=aw" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
          <span style="vertical-align: middle;">📍</span> Ver ubicación
        </a>
        <a href="https://tienda-arg.web.app" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          🛒 Explorar la tienda
        </a>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 14px;">
        <p>REGALA ALGO - Un solo lugar, mil soluciones.</p>
        <p>© ${new Date().getFullYear()} REGALA ALGO. Todos los derechos reservados.</p>
      </div>
    </div>
  `;
};

// Función que se activa cuando se crea un nuevo usuario en Firebase Auth
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  try {
    if (!transporter) {
      console.error('El transporte de correo no está configurado');
      return null;
    }

    // Esperar un momento para dar tiempo a que se cree el documento en Firestore
    // Esto ayuda a garantizar que tengamos los datos más recientes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Obtener datos adicionales del usuario desde Firestore
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    
    const userName = userData.name || user.displayName || user.email.split('@')[0];
    
    // Configurar el mensaje
    const mailOptions = {
      from: `"REGALA ALGO" <${process.env.EMAIL_USER || 'noreply@regalaalgo.com'}>`,
      to: user.email,
      subject: '🎉 ¡Bienvenido a Regala Algo - Un solo lugar, mil soluciones!',
      html: createWelcomeEmailHTML(userName)
    };

    // Registrar el evento en analytics o logs
    await admin.firestore().collection('email_logs').add({
      userId: user.uid,
      email: user.email,
      type: 'welcome',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true
    });

    // Enviar el correo
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar correo de bienvenida:', error);
    
    // Registrar el error
    await admin.firestore().collection('email_logs').add({
      userId: user?.uid || 'unknown',
      email: user?.email || 'unknown',
      type: 'welcome',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: false,
      error: error.message
    });
    
    return null;
  }
});

// Función para enviar correo después del registro manual (llamable desde la aplicación)
exports.sendRegistrationEmail = functions.https.onCall(async (data, context) => {
  try {
    // Verificar si el transporte está configurado
    if (!transporter) {
      console.error('El transporte de correo no está configurado');
      throw new functions.https.HttpsError(
        'failed-precondition',
        'El servicio de correo no está disponible temporalmente'
      );
    }

    // Validar datos
    if (!data.email || !data.name) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'El correo y nombre son obligatorios'
      );
    }

    // Sanitizar datos para evitar inyecciones
    const name = data.name.toString().trim().substring(0, 50);
    const email = data.email.toString().trim().toLowerCase();

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'El formato del correo electrónico no es válido'
      );
    }

    // Configurar el mensaje
    const mailOptions = {
      from: `"REGALA ALGO" <${process.env.EMAIL_USER || 'noreply@regalaalgo.com'}>`,
      to: email,
      subject: '🎉 ¡Bienvenido a Regala Algo - Un solo lugar, mil soluciones!',
      html: createWelcomeEmailHTML(name)
    };

    // Registrar intento de envío
    const logRef = admin.firestore().collection('email_logs').doc();
    
    await logRef.set({
      id: logRef.id,
      email: email,
      type: 'manual_welcome',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sending'
    });

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    
    // Actualizar log con éxito
    await logRef.update({
      status: 'sent',
      messageId: info.messageId
    });
    
    return { 
      success: true, 
      message: 'Correo enviado correctamente',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error al enviar correo de registro:', error);
    
    // Registrar error
    if (logRef) {
      await logRef.update({
        status: 'error',
        error: error.message
      });
    }
    
    throw new functions.https.HttpsError(
      'internal', 
      'Error al enviar el correo', 
      error.message
    );
  }
});

// Endpoint HTTP para pruebas de correo (solo para desarrollo)
exports.testEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Solo permitir peticiones POST
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    
    try {
      const { email, name } = req.body;
      
      if (!email || !name) {
        res.status(400).send({ error: 'Email y nombre son requeridos' });
        return;
      }
      
      if (!transporter) {
        res.status(500).send({ error: 'Servicio de correo no configurado' });
        return;
      }
      
      // Enviar correo de prueba
      const mailOptions = {
        from: `"REGALA ALGO Test" <${process.env.EMAIL_USER || 'test@regalaalgo.com'}>`,
        to: email,
        subject: '[PRUEBA] Bienvenido a REGALA ALGO',
        html: createWelcomeEmailHTML(name)
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      res.status(200).send({
        success: true,
        message: 'Correo de prueba enviado',
        info: {
          messageId: info.messageId,
          response: info.response
        }
      });
    } catch (error) {
      console.error('Error en prueba de correo:', error);
      res.status(500).send({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
});
