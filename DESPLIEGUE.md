# 🚀 CampusVirtual — Guía de despliegue en Render.com

## Paso 1 — Crear cuenta en GitHub (gratis)
1. Ve a **github.com**
2. Clic en **Sign up**
3. Regístrate con tu email
4. Confirma tu email

---

## Paso 2 — Subir el código a GitHub

### Opción A — Desde el navegador (más fácil)
1. En GitHub, clic en **"+"** → **"New repository"**
2. Nombre: `campusvirtual`
3. Déjalo en **Public**
4. Clic en **"Create repository"**
5. En la página del repositorio, clic en **"uploading an existing file"**
6. Arrastra TODOS los archivos de esta carpeta (excepto `node_modules`)
7. Clic en **"Commit changes"**

### Opción B — Con Git (si tienes Git instalado)
```bash
git init
git add .
git commit -m "CampusVirtual inicial"
git remote add origin https://github.com/TU_USUARIO/campusvirtual.git
git push -u origin main
```

---

## Paso 3 — Crear cuenta en Render.com (gratis)
1. Ve a **render.com**
2. Clic en **"Get Started for Free"**
3. Regístrate con tu cuenta de GitHub

---

## Paso 4 — Crear la Base de Datos PostgreSQL en Render

1. En Render, clic en **"New +"** → **"PostgreSQL"**
2. Nombre: `campusvirtual-db`
3. Plan: **Free**
4. Clic en **"Create Database"**
5. Espera 1-2 minutos
6. Copia el valor de **"Internal Database URL"** — lo necesitas en el siguiente paso

---

## Paso 5 — Crear el Web Service en Render

1. Clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub `campusvirtual`
3. Configura así:

| Campo | Valor |
|-------|-------|
| Name | campusvirtual |
| Environment | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Plan | Free |

4. En **"Environment Variables"**, agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | (pega el Internal Database URL del paso 4) |
| `JWT_SECRET` | (escribe cualquier texto largo, ej: `MiClaveSecreta2024Campus`) |
| `NODE_ENV` | `production` |

5. Clic en **"Create Web Service"**
6. Render instala todo automáticamente (3-5 minutos)

---

## Paso 6 — Inicializar la base de datos

Una vez que el servicio esté corriendo:

1. En Render, ve a tu Web Service
2. Clic en **"Shell"** (pestaña superior)
3. Escribe: `node db/init.js`
4. Presiona Enter

Verás:
```
✅ Tablas creadas correctamente
✅ Usuario admin creado: admin@campusvirtual.co / Admin2024!
```

---

## Paso 7 — ¡Listo!

Tu plataforma está en:
```
https://campusvirtual.onrender.com
```

**Credenciales iniciales:**
- Email: `admin@campusvirtual.co`
- Contraseña: `Admin2024!`

⚠️ **Cambia la contraseña después del primer login**

---

## Notas importantes

- **Plan gratuito de Render**: el servidor se "duerme" después de 15 minutos sin uso. El primer acceso puede tardar 30-60 segundos en despertar. Para evitar esto, actualiza al plan **Starter ($7/mes)**.
- **Base de datos gratuita**: expira después de 90 días en el plan free. Para producción real, usa el plan **Starter ($7/mes)**.
- **Archivos subidos**: en el plan free los archivos no persisten entre reinicios. Para producción usa **Cloudinary** o **AWS S3** para almacenar archivos.

---

## ¿Problemas?

Si algo falla, revisa los **Logs** en Render (pestaña "Logs" del Web Service). El error más común es que `DATABASE_URL` no esté bien copiada.
