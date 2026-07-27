# FritzDoctor backend

FastAPI service that talks to your FritzBox over TR-064 (via `fritzconnection`)
and runs real network diagnostics (ping, speedtest) from wherever this is
hosted. This has to run on your local network (or somewhere with a route to
your FritzBox) - it will NOT work deployed to Vercel serverless, since Vercel
can't reach `192.168.178.1`.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env with your FritzBox IP + login
```

Your FritzBox login: use a dedicated user with limited rights rather than
your main admin login. Create one at `fritz.box` -> System -> FRITZ!Box-Nutzer
-> Nutzer hinzufügen, and grant it "FRITZ!Box Einstellungen" access.

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Check it's working:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/status
```

## Where to run this long-term

Anything that's always-on and on your home LAN:
- Raspberry Pi
- Your k3s cluster (add it as a Deployment, expose via Service)
- Any always-on Linux box on the network

If you want to reach it from outside your home WiFi (e.g. reboot the router
while you're not home), put it behind a Cloudflare Tunnel rather than port
forwarding - port-forwarding a box that can reboot your router is asking
for trouble.

## Endpoints

| Method | Path                | What it does                                  |
|--------|---------------------|------------------------------------------------|
| GET    | /api/status         | Box model, uptime, WAN state, throughput       |
| GET    | /api/devices        | All known devices (name, IP, MAC, active)      |
| GET    | /api/wlan           | Channel/SSID/standard per radio                |
| POST   | /api/wlan/channel   | `{service_index, channel}` - change WLAN channel |
| POST   | /api/wlan/guest     | `{enable}` - toggle guest WiFi                 |
| POST   | /api/reboot         | Reboots the FritzBox (confirm on frontend!)    |
| GET    | /api/ping           | Real ping test from this machine               |
| GET    | /api/speedtest      | Full speedtest (slow, ~15-30s)                 |
