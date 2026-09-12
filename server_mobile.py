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
    url_local_pro = f"http://localhost:{port}/pro/"
    url_local_disc = f"http://localhost:{port}/disciplina/"
    url_net_pro = f"http://{ip}:{port}/pro/"
    url_net_disc = f"http://{ip}:{port}/disciplina/"
    
    print("=" * 68)
    print("       NUTRIAX PRO & DISCIPLINA — SERVIDOR PWA INDEPENDENTE")
    print("=" * 68)
    print("")
    print("  [AMBIENTE PROFISSIONAL — NutriAx Pro]:")
    print(f"    Local:   {url_local_pro}")
    print(f"    Wi-Fi:   {url_net_pro}")
    print("")
    print("  [AMBIENTE DO PACIENTE — Disciplina]:")
    print(f"    Local:   {url_local_disc}")
    print(f"    Wi-Fi:   {url_net_disc}")
    print("")
    print("-" * 68)
    print("  INSTALAÇÃO PWA INDEPENDENTE:")
    print(f"  • Nutricionista: Acesse {url_net_pro} e clique em 'Instalar'.")
    print(f"  • Paciente:      Acesse {url_net_disc} e clique em 'Instalar'.")
    print("-" * 68)
    print("  Pressione Ctrl+C para encerrar o servidor.")
    print("=" * 68)
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
    
    # Permite reuso rápido de porta e requisições concorrentes multithread
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), CustomHandler) as httpd:
        print_banner(ip, PORT)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor finalizado pelo usuário.")
            sys.exit(0)

if __name__ == '__main__':
    run()
