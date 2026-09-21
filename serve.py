#!/usr/bin/env python3
"""Tiny static server that serves .ics as text/calendar so phones/desktops
hand the file to the Calendar app instead of downloading it as a blob."""
import http.server, socketserver

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    pass

# Serve calendar files with the correct MIME type
Handler.extensions_map[".ics"] = "text/calendar"
Handler.extensions_map[".mp3"] = "audio/mpeg"

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

with Server(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Serving on 0.0.0.0:{PORT}")
    httpd.serve_forever()
