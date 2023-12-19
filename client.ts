type PingServer = {
  region: string;
  url: string;
};

// TODO: Add rivet urls to the rivet servers on these regions.
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

function average(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Pings the server to measure the latency.
 *
 * @param {PingServer} server - The server to ping.
 * @param {Object} [options] - Optional parameters.
 * @param {number} [options.times=3] - Number of times to ping the server.
 * @param {number} [options.timeout=1000] - Timeout duration in milliseconds.
 * @returns {Promise<number>} - A promise that resolves with the average latency in milliseconds.
 */
async function pingServer(
  server: PingServer,
  { times = 3, timeout = 1000 } = {}
) {
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
}


/**
 * Ping all servers and return the ones that respond with latency.
 *
 * Note: Pinging is done in parallel. This may lead to the requests
 * contending for the same resources on the system, affecting the
 * perceived latency of each request. Keep this in mind when interpreting
 * the results.
 *
 * @returns {Promise<Array<{name: string, url: string, latency: number}>>} - An array of server objects with name, url, and latency.
 */
async function pingAllServers() {
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
}

console.log(await pingAllServers());
