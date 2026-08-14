# IP Port Scanner

A simple, beginner-friendly web application that checks which **TCP ports** are open
on an **authorized** target IPv4 address. The scanning engine is written from scratch
with Python's built-in `socket` library (no Nmap).

> **Ethical notice:** Only scan systems you own or have explicit permission to test.
> Scanning other people's systems without authorization may be illegal.

---

## Objective

To understand and demonstrate how a basic **TCP connect port scanner** works, by
building one from scratch and presenting the results in a clean web interface.

## Features

- Works with **any syntactically valid IPv4 address** (nothing hardcoded)
- Custom start port / end port range
- Real TCP connect scanning using Python sockets
- Small thread pool for speed without being aggressive
- Live progress bar + **Stop Scan** button
- Results table: Port | Status | Protocol | Service
- Summary: target, range, total scanned, open, closed, filtered
- Service identification for well-known ports (labelled as *likely*)
- **Export results** as CSV and TXT
- Clear / reset button
- Full input validation and error handling (the app never crashes on bad input)
- Dark, responsive, cybersecurity-themed UI

## Technologies used

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Python 3, Flask                     |
| Scanning  | Python `socket`, `concurrent.futures` |
| Frontend  | HTML, CSS, JavaScript (no framework) |

## Project structure

```
ip-port-scanner/
    app.py              # Flask web server + API routes
    scanner.py          # TCP scanning + validation logic
    services.py         # well-known port -> service name mapping
    requirements.txt
    templates/
        index.html      # the web page
    static/
        style.css       # dark cybersecurity theme
        script.js       # UI logic, progress, export
    README.md
```

## How the scanner works

1. You enter a target IPv4 address and a port range in the browser.
2. JavaScript validates the input, then asks the Flask backend to check each port.
3. For each port, `scanner.py` creates a TCP socket, sets a **0.5 second timeout**
   and calls `connect_ex((ip, port))`.
4. The return value decides the status:
   - `0` -> the TCP handshake completed -> **OPEN**
   - any other error number -> connection refused -> **CLOSED**
   - timeout -> nothing answered -> **FILTERED** (a firewall may be dropping packets)
   - OS/network error -> **UNREACHABLE**
5. The socket is closed immediately. Nothing else is sent - no logins, no payloads,
   no exploitation.
6. Results stream back to the browser, filling the table and progress bar.

## How TCP port scanning works

TCP uses a **three-way handshake**: the client sends `SYN`, the server replies
`SYN-ACK`, the client replies `ACK`. If that completes, something is listening on
that port, so the port is **open**. If the server replies `RST` (reset), nothing is
listening, so the port is **closed**. If there is no reply at all, a firewall is
probably filtering the traffic.

## How service identification works

`services.py` holds a small dictionary of well-known port numbers:

| Port | Likely service | Port | Likely service |
|------|----------------|------|----------------|
| 21 | FTP | 443 | HTTPS |
| 22 | SSH | 445 | SMB |
| 23 | Telnet | 3306 | MySQL |
| 25 | SMTP | 3389 | RDP |
| 53 | DNS | 5432 | PostgreSQL |
| 80 | HTTP | 8080 | HTTP Proxy / Alternate HTTP |
| 110 | POP3 | | |
| 143 | IMAP | | |

Unlisted ports show **Unknown**. This is only a *likely* service: any program can
be configured to listen on any port, so the port number alone is not proof.

## Install dependencies

```bash
cd ip-port-scanner
python -m venv venv
# Windows:  venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
```

## Run the application

```bash
python app.py
```

Then open <http://127.0.0.1:5000> in your browser.

## Example usage (safe local test)

1. Target: `127.0.0.1`
2. Start port: `1`, End port: `1024`
3. Click **Scan** and watch the progress bar.
4. Because the Flask server itself runs on port 5000, try the range `1-6000`
   and you should see port **5000** reported as **OPEN**.
5. Click **Export CSV** - a `scan_results.csv` file downloads.

Example output:

```
Target: 127.0.0.1
Ports scanned: 1-1024
Total scanned: 1024
Open: 1
Closed: 1023

PORT   STATUS   PROTOCOL   SERVICE
22     OPEN     TCP        SSH
80     OPEN     TCP        HTTP
443    OPEN     TCP        HTTPS
```

## Limitations

- TCP only (no UDP scanning).
- Service names are guesses based on the port number, not banner grabbing.
- "Filtered" results are inconclusive - a firewall may hide an open port.
- Scan speed depends on the timeout and your network.
- Maximum 5000 ports per scan to keep the app responsive.
- Not a vulnerability scanner: it never exploits anything.

---

# Viva Explanation

**What is an IP address?**
A numeric address that identifies a device on a network, e.g. `192.168.1.10`.
IPv4 addresses have four numbers (0-255) separated by dots.

**What is a port?**
A number from 1 to 65535 that identifies a specific service/program on a device.
The IP address finds the computer; the port finds the program on that computer.

**What is TCP?**
Transmission Control Protocol - a connection-oriented protocol that guarantees
reliable, ordered delivery of data. It starts every connection with a three-way
handshake (SYN, SYN-ACK, ACK).

**What is a socket?**
A software endpoint for network communication - the combination of an IP address
and a port. In Python, `socket.socket()` creates one.

**What is port scanning?**
Systematically testing a range of ports on a target to find out which ones are
open (i.e. which services are reachable). It is a standard network
administration and security-audit technique.

**How does this scanner determine whether a port is open?**
It calls `connect_ex((ip, port))`. If it returns `0`, the TCP handshake succeeded,
so a service is listening -> OPEN. Any other value means the connection failed.

**What does a timeout mean?**
The maximum time we wait for a reply (0.5 s here). If no reply arrives in that
time we stop waiting and mark the port FILTERED, so the app never hangs.

**Why are ports like 22, 80, 443 and 3389 associated with common services?**
IANA reserves ports 0-1023 as "well-known" ports and assigns standard services to
them so clients know where to connect by default: 22 = SSH, 80 = HTTP,
443 = HTTPS, 3389 = RDP.

**Why can port-based service identification be inaccurate?**
Because the mapping is only a convention. An administrator can run SSH on port
8080 or a web server on port 2222. Confirming the real service needs banner
grabbing or protocol probing.

**Difference between an open and a closed port?**
Open: a program is listening and accepted the TCP connection.
Closed: the host is reachable but nothing is listening, so it replies with RST.

**Difference between port scanning and vulnerability exploitation?**
Port scanning only asks "is this door there?" using normal connection attempts.
Exploitation actively abuses a weakness to gain access or cause harm. This project
does scanning only.

**Why is authorization required before scanning another system?**
Unauthorized scanning can be treated as reconnaissance for an attack and is
illegal in many countries (e.g. the IT Act in India, the CFAA in the USA). Always
get written permission, or scan only your own machines such as `127.0.0.1`.
