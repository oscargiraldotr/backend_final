// /backend/server.js
require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require('fs');
const path = require('path');

// conectar MongoDB (usa MONGODB_URI de .env)
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://oscargiraldo0405_db_user:<db_password>@alma.5gic8wd.mongodb.net/?appName=Alma', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB conectados'))
  .catch(err => console.error('MongoDB error:', err));

const app = express();
const PORT = process.env.PORT || 3000;

// habilitar CORS (ajusta origin en producción)
const NETLIFY_URL = process.env.FRONTEND_URL || true; // usar FRONTEND_URL en Render
app.use(cors({ origin: NETLIFY_URL }));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paths
const BACKEND_DIR = __dirname;
const UPLOADS_DIR = path.join(BACKEND_DIR, "uploads");
const DB_FILE = path.join(BACKEND_DIR, 'tickets.json');

// Asegurar que el directorio de uploads exista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer config (campo esperado: "files")
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

// Modelo Mongoose simple (añádelo antes de las rutas que usan tickets)
const { Schema } = mongoose;
const TicketSchema = new Schema({
  id: { type: String, required: true, unique: true },
  nombre: String,
  correo: String,
  descripcion: String,
  estado: { type: String, default: 'enviado' },
  mensajes: [{ tipo: String, texto: String, fecha: Date }],
  archivos: [String],
  fecha: { type: Date, default: Date.now }
});
const Ticket = mongoose.model('Ticket', TicketSchema);

// Helpers DB (archivo JSON)
function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Normalizar lectura de campos del formulario (acepta varios nombres)
function getFormField(body, names) {
  for (const n of names) {
    if (body[n] !== undefined) return body[n];
  }
  return "";
}

/* ================================
   RUTAS API
   Base: /api
   ================================ */
const BASE = "/api";

/**
 * POST /api/tickets
 * Crea un ticket. Acepta archivos en campo "files".
 * Respuesta: { success: true, ticketId: '<id>', ticket: {...} }
 */
app.post(`${BASE}/tickets`, upload.array("archivos", 6), (req, res) => {
  try {
    const db = readDB();

    // aceptar distintos nombres posibles en los forms
    const nombre = getFormField(req.body, ["nombre", "name", "fullName"]);
    const cedula = getFormField(req.body, ["cedula", "idNumber", "dni"]);
    const correo = getFormField(req.body, ["correo", "email", "mail"]);
    const telefono = getFormField(req.body, ["telefono", "phone"]);
    const descripcion = getFormField(req.body, ["descripcion", "description", "message"]);

    const id = uuidv4().split("-")[0]; // id corto
    const now = new Date().toISOString();

    const archivos = (req.files || []).map(f => `/uploads/${path.basename(f.filename)}`);

    // ticket object
    const ticket = {
      id,
      nombre,
      cedula,
      correo,
      telefono,
      descripcion,
      archivos,             // rutas públicas relativas: /uploads/...
      estado: "enviado",    // enviado, en revision, en resolucion, cerrado
      fecha: now,
      mensajes: [
        { autor: "Cliente", tipo: "cliente", texto: descripcion || "", fecha: now }
      ]
    };

    db.push(ticket);
    writeDB(db);

    // devolver id conveniente (script.js espera ticketId)
    return res.json({ success: true, ticketId: id, ticket });
  } catch (err) {
    console.error("POST /tickets error:", err);
    return res.status(500).json({ error: "Error creando ticket" });
  }
});

/**
 * GET /api/tickets
 * Lista todos los tickets (para admin)
 */
app.get(`${BASE}/tickets`, (req, res) => {
  const db = readDB();
  // devolver con campos relevantes
  const list = db.map(t => ({
    id: t.id,
    nombre: t.nombre,
    estado: t.estado,
    fecha: t.fecha
  }));
  res.json(list);
});

/**
 * GET /api/tickets/:id
 * Obtiene un ticket por id
 */
app.get(`${BASE}/tickets/:id`, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const ticket = db.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });
  res.json(ticket);
});

/**
 * PUT /api/tickets/:id/estado
 * Cambia estado del ticket. Body: { estado: "en revision" }
 * Añade mensaje del sistema al historial y guarda.
 */
app.put(`${BASE}/tickets/:id/estado`, (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const db = readDB();
  const ticket = db.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });

  ticket.estado = estado;
  const now = new Date().toISOString();
  ticket.mensajes.push({ autor: "Sistema", tipo: "sistema", texto: `Estado cambiado a: ${estado}`, fecha: now });
  ticket.fecha = now; // actualizar fecha última modificación (opcional)

  writeDB(db);
  res.json(ticket);
});

/**
 * POST /api/tickets/:id/mensajes
 * Agrega un mensaje al ticket.
 * Body: { texto: "...", tipo: "admin"|"cliente" , autor: "Admin" }
 */
app.post(`${BASE}/tickets/:id/mensajes`, (req, res) => {
  const { id } = req.params;
  const { texto, tipo, autor } = req.body;
  const db = readDB();
  const ticket = db.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });

  const now = new Date().toISOString();
  // Normalizar tipo/autor
  const normalizedTipo = tipo || (autor && autor.toLowerCase().includes("admin") ? "vendedor" : "cliente");
  const mensaje = { autor: autor || (normalizedTipo === "vendedor" ? "Admin" : "Cliente"), tipo: normalizedTipo, texto: texto || "", fecha: now };

  ticket.mensajes.push(mensaje);
  ticket.fecha = now;

  writeDB(db);
  res.json(ticket);
});

/**
 * POST /api/login
 * Login simple de admin.
 * Acepta { usuario, clave } o { email, password }.
 * Devuelve { token: 'token-demo' } en caso correcto.
 */
app.post(`${BASE}/login`, (req, res) => {
  const { usuario, clave, email, password } = req.body;

  const user = usuario || email;
  const pass = clave || password;

  // credenciales temporales para demo
  const ADMIN_USER = process.env.ADMIN_USER || "admin@tikets.com";
  const ADMIN_PASS = process.env.ADMIN_PASS || "12345";

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return res.json({ token: "token-demo" });
  } else {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
});

/* ===========================
   Iniciar servidor
   =========================== */
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
  console.log(`Uploads -> ${UPLOADS_DIR}`);
});
