
const id = parseInt(req.params.id, 10);
const { text } = req.body;
const t = tickets.find(x => x.id === id);
if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
const msg = { sender: 'Vendedor', text, at: new Date().toISOString() };
t.messages.push(msg);
t.updatedAt = new Date().toISOString();


// Notificar por email al cliente
transporter.sendMail({
from: process.env.MAIL_USER || 'no-reply@tikets.local',
to: t.email,
subject: `Actualización ticket ${t.number}`,
html: `<p>El administrador ha dejado un mensaje en su ticket ${t.number}.</p><p>Mensaje: ${text}</p>`
}).catch(err => console.warn('Mail error:', err.message));


res.json({ ok: true, msg });
});


// Admin: cambiar estado
app.put('/api/admin/tickets/:id/state', (req, res) => {
const token = req.header('x-admin-token');
if (token !== (process.env.ADMIN_TOKEN || 'admintoken')) return res.status(401).json({ error: 'No autorizado' });
const id = parseInt(req.params.id, 10);
const { state } = req.body;
const valid = ['Enviado', 'En revisión', 'En resolución', 'Cerrado'];
if (!valid.includes(state)) return res.status(400).json({ error: 'Estado inválido' });
const t = tickets.find(x => x.id === id);
if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
t.state = state;
t.updatedAt = new Date().toISOString();
t.messages.push({ sender: 'Sistema', text: `Estado cambiado a: ${state}`, at: new Date().toISOString() });


// Notificar por email
transporter.sendMail({
from: process.env.MAIL_USER || 'no-reply@tikets.local',
to: t.email,
subject: `Ticket ${t.number} — estado actualizado a ${state}`,
html: `<p>Su ticket <strong>${t.number}</strong> ahora está en estado: <strong>${state}</strong>.</p>`
}).catch(err => console.warn('Mail error:', err.message));


res.json({ ok: true, ticket: t });
});


// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```