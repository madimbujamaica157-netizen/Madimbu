# Guardião — Controle Parental (Demo)

## Overview
App mobile de controle parental em modo demonstração, inspirado no FlashGet Kids. Design preto e branco monocromático, totalmente em português.

## Features
- **Painel**: visão geral com tempo de tela, última localização, contadores e gráfico semanal
- **Localização**: mapa simulado, zonas seguras (geocerca) e histórico de locais
- **Apps**: tempo de tela por categoria, lista detalhada e bloqueador com toggle
- **Alertas**: notificações de geocerca, tempo de tela, bloqueio, conteúdo
- **Ajustes**: perfil da criança, limite diário, proteção, conta
- **Child Switcher**: alterna entre Sofia (10) e Lucas (13) em todas as telas

## Tech Stack
- Expo SDK 54 + expo-router (tabs + stack)
- FastAPI + MongoDB (motor)
- Ionicons, monochrome theme
- Auto-seed de dados demo (2 crianças, ~6 apps cada, 5 localizações, 2 geocercas, 4 alertas)

## Endpoints
- `GET /api/children`
- `GET /api/children/{id}/dashboard`
- `GET /api/children/{id}/locations`
- `GET /api/children/{id}/geofences`
- `POST /api/geofences` · `DELETE /api/geofences/{id}`
- `GET /api/children/{id}/apps`
- `PATCH /api/apps/{id}/block`
- `GET/PATCH /api/children/{id}/screen-time`
- `GET /api/children/{id}/alerts`
- `PATCH /api/alerts/{id}/read` · `PATCH /api/children/{id}/alerts/read-all`
- `POST /api/seed` (reset)

## Auth
Sem autenticação (demo).

## Notas
Todos os dados de monitoramento são SIMULADOS (MOCKED) — este é um app de UI/demonstração, não monitora dispositivos reais.
