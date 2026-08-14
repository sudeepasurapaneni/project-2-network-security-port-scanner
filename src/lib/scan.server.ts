import net from "node:net";

export const COMMON_PORTS: Record<number, string> = {
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  143: "IMAP",
  443: "HTTPS",
  445: "SMB",
  3306: "MySQL",
  3389: "RDP",
  5432: "PostgreSQL",
  8080: "HTTP Proxy / Alternate HTTP",
};

export function identifyService(port: number): string {
  return COMMON_PORTS[port] ?? "Unknown";
}

export type PortResult = {
  port: number;
  status: "OPEN" | "CLOSED" | "FILTERED" | "ERROR";
  protocol: "TCP";
  service: string;
  detail: string;
};

export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every(
    (p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255,
  );
}

/** Real TCP connect check against one port. */
export function scanPort(
  host: string,
  port: number,
  timeoutMs: number,
): Promise<PortResult> {
  return new Promise((resolve) => {
    const base = { port, protocol: "TCP" as const, service: identifyService(port) };
    let settled = false;
    const socket = new net.Socket();

    const finish = (
      status: PortResult["status"],
      detail: string,
    ) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve({ ...base, status, detail });
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish("OPEN", "TCP handshake succeeded"));
    socket.once("timeout", () => finish("FILTERED", "No response before timeout"));
    socket.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ECONNREFUSED") finish("CLOSED", "Connection refused");
      else if (err.code === "EHOSTUNREACH" || err.code === "ENETUNREACH")
        finish("ERROR", "Host unreachable");
      else if (err.code === "ETIMEDOUT")
        finish("FILTERED", "No response before timeout");
      else finish("ERROR", err.code ?? err.message ?? "Connection error");
    });

    try {
      socket.connect(port, host);
    } catch (e) {
      finish("ERROR", e instanceof Error ? e.message : "Connection error");
    }
  });
}

/** Scan a port range with limited concurrency. */
export async function scanRange(
  host: string,
  startPort: number,
  endPort: number,
  timeoutMs: number,
): Promise<PortResult[]> {
  const ports: number[] = [];
  for (let p = startPort; p <= endPort; p++) ports.push(p);

  const results: PortResult[] = [];
  const concurrency = 40;
  let index = 0;

  async function worker() {
    while (index < ports.length) {
      const i = index++;
      results.push(await scanPort(host, ports[i]!, timeoutMs));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, ports.length) }, worker),
  );

  results.sort((a, b) => a.port - b.port);
  return results;
}
