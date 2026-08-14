"""
app.py
------
Flask web server for the "IP Port Scanner" project.

Routes:
  GET  /              -> the web page (templates/index.html)
  POST /api/scan      -> scan ONE port (the frontend calls this repeatedly so
                         it can show live progress and support "Stop Scan")
  POST /api/scan-range-> scan a whole range at once (thread pool version)

Run with:  python app.py     then open http://127.0.0.1:5000
"""

from flask import Flask, jsonify, render_template, request

from scanner import scan_port, scan_range, validate_input

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the single page interface."""
    return render_template("index.html")


@app.route("/api/validate", methods=["POST"])
def api_validate():
    """Server-side validation (the browser also validates, but never trust it)."""
    data = request.get_json(silent=True) or {}
    error = validate_input(data.get("target"), data.get("start_port"), data.get("end_port"))
    if error:
        return jsonify({"ok": False, "error": error}), 400
    return jsonify({"ok": True})


@app.route("/api/scan", methods=["POST"])
def api_scan():
    """Scan a single port. Used for live progress in the UI."""
    data = request.get_json(silent=True) or {}
    target = data.get("target")
    port = data.get("port")

    # Validate a one-port "range" so we reuse the same checks.
    error = validate_input(target, port, port)
    if error:
        return jsonify({"ok": False, "error": error}), 400

    try:
        result = scan_port(str(target).strip(), int(port))
        return jsonify({"ok": True, "result": result})
    except Exception as exc:  # the app must never crash
        return jsonify({"ok": False, "error": f"Unexpected error: {exc}"}), 500


@app.route("/api/scan-range", methods=["POST"])
def api_scan_range():
    """Scan a full range on the server using a small thread pool."""
    data = request.get_json(silent=True) or {}
    target = data.get("target")
    start_port = data.get("start_port")
    end_port = data.get("end_port")

    error = validate_input(target, start_port, end_port)
    if error:
        return jsonify({"ok": False, "error": error}), 400

    try:
        summary = scan_range(str(target).strip(), int(start_port), int(end_port))
        return jsonify({"ok": True, **summary})
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Unexpected error: {exc}"}), 500


if __name__ == "__main__":
    # debug=True gives helpful error pages while you develop.
    app.run(host="127.0.0.1", port=5000, debug=True)
