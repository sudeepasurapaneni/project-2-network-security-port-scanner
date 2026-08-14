/* script.js - frontend logic for the IP Port Scanner.
   It validates input, asks the Flask backend to scan one port at a time
   (a few in parallel), updates the progress bar, and exports results. */

const $ = (id) => document.getElementById(id);

let scanning = false;   // are we currently scanning?
let stopFlag = false;   // did the user press "Stop Scan"?
let results = [];       // collected rows
let currentTarget = ""; // target used for the current results

/* ---------------- validation (same rules as the backend) ---------------- */
function validate(target, start, end) {
  if (!target.trim()) return "Please enter a target IPv4 address.";
  const parts = target.trim().split(".");
  const validIp =
    parts.length === 4 &&
    parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
  if (!validIp) return "Invalid IPv4 address. Example of a valid value: 127.0.0.1";

  if (start === "" || end === "") return "Please enter both start and end ports.";
  if (!Number.isInteger(start) || !Number.isInteger(end)) return "Ports must be whole numbers.";
  if (start < 1 || start > 65535 || end < 1 || end > 65535)
    return "Ports must be between 1 and 65535.";
  if (start > end) return "Start port must be less than or equal to end port.";
  if (end - start + 1 > 5000) return "Please scan at most 5000 ports at a time.";
  return null;
}

/* ---------------- UI helpers ---------------- */
function showError(msg) { $("errorBox").textContent = msg || ""; }

function addRow(row) {
  const tr = document.createElement("tr");
  tr.innerHTML =
    `<td>${row.port}</td>` +
    `<td class="status-${row.status}">${row.status}</td>` +
    `<td>${row.protocol}</td>` +
    `<td>${row.service}</td>`;
  $("resultsBody").appendChild(tr);
}

function updateSummary(start, end) {
  const open = results.filter((r) => r.status === "OPEN").length;
  const closed = results.filter((r) => r.status === "CLOSED").length;
  $("sumTarget").textContent = currentTarget || "-";
  $("sumRange").textContent = `${start}-${end}`;
  $("sumTotal").textContent = results.length;
  $("sumOpen").textContent = open;
  $("sumClosed").textContent = closed;
  $("sumOther").textContent = results.length - open - closed;
}

function setBusy(busy) {
  scanning = busy;
  $("scanBtn").disabled = busy;
  $("stopBtn").disabled = !busy;
  const hasResults = results.length > 0;
  $("csvBtn").disabled = busy || !hasResults;
  $("txtBtn").disabled = busy || !hasResults;
}

/* ---------------- scanning ---------------- */
async function scanOne(target, port) {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, port }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Scan failed.");
  return data.result;
}

async function startScan() {
  const target = $("target").value.trim();
  const start = parseInt($("startPort").value, 10);
  const end = parseInt($("endPort").value, 10);

  const err = validate(target, start, end);
  if (err) { showError(err); return; }

  showError("");
  results = [];
  currentTarget = target;
  $("resultsBody").innerHTML = "";
  stopFlag = false;
  setBusy(true);

  const total = end - start + 1;
  let done = 0;
  $("progressBar").max = total;
  $("progressBar").value = 0;
  $("progressText").textContent = `Scanning ${target} ...`;

  // Simple worker pool: a few requests in flight at a time (not aggressive).
  const CONCURRENCY = 10;
  let next = start;

  async function worker() {
    while (!stopFlag && next <= end) {
      const port = next++;
      try {
        const row = await scanOne(target, port);
        results.push(row);
        addRow(row);
      } catch (e) {
        showError(e.message);
        stopFlag = true;
        break;
      }
      done++;
      $("progressBar").value = done;
      $("progressText").textContent = `Scanned ${done} / ${total} ports...`;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  results.sort((a, b) => a.port - b.port);
  updateSummary(start, end);
  setBusy(false);
  $("progressText").textContent = stopFlag
    ? `Stopped after ${done} of ${total} ports.`
    : `Finished. Scanned ${done} ports.`;
}

/* ---------------- export ---------------- */
function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const ts = new Date().toISOString();
  const lines = ["Target IP,Port,Protocol,Status,Service,Timestamp"];
  results.forEach((r) => {
    lines.push(`${currentTarget},${r.port},${r.protocol},${r.status},"${r.service}",${ts}`);
  });
  download("scan_results.csv", lines.join("\n"), "text/csv");
}

function exportTxt() {
  const ts = new Date().toISOString();
  const open = results.filter((r) => r.status === "OPEN").length;
  let out = "IP Port Scanner - Scan Report\n";
  out += `Timestamp : ${ts}\n`;
  out += `Target    : ${currentTarget}\n`;
  out += `Total     : ${results.length}\nOpen      : ${open}\n\n`;
  out += "PORT    STATUS      PROTO  SERVICE (likely)\n";
  out += "-------------------------------------------\n";
  results.forEach((r) => {
    out += `${String(r.port).padEnd(8)}${r.status.padEnd(12)}${r.protocol.padEnd(7)}${r.service}\n`;
  });
  download("scan_results.txt", out, "text/plain");
}

/* ---------------- reset ---------------- */
function clearAll() {
  stopFlag = true;
  results = [];
  currentTarget = "";
  $("resultsBody").innerHTML = "";
  $("progressBar").value = 0;
  $("progressText").textContent = "Idle.";
  ["sumTarget", "sumRange"].forEach((id) => ($(id).textContent = "-"));
  ["sumTotal", "sumOpen", "sumClosed", "sumOther"].forEach((id) => ($(id).textContent = "0"));
  showError("");
  setBusy(false);
}

/* ---------------- wiring ---------------- */
$("scanBtn").addEventListener("click", startScan);
$("stopBtn").addEventListener("click", () => {
  stopFlag = true;
  $("progressText").textContent = "Stopping...";
});
$("csvBtn").addEventListener("click", exportCsv);
$("txtBtn").addEventListener("click", exportTxt);
$("clearBtn").addEventListener("click", clearAll);
