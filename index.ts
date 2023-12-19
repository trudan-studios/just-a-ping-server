Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Only websocket upgrade requests are allowed", {
      status: 400,
    });
  },
  websocket: {
    message(ws, message) {
      if (message === "ping") {
        ws.send("pong");
      }
    },
  },
});

console.log("Started server on port 3000");
