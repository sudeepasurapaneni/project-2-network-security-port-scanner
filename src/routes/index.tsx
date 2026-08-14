import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IP Port Scanner — Python TCP Scanner Project" },
      {
        name: "description",
        content:
          "A beginner-friendly Flask + Python socket TCP port scanner: setup, usage, and viva notes for the college assignment.",
      },
      { property: "og:title", content: "IP Port Scanner — Python TCP Scanner Project" },
      {
        property: "og:description",
        content:
          "Flask backend, HTML/CSS/JS frontend, real TCP connect scanning with Python sockets. Run it locally in two commands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const files = [
  "ip-port-scanner/",
  "    app.py              # Flask server + API routes",
  "    scanner.py          # TCP scanning + validation (Python sockets)",
  "    services.py         # well-known port -> service mapping",
  "    requirements.txt",
  "    templates/",
  "        index.html      # the web page",
  "    static/",
  "        style.css       # dark cybersecurity theme",
  "        script.js       # UI, progress, CSV/TXT export",
  "    README.md           # docs + Viva Explanation",
].join("\n");

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-3 text-lg font-semibold text-card-foreground">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function Index() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">IP Port Scanner</h1>
          <p className="mt-2 text-muted-foreground">
            A TCP port scanner built with Python sockets and Flask. This page is the
            project guide — the scanner itself runs locally, because real TCP socket
            scanning needs Python on your machine.
          </p>
        </header>

        <p className="rounded-lg border-l-4 border-chart-4 bg-muted p-4 text-sm font-semibold text-foreground">
          Only scan systems you own or have explicit permission to test.
        </p>

        <Card title="Project structure">
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground">
            {files}
          </pre>
        </Card>

        <Card title="How to run it">
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground">
            {"cd ip-port-scanner\npip install -r requirements.txt\npython app.py"}
          </pre>
          <p>
            Then open <span className="text-foreground">http://127.0.0.1:5000</span> in
            your browser.
          </p>
        </Card>

        <Card title="How to test it">
          <ul className="list-disc space-y-1 pl-5">
            <li>Target 127.0.0.1, ports 1–1024, click Scan and watch the progress bar.</li>
            <li>
              Scan 1–6000 on 127.0.0.1: port 5000 shows OPEN (that is the Flask server
              itself) — proof the scan is real.
            </li>
            <li>Enter 999.1.1.1 or start port 80 with end port 20 to see the validation errors.</li>
            <li>Click Export CSV / Export TXT to download the report files.</li>
          </ul>
        </Card>

        <Card title="How a port is classified">
          <ul className="list-disc space-y-1 pl-5">
            <li>TCP handshake completes → OPEN</li>
            <li>Connection refused (RST) → CLOSED</li>
            <li>No reply before the 0.5s timeout → FILTERED</li>
            <li>Network/OS error → UNREACHABLE</li>
          </ul>
          <p>
            Service names come from a local well-known-port table and are only the{" "}
            <em>likely</em> service — any program can listen on any port.
          </p>
        </Card>

        <Card title="Documentation">
          <p>
            Full README with objective, features, how TCP scanning works, limitations
            and the complete “Viva Explanation” section is at{" "}
            <span className="text-foreground">ip-port-scanner/README.md</span>.
          </p>
        </Card>
      </div>
    </main>
  );
}
