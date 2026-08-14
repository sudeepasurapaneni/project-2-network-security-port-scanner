"""
services.py
-----------
A small, local lookup table of well-known TCP ports.

IMPORTANT (for the viva):
This mapping is only a GUESS. A port number does not prove which program is
running. Anyone can run any service on any port. So we always label the result
as a "likely / common service".
"""

# Well-known port -> common service name
COMMON_PORTS = {
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
}


def identify_service(port: int) -> str:
    """Return the likely service name for a port, or 'Unknown'."""
    return COMMON_PORTS.get(port, "Unknown")
