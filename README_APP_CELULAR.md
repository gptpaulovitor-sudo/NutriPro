# 📱 NutriAx Pro — Guia de Instalação e Uso no Celular

O **NutriAx Pro** agora possui arquitetura **PWA (Progressive Web App)** completa com Service Worker, Manifesto Web e Interface Mobile HUD, permitindo que você ou seus pacientes instalem o sistema diretamente no celular (Android ou iPhone) como um aplicativo nativo.

---

## 🚀 Método 1: Instalação Instantânea no Celular via Wi-Fi Local (Recomendado para Testes)

### Passo 1: Inicie o Servidor no Computador
1. Na pasta do projeto, clique duas vezes no arquivo **`iniciar_servidor_celular.bat`** (ou execute `python server_mobile.py` no terminal).
2. O terminal mostrará o endereço da rede local, por exemplo:  
   `http://192.168.1.15:8080` (o IP da sua rede).

### Passo 2: Abra no Celular
1. Certifique-se de que o celular está conectado no **mesmo Wi-Fi** do computador.
2. Abra o navegador do celular:
   - **No Android**: Abra o **Google Chrome** ou **Samsung Internet**.
   - **No iPhone / iPad**: Abra o **Safari**.
3. Digite o endereço exibido no terminal (ex: `http://192.168.1.15:8080`).

---

## 🤖 Como Instalar no Android (Google Chrome / Samsung Internet)

1. Ao abrir o NutriAx Pro no celular, toque no botão superior **"📲 Instalar App"** ou na opção da barra inferior.
2. Uma caixa de diálogo do sistema aparecerá perguntando: *"Instalar aplicativo NutriAx Pro?"*.
3. Toque em **"Instalar"**.
4. **Pronto!** O ícone do NutriAx Pro será criado na tela de início do seu celular e na gaveta de aplicativos.
5. Ele abrirá em **tela cheia**, sem barra de endereços, funcionando como um app 100% nativo e com suporte offline!

> **Instalação Manual no Chrome**: Se o aviso automático não abrir, toque nos **3 pontinhos (⋮)** no canto superior direito do Chrome e selecione **"Instalar aplicativo"** (ou *"Adicionar à tela inicial"*).

---

## 🍏 Como Instalar no iPhone / iPad (iOS Safari)

A Apple exige que a instalação de PWAs seja feita pelo navegador **Safari**:

1. Abra o NutriAx Pro no **Safari**.
2. Toque no botão de **Compartilhar** (o ícone de quadrado com uma seta apontando para cima, na barra inferior do Safari).
3. Role o menu para baixo e toque em **"Adicionar à Tela de Início"** (ícone com um quadrado e o símbolo `+`).
4. Toque em **"Adicionar"** no canto superior direito.
5. **Pronto!** O ícone do NutriAx Pro aparecerá entre os seus outros aplicativos do iPhone, com tela cheia e status bar escura personalizada.

---

## 🌐 Método 2: Instalação via Link Público na Nuvem (Vercel, Netlify ou GitHub Pages)

Se você publicar o projeto em uma hospedagem com HTTPS (como **Vercel**, **Netlify**, **Render** ou **GitHub Pages**):

1. Acesse seu link público (ex: `https://nutriax-pro.vercel.app`) em qualquer celular do mundo.
2. O navegador reconhecerá o certificado HTTPS e o `manifest.json` automaticamente.
3. O botão de instalação aparecerá instantaneamente com suporte a notificações e sincronização em segundo plano.

---

## 📦 Método 3: Compilar um Arquivo `.APK` Nativo (Android Studio / Capacitor)

Caso deseje gerar um arquivo executável `.apk` instalável para distribuição direta:

1. Instale o Capacitor no projeto via terminal:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "NutriAx Pro" "com.nutriax.pro"
   npx cap add android
   ```
2. Sincronize os arquivos:
   ```bash
   npx cap sync
   ```
3. Abra no Android Studio para gerar o `.apk`:
   ```bash
   npx cap open android
   ```
4. No Android Studio, vá em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## ✨ Recursos da Versão Mobile HUD

- **Bottom Navigation Bar Ergonomica**: Navegue com o polegar entre *Radar Clínico*, *Prescrição de Dieta*, *Treino/Biomecânica* e *Modo Paciente*.
- **Persistência Offline**: Acesse o banco de dados IndexedDB (Dexie.js), fichas e treinos mesmo sem internet.
- **Suporte a Safe Area**: Compatível com Notch e Dynamic Island do iPhone e barras de gestos do Android.
- **Atalhos Rápidos**: Pressione e segure o ícone do app no celular para abrir diretamente a Prescrição ou Treino do dia.
