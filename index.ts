Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed :(", { status: 500 });
  }, // upgrade logic
  websocket: {
    message(ws, message) {
      // Return pong for a ping
      if (message === "ping") {
        ws.send("pong");
      }
    }, // a message is received
    open(ws) {}, // a socket is opened
    close(ws, code, message) {}, // a socket is closed
    drain(ws) {}, // the socket is ready to receive more data
  },
});

console.log("Started server on port 3000");