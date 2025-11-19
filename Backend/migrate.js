require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const { Schema } = mongoose;

const TicketSchema = new Schema({
  id: String, nombre: String, correo: String, descripcion: String,
  estado: String, mensajes: Array, archivos: Array, fecha: Date
});
const Ticket = mongoose.model('Ticket', TicketSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const data = JSON.parse(fs.readFileSync('tickets.json', 'utf8'));
  if (!Array.isArray(data)) throw new Error('tickets.json debe ser un array');
  await Ticket.insertMany(data.map(t => ({ ...t, fecha: t.fecha ? new Date(t.fecha) : new Date() })));
  console.log('Migración completada');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });