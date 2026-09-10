# Project 2 Network Security Port Scanner

Build a complete working educational cybersecurity project called "IP Port Scanner".

This is a college assignment. I am a beginner, so make the project simple, reliable, clean, and easy to explain in a viva.

IMPORTANT:

The application must work with any syntactically valid IPv4 address entered by the user, rather than having a hardcoded target IP. However, include a clear notice that scans must only be performed against systems the user owns or has explicit permission to test.

PROJECT REQUIREMENTS:

1. TECHNOLOGY

- Build this as a simple web application.

- Use a Python backend (Flask or FastAPI) for the actual TCP port scanning.

- Use HTML, CSS, and JavaScript for the frontend.

- Do not use Nmap as the scanning engine. Implement the basic TCP connection scanning logic using Python sockets so that I can explain how the scanner works.

- Keep the code beginner-friendly and well commented.

2. USER INTERFACE

Create a professional but simple cybersecurity-themed interface.

The page must contain:

- Application title: "IP Port Scanner"

- Short description explaining that it checks TCP ports on an authorized target.

- IPv4 address input field.

- Start Port input field.

- End Port input field.

- "Scan" button.

- "Stop Scan" button if practical.

- Progress indicator while scanning.

- Results table.

- "Export Results" button.

- Clear/reset button.

3. INPUT VALIDATION

- Validate that the target is a valid IPv4 address.

- Validate that port numbers are integers between 1 and 65535.

- Ensure start port is less than or equal to end port.

- Show friendly error messages for invalid input.

- Prevent empty inputs.

- Do not hardcode one IP address.

4. SCANNING LOGIC

Implement TCP connect scanning using Python's socket library.

For each port in the requested range:

- Attempt a TCP connection to the target IP and port.

- Use a reasonable timeout so the application does not hang.

- If the TCP connection succeeds, classify the port as OPEN.

- If the connection is refused or times out, classify it appropriately as CLOSED or FILTERED/UNREACHABLE where technically appropriate.

- Do not perform exploitation, authentication attempts, vulnerability exploitation, credential attacks, or any intrusive actions.

- The scanner should only establish normal TCP connection attempts.

5. SERVICE IDENTIFICATION

For open ports, identify common services using a local mapping of well-known ports.

Include at least:

21 -> FTP

22 -> SSH

23 -> Telnet

25 -> SMTP

53 -> DNS

80 -> HTTP

110 -> POP3

143 -> IMAP

443 -> HTTPS

445 -> SMB

3306 -> MySQL

3389 -> RDP

5432 -> PostgreSQL

8080 -> HTTP Proxy/Alternate HTTP

For unknown ports, display "Unknown".

Do not falsely claim that a service is definitely running solely from the port number. Label the service as "Common service / likely service" or otherwise make it clear that port-based identification is approximate.

6. RESULTS TABLE

Display:

Port Number | Status | Protocol | Service

Example:

22 | OPEN | TCP | SSH

80 | OPEN | TCP | HTTP

443 | OPEN | TCP | HTTPS

Allow the user to see both open and closed results.

Also display a summary such as:

Target: 127.0.0.1

Ports scanned: 1-1024

Total scanned: 1024

Open: X

Closed: X

7. EXPORT

Add an "Export Results" button.

Allow results to be exported as a CSV file containing:

Target IP

Port

Protocol

Status

Service

Timestamp

Also provide a readable TXT export if simple to implement.

8. RESPONSIVE UI

Make the interface clean and modern.

Use:

- A simple dark cybersecurity-inspired design.

- Cards/panels.

- Clear buttons.

- Responsive layout.

- Accessible text.

- No unnecessary animations.

9. SECURITY

Add a visible notice:

"Only scan systems you own or have explicit permission to test."

Do not add:

- Exploitation functionality

- Password attacks

- Credential testing

- Vulnerability exploitation

- Stealth/evasion features

- Malware

- Persistence

- Data collection beyond scan results

10. ERROR HANDLING

Handle:

- Invalid IP

- Invalid ports

- Start port greater than end port

- Network timeout

- Connection refused

- Unreachable host

- Invalid range

- Unexpected socket errors

The application must never crash because of a bad user input or unreachable target.

11. PERFORMANCE

For larger port ranges, use controlled concurrency such as a small thread pool so the scanner remains responsive.

Do not create excessive concurrency or aggressive scanning behavior.

12. PROJECT STRUCTURE

Create a clean project structure such as:

ip-port-scanner/

    app.py

    scanner.py

    services.py

    requirements.txt

    templates/

        index.html

    static/

        style.css

        script.js

    README.md

13. README

Create a beginner-friendly README containing:

- Project title

- Objective

- Features

- Technologies used

- How the scanner works

- How TCP port scanning works

- How service identification works

- How to install dependencies

- How to run the application

- Example usage

- Ethical/authorization note

- Limitations

14. COLLEGE ASSIGNMENT EXPLANATION

At the end, provide a section called "Viva Explanation" containing simple explanations for:

- What is an IP address?

- What is a port?

- What is TCP?

- What is a socket?

- What is port scanning?

- How does this scanner determine whether a port is open?

- What does a timeout mean?

- Why are ports such as 22, 80, 443, and 3389 associated with common services?

- Why can service identification based only on port numbers be inaccurate?

- Difference between an open and closed port.

- Difference between port scanning and vulnerability exploitation.

- Why authorization is required before scanning another system.

15. TESTING

Include a safe local testing mode/example using 127.0.0.1.

Make sure the application actually runs successfully before considering the project complete.

After generating the project:

1. Show me the complete file structure.

2. Explain how to run it.

3. Explain how to test it.

4. Fix any errors you encounter.

5. Make sure the Scan button actually performs a TCP scan.

6. Make sure Export Results actually downloads a file.

7. Make sure the application accepts arbitrary valid IPv4 addresses rather than a hardcoded IP.

Do not just create a visually attractive mockup. I need a genuinely functional working prototype with real TCP scanning logic.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fb8196df-408f-4961-8ffa-fd7691e61a31).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
