type PingServer = {
  region: string;
  url: string;
};

const PING_SERVERS: PingServer[] = [
  {
    region: "lnd-atl",
    url: "",
  },
  {
    region: "lnd-fra",
    url: "",
  },
  {
    region: "lnd-sfo",
    url: "",
  },
  {
    region: "lnd-syd",
    url: "",
  },
  {
    region: "lnd-tok",
    url: "",
  },
];

const pingServer = async (
  server: PingServer,
  { times = 3, timeout = 1000 } = {}
) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(server.url);

    const latencies: number[] = [];
    let lastPingedAt: number = 0;
    let pingCount = 0;

    function sendPing() {
      ws.send("ping");
      lastPingedAt = Date.now();
      pingCount++;
    }

    ws.onopen = () => {
      console.log(`Connected to ${server.region} server`);
      sendPing();
    };

    ws.onmessage = (event) => {
      if (event.data === "pong") {
        const latency = Date.now() - lastPingedAt;
        latencies.push(latency);
        if (pingCount < times) {
          sendPing();
        } else {
          // Return avg latency
          const avgLatency =
            latencies.reduce((a, b) => a + b, 0) / latencies.length;
          ws.close();
          resolve(avgLatency);
        }
      }
    };
  });
};

const pingAllServers = async () => {
  const results = await Promise.all(
    PING_SERVERS.map((server) => ({
      ...server,
      // TODO: Need to handle ping timeout
      latency: pingServer(server),
    }))
  );
};

console.log(await pingAllServers());
