'use strict';

const express = require('express');
const http = require('http');
const nocache = require('nocache');
const expressSession = require('express-session');
const expressEjsLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const memoryStore = require('memorystore');

const config = require('./utils/config');
const router = require('./router/web');
const { commonVariables } = require('./middleware/root');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const MemoryStore = memoryStore(expressSession);
const sessionStore = new MemoryStore({
  checkPeriod: config.sessionMaxLife,
});

app.use(nocache());
app.use(cookieParser());

app.use(expressSession({
  secret: config.sessionSecret,
  saveUninitialized: true,
  cookie: {
    maxAge: config.sessionMaxLife * 1000,
    secure: config.isProd,
  },
  resave: false,
  store: sessionStore,
}));

app.use(expressEjsLayouts);
app.set('layout', 'mainLayout');
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use('/static', express.static(path.resolve(__dirname, 'public')));
app.use('/', commonVariables);

app.use(express.urlencoded({ extended: true }));

app.use(router);

module.exports = {
  io,
  sessionStore,
};

require('./socket/handler');

httpServer.listen(config.port, () => {
  console.log(`Server started at port: ${config.port}`);
});
