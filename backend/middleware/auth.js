const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Middleware para verificar que la petición viene de un usuario autenticado en Supabase
 * y opcionalmente verificar si es administrador.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó token de acceso' });
  }

  try {
    // Verificar el token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    // Guardar el usuario en el objeto request para uso posterior
    req.user = user;
    next();
  } catch (err) {
    console.error('Error en authenticateToken:', err);
    return res.status(500).json({ error: 'Error interno de autenticación' });
  }
};

/**
 * Middleware para asegurar que solo el administrador principal pueda realizar operaciones.
 */
const isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    // Consultar el perfil del usuario en la tabla profiles o similar para verificar isAdmin
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .maybeSingle();

    // Si el email es el admin@gmail.com (según los logs que vi antes), lo permitimos como fallback
    const isEmailAdmin = req.user.email === 'admin@gmail.com';

    if (isEmailAdmin || (data && data.is_admin)) {
      next();
    } else {
      return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
    }
  } catch (err) {
    console.error('Error en isAdmin check:', err);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

module.exports = { authenticateToken, isAdmin };
