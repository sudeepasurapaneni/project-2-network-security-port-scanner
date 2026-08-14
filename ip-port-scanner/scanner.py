"""
scanner.py
----------
The actual TCP port scanning logic, written with Python's built-in `socket`
library (no Nmap).

How a TCP connect scan works
============================
1. We create a socket (an endpoint for network communication).
2. We try to open a normal TCP connection to (ip, port).
3. If the 3-way handshake succeeds -> the port is OPEN.
4. If the target actively refuses the connection -> the port is CLOSED.
5. If nothing answers before our timeout -> we report FILTERED (a firewall may
   be silently dropping our packets) - we simply do not know.

We only make ordinary connection attempts. No exploitation, no logins,
no payloads. We close the socket immediately after checking.
"""

import ipaddress
import socket
from concurrent.futures import ThreadPoolExecutor

from services import identify_service

# Keep concurrency small and polite. Too many threads = aggressive scanning.
MAX_WORKERS = 50
DEFAULT_TIMEOUT = 0.5  # seconds to wait for each port


def is_valid_ipv4(value: str) -> bool:
    """True only for a syntactically valid IPv4 address like 192.168.1.10."""
    try:
        ipaddress.IPv4Address(value.strip())
        return True
    except (ipaddress.AddressValueError, ValueError):
        return False


def validate_input(target: str, start_port, end_port):
    """
    Check the user's input.
    Returns an error message string, or None when everything is fine.
    """
    if not target or not str(target).strip():
        return "Please enter a target IPv4 address."

    if not is_valid_ipv4(str(target)):
        return "Invalid IPv4 address. Example of a valid value: 127.0.0.1"

    try:
        start_port = int(start_port)
        end_port = int(end_port)
    except (TypeError, ValueError):
        return "Ports must be whole numbers."

    if not (1 <= start_port <= 65535) or not (1 <= end_port <= 65535):
        return "Ports must be between 1 and 65535."

    if start_port > end_port:
        return "Start port must be less than or equal to end port."

    if (end_port - start_port + 1) > 5000:
        return "Please scan at most 5000 ports at a time."

    return None


def scan_port(target: str, port: int, timeout: float = DEFAULT_TIMEOUT) -> dict:
    """
    Scan ONE port and return a dictionary describing the result.

    connect_ex() returns 0 on success, otherwise an OS error number.
    We use it (instead of connect()) because it does not raise on refusal.
    """
    status = "CLOSED"
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        result = sock.connect_ex((target, port))
        if result == 0:
            status = "OPEN"
        else:
            status = "CLOSED"
    except socket.timeout:
        # Nobody answered in time -> maybe a firewall is dropping the packets.
        status = "FILTERED"
    except socket.gaierror:
        status = "UNREACHABLE"
    except OSError:
        # Network unreachable, host unreachable, too many sockets, etc.
        status = "UNREACHABLE"
    except Exception:
        # Safety net: the app must never crash because of one bad port.
        status = "ERROR"
    finally:
        try:
            sock.close()
        except Exception:
            pass

    return {
        "port": port,
        "status": status,
        "protocol": "TCP",
        "service": identify_service(port) if status == "OPEN" else "-",
    }


def scan_range(target: str, start_port: int, end_port: int,
               timeout: float = DEFAULT_TIMEOUT) -> dict:
    """
    Scan every port from start_port to end_port using a small thread pool
    so that big ranges finish in a reasonable time without being aggressive.
    """
    ports = range(int(start_port), int(end_port) + 1)
    results = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        for item in pool.map(lambda p: scan_port(target, p, timeout), ports):
            results.append(item)

    results.sort(key=lambda r: r["port"])

    open_count = sum(1 for r in results if r["status"] == "OPEN")
    closed_count = sum(1 for r in results if r["status"] == "CLOSED")
    other_count = len(results) - open_count - closed_count

    return {
        "target": target,
        "start_port": int(start_port),
        "end_port": int(end_port),
        "total": len(results),
        "open": open_count,
        "closed": closed_count,
        "other": other_count,
        "results": results,
    }
