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

const average = (nums: number[]) =>
  nums.reduce((a, b) => a + b, 0) / nums.length;

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

    setTimeout(() => {
      if (pingCount < times) {
        reject(new Error(`Ping timed out after ${timeout}ms`));
      } else {
        // Return avg latency
        ws.close();
        resolve(average(latencies));
      }
    }, timeout);

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
          ws.close();
          resolve(average(latencies));
        }
      }
    };
  });
};

/**
 * Pings all servers in parallel and returns the results.
 *
 * Note: doing this in parallel may affect results since the
 * network requests may be competing for bandwidth.
 */
const pingAllServers = async () => {
  const results = await Promise.all(
    PING_SERVERS.map(async (server) => ({
      ...server,
      latency: await pingServer(server).catch((e) => {
        console.error(e);
        return null;
      }),
    }))
  );

  return results.filter((r) => r.latency !== null);
};

console.log(await pingAllServers());
