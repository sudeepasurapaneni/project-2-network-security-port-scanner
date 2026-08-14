import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { runScan } from "@/lib/scan.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IP Port Scanner — Real TCP Port Scanning Tool" },
      {
        name: "description",
        content:
          "Educational IP port scanner that performs real TCP connection checks on any valid IPv4 address, with service detection and CSV/TXT export.",
      },
      { property: "og:title", content: "IP Port Scanner — Real TCP Port Scanning Tool" },
      {
        property: "og:description",
        content:
          "Scan any authorized IPv4 host for open TCP ports. Real socket checks, likely-service detection, CSV and TXT export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScannerPage,
});

type Result = {
  port: number;
  status: string;
  protocol: string;
  service: string;
  detail: string;
};

const statusClass: Record<string, string> = {
  OPEN: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CLOSED: "bg-muted text-muted-foreground border-border",
  FILTERED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ERROR: "bg-destructive/15 text-destructive border-destructive/30",
};

function ScannerPage() {
  const scan = useServerFn(runScan);

  const [target, setTarget] = useState("127.0.0.1");
  const [startPort, setStartPort] = useState("1");
  const [endPort, setEndPort] = useState("100");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);
  const [meta, setMeta] = useState<{ target: string; durationMs: number } | null>(null);

  function validate(): string | null {
    const parts = target.trim().split(".");
    const validIp =
      parts.length === 4 &&
      parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
    if (!validIp) return "Enter a valid IPv4 address (e.g. 192.168.1.1).";
    const s = Number(startPort);
    const e = Number(endPort);
    if (!Number.isInteger(s) || s < 1 || s > 65535) return "Start port must be 1–65535.";
    if (!Number.isInteger(e) || e < 1 || e > 65535) return "End port must be 1–65535.";
    if (e < s) return "End port must be greater than or equal to start port.";
    if (e - s + 1 > 1024) return "Please scan at most 1024 ports at a time.";
    return null;
  }

  async function onScan(ev: React.FormEvent) {
    ev.preventDefault();
    const v = validate();
    setResults(null);
    setMeta(null);
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await scan({
        data: {
          target: target.trim(),
          startPort: Number(startPort),
          endPort: Number(endPort),
        },
      });
      if (!res.ok) setError(res.error);
      else {
        setResults(res.results);
        setMeta({ target: res.target, durationMs: res.durationMs });
      }
    } catch {
      setError("The scan request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function download(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    if (!results || !meta) return;
    const rows = [
      ["Target", "Port", "Status", "Protocol", "Likely Service", "Detail"],
      ...visible.map((r) => [
        meta.target,
        String(r.port),
        r.status,
        r.protocol,
        r.service,
        r.detail,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    download(`scan_${meta.target}_${Date.now()}.csv`, csv, "text/csv");
  }

  function exportTxt() {
    if (!results || !meta) return;
    const lines = [
      `IP Port Scanner report`,
      `Target: ${meta.target}`,
      `Generated: ${new Date().toISOString()}`,
      `Duration: ${meta.durationMs} ms`,
      ``,
      `PORT      STATUS     PROTOCOL  LIKELY SERVICE`,
      ...visible.map(
        (r) =>
          `${String(r.port).padEnd(10)}${r.status.padEnd(11)}${r.protocol.padEnd(10)}${r.service}`,
      ),
    ];
    download(
      `scan_${meta.target}_${Date.now()}.txt`,
      lines.join("\n"),
      "text/plain",
    );
  }

  const visible = (results ?? []).filter((r) => (onlyOpen ? r.status === "OPEN" : true));
  const openCount = (results ?? []).filter((r) => r.status === "OPEN").length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Educational cybersecurity project
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            IP Port Scanner
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Enter any valid IPv4 address and a port range. The backend opens real TCP
            sockets to each port and reports whether it is open, closed or filtered.
          </p>
        </header>

        <div
          role="note"
          className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300"
        >
          <strong className="font-semibold">Authorized use only.</strong> Scan only
          systems you own or have explicit written permission to test. Unauthorized
          port scanning may be illegal in your jurisdiction.
        </div>

        <form
          onSubmit={onScan}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="target" className="mb-1.5 block text-sm font-medium">
                Target IPv4 address
              </label>
              <input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="192.168.1.1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="start" className="mb-1.5 block text-sm font-medium">
                Start port
              </label>
              <input
                id="start"
                inputMode="numeric"
                value={startPort}
                onChange={(e) => setStartPort(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="end" className="mb-1.5 block text-sm font-medium">
                End port
              </label>
              <input
                id="end"
                inputMode="numeric"
                value={endPort}
                onChange={(e) => setEndPort(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {loading ? "Scanning…" : "Scan"}
            </button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(e) => setOnlyOpen(e.target.checked)}
              />
              Show only open ports
            </label>
            <span className="text-xs text-muted-foreground">
              Max 1024 ports per scan
            </span>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
        </form>

        {loading && (
          <p className="mt-6 text-sm text-muted-foreground">
            Opening TCP connections… larger ranges take longer.
          </p>
        )}

        {results && meta && (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{meta.target}</span> ·{" "}
                {results.length} ports probed · {openCount} open · {meta.durationMs} ms
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportCsv}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  Export CSV
                </button>
                <button
                  onClick={exportTxt}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  Export TXT
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Port</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Protocol</th>
                    <th className="px-4 py-3">Likely service</th>
                    <th className="px-4 py-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.port} className="border-t border-border">
                      <td className="px-4 py-2 font-mono">{r.port}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass[r.status] ?? ""}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{r.protocol}</td>
                      <td className="px-4 py-2">{r.service}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.detail}</td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        No ports match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Service names are a best-guess lookup from well-known port numbers, not
              proof of what is actually running.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
