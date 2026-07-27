# FritzDoctor

A web dashboard that diagnoses your home network and controls your FritzBox
directly — reboot it, change WLAN channel, toggle guest WiFi, run a speed
test — all from the browser, without opening the FritzBox admin UI.

```
fritzdoctor/
├── backend/    FastAPI service, talks to the FritzBox over TR-064
└── frontend/   React + Vite + Tailwind dashboard
```

## How it works

Your FritzBox exposes an official home-automation API (TR-064/TR-069). The
backend uses the `fritzconnection` Python library to call it — that's what
lets this reboot the box or change channels instead of just reading stats.

**Important:** the backend needs a network route to your FritzBox
(`192.168.178.1` by default), so it has to run on your home network — a
Raspberry Pi, your k3s cluster, or any always-on Linux box. It can't be
deployed to Vercel serverless functions, since those can't reach your LAN.
The frontend, on the other hand, is a normal static site and deploys fine to
Vercel or GitHub Pages — it just needs `VITE_API_URL` pointed at wherever the
backend lives (directly on your LAN, or through a Cloudflare Tunnel if you
want access from outside).

## Quick start

**Backend:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your FritzBox IP + login
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env   # points at the backend above
npm run dev
```

Then open `http://localhost:5173`.

## What's real vs. what needs your input

This is a working scaffold, not a mockup — the FritzBox calls, ping test, and
speedtest are all real. Two things to verify against your specific box before
relying on it:

1. **Guest WiFi service index** — `toggle_guest_wifi()` assumes guest WiFi is
   `WLANConfiguration3`. Check `GET /api/wlan` first; if your box orders
   radios differently, adjust the index in `fritz_client.py`.
2. **FritzBox user permissions** — create a dedicated FritzBox user for this
   app (not your main admin login) with just "FRITZ!Box Settings" access, so
   a bug here can't do more than a normal admin session could.

## Security notes

- `.env` files are gitignored — never commit real credentials.
- Don't port-forward the backend to the public internet. If you want remote
  access, use a Cloudflare Tunnel (authenticated) instead of opening a port.
- The reboot endpoint has no built-in auth beyond "can reach this API" — if
  you expose it beyond localhost, put real auth in front of it (even just
  a shared secret header checked in FastAPI middleware).
