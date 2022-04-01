const http = require('http');
const app = require('./app');

// - http.createserver() method: Returns a new instance of the http.Server class.
// Usage:
// const server = http.createServer( (req, res) => {
//     'callback function that handles every single request'
//   })
//  Ref: https://nodejs.dev/learn/the-nodejs-http-module
//
const server = http.createServer(app);

// - http.server.listen() method: Returns nothing but a callback function.
//              inbuilt application programming interface of class Server within the http module
//              which is used to start the server for accepting new connections.
// Usage:
// const server.listen(options[, callback])
//      option: It can be the port, host, path, backlog, exclusive, readableAll, writableAll, ipv6Only, etc depending upon user need.
//      callback: It is an optional parameter, it is the callback function that is passed as a parameter.
//
server.listen(process.env.NODEJS_HOST_PORT, process.env.NODEJS_HOST_NAME, () =>{
    console.log('Server up! \nListening at %s, on port %s', process.env.NODEJS_HOST_NAME, process.env.NODEJS_HOST_PORT);
});