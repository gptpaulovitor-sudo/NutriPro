#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NutriAx Pro — Servidor Local com Detecção de IP Wi-Fi e Acesso Mobile
Permite abrir e instalar o NutriAx Pro no celular conectado à mesma rede Wi-Fi.
"""

import http.server
import socket
import socketserver
import os
import sys

PORT = 8080

def get_local_ip():
    """Descobre o IP da máquina na rede local Wi-Fi / Ethernet"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Não precisa ser alcançável, apenas conecta para determinar o IP de saída
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def print_banner(ip, port):
    url_local = f"http://localhost:{port}"
    url_network = f"http://{ip}:{port}"
    
    print("=" * 65)
    print("       NUTRIAX PRO — SERVIDOR MOBILE & PWA LOCAL")
    print("=" * 65)
    print("")
    print(f"  [PC / Computador]:  {url_local}")
    print(f"  [CELULAR NO WI-FI]: {url_network}")
    print("")
    print("-" * 65)
    print("  COMO INSTALAR NO SEU CELULAR:")
    print(f"  1. Conecte seu celular no MESMO Wi-Fi deste computador.")
    print(f"  2. Abra o Chrome (Android) ou Safari (iPhone).")
    print(f"  3. Acesse o endereço: {url_network}")
    print(f"  4. Toque em 'Instalar App' ou 'Adicionar a Tela de Inicio'.")
    print("-" * 65)
    print("  Pressione Ctrl+C para encerrar o servidor.")
    print("=" * 65)
    print("")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Permite Service Worker e cache PWA sem bloqueios de CORS
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    ip = get_local_ip()
    
    # Permite reuso rápido de porta
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print_banner(ip, PORT)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor finalizado pelo usuário.")
            sys.exit(0)

if __name__ == '__main__':
    run()
