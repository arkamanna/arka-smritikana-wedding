#!/usr/bin/env python3
"""Tiny static server that serves .ics as text/calendar so phones/desktops
hand the file to the Calendar app instead of downloading it as a blob."""
import http.server, socketserver

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    # HTTP/1.1 with Content-Length keep-alive: Apple Calendar's subscription
    # client fails on HTTP/1.0 responses that close the connection.
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        # Never serve stale scripts/styles/calendar during development, so every
        # page (English & Bengali) always runs the latest app.js logic.
        if self.path.endswith((".ics", ".js", ".css", ".html")):
            self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

# Serve calendar files with the correct MIME type
Handler.extensions_map[".ics"] = "text/calendar"
Handler.extensions_map[".mp3"] = "audio/mpeg"

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

with Server(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Serving on 0.0.0.0:{PORT}")
    httpd.serve_forever()
