/* =========================================================
   🎟️ TIKETS — Script principal
   Maneja toda la interacción de las páginas:
   index.html, track.html, admin.html, detail.html
   ========================================================= */

// 🔹 Utilidad: obtener nombre del archivo HTML actual
const currentPage = window.location.pathname.split("/").pop();

/* =========================================================
   🏠 INDEX.HTML — Crear ticket y consultar estado
   ========================================================= */
if (currentPage === "index.html" || currentPage === "") {
  const ticketForm = document.getElementById("ticketForm");
  const resultBox = document.getElementById("ticketResult");
  const ticketNumber = document.getElementById("ticketNumber");

  const consultForm = document.getElementById("consultForm");
  const ticketInfo = document.getElementById("ticketInfo");
  const ticketStatus = document.getElementById("ticketStatus");
  const ticketDesc = document.getElementById("ticketDesc");

  // ✅ Crear ticket (simulado)
  if (ticketForm) {
    ticketForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const randomTicket = "TKT-" + Date.now().toString().slice(-6);
      ticketNumber.textContent = randomTicket;
      resultBox.style.display = "block";
      ticketForm.reset();

      // Aquí se puede hacer un fetch real:
      // fetch('/api/tickets', { method: 'POST', body: new FormData(ticketForm) })
    });
  }

  // 🔍 Consultar ticket (simulado)
  if (consultForm) {
    consultForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const num = document.getElementById("ticketSearch").value.trim();
      if (!num) return;

      ticketInfo.style.display = "block";
      ticketStatus.textContent = "En revisión";
      ticketStatus.className = "status revision";
      ticketDesc.textContent = "Su ticket está siendo evaluado por el equipo de soporte.";
    });
  }
}

/* =========================================================
   📦 TRACK.HTML — Seguimiento de ticket por cliente
   ========================================================= */
if (currentPage === "track.html") {
  const form = document.getElementById("trackForm");
  const dataBox = document.getElementById("ticketData");
  const statusBox = document.getElementById("status");
  const descBox = document.getElementById("descripcion");
  const messagesBox = document.getElementById("messages");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const num = document.getElementById("ticketNumber").value.trim();
      if (!num) return;

      // Simulación de consulta de ticket
      dataBox.style.display = "block";
      statusBox.textContent = "En revisión";
      statusBox.className = "status revision";
      descBox.textContent = "Estamos revisando tu caso. Te contactaremos pronto.";

      messagesBox.innerHTML = `
        <div class="message cliente">Cliente: Envié la queja el lunes.</div>
        <div class="message vendedor">Soporte: Hemos recibido tu solicitud. Está en revisión.</div>
        <div class="message sistema">Estado cambiado a En revisión</div>
      `;
    });
  }
}

/* =========================================================
   🧮 ADMIN.HTML — Panel de administración
   ========================================================= */
if (currentPage === "admin.html") {
  const table = document.getElementById("ticketsTable");

  if (table) {
    const tickets = [
      { id: "TKT-2025-001", nombre: "Carlos Pérez", estado: "enviado", fecha: "2025-11-12" },
      { id: "TKT-2025-002", nombre: "María Gómez", estado: "revision", fecha: "2025-11-10" },
      { id: "TKT-2025-003", nombre: "Luis Rojas", estado: "resolucion", fecha: "2025-11-09" }
    ];

    tickets.forEach(t => {
      table.innerHTML += `
        <tr>
          <td>${t.id}</td>
          <td>${t.nombre}</td>
          <td><span class="status ${t.estado}">${t.estado}</span></td>
          <td>${t.fecha}</td>
          <td><a href="detail.html?id=${t.id}" class="btn btn-outline">Ver</a></td>
        </tr>
      `;
    });
  }
}

/* =========================================================
   🧾 DETAIL.HTML — Detalle del ticket (vista admin)
   ========================================================= */
if (currentPage === "detail.html") {
  const estadoSelect = document.getElementById("estado");
  const status = document.getElementById("ticketStatus");
  const history = document.getElementById("history");
  const msgInput = document.getElementById("newMessage");
  const sendMsg = document.getElementById("sendMsg");
  const updateEstado = document.getElementById("updateEstado");

  // Cambiar estado del ticket
  if (updateEstado) {
    updateEstado.addEventListener("click", () => {
      const nuevo = estadoSelect.value;
      status.textContent = nuevo.charAt(0).toUpperCase() + nuevo.slice(1);
      status.className = "status " + nuevo;

      const msg = document.createElement("div");
      msg.className = "message sistema";
      msg.textContent = "Estado cambiado a " + nuevo;
      history.appendChild(msg);
    });
  }

  // Enviar mensaje al cliente
  if (sendMsg) {
    sendMsg.addEventListener("click", () => {
      const text = msgInput.value.trim();
      if (!text) return;
      const msg = document.createElement("div");
      msg.className = "message vendedor";
      msg.textContent = "Admin: " + text;
      history.appendChild(msg);
      msgInput.value = "";
    });
  }
}
