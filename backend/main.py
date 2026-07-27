import os
from concurrent.futures import ThreadPoolExecutor

import speedtest
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import fritz_client
from fritz_client import FritzClientError

load_dotenv()

app = FastAPI(title="FritzDoctor API", version="0.1.0")

_origins_raw = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in _origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# speedtest-cli is slow and blocking - keep it off the main event loop
executor = ThreadPoolExecutor(max_workers=2)


def _handle_fritz_errors(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except FritzClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Missing environment variable: {exc}. Check your .env file.",
        ) from exc


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/status")
def status():
    """Box model, uptime, WAN connection state, throughput."""
    return _handle_fritz_errors(fritz_client.get_box_status)


@app.get("/api/devices")
def devices():
    """Every device the FritzBox currently knows about."""
    return _handle_fritz_errors(fritz_client.get_devices)


@app.get("/api/wlan")
def wlan():
    """Channel + SSID + standard for every WLAN radio on the box."""
    return _handle_fritz_errors(fritz_client.get_wlan_info)


class ChannelChange(BaseModel):
    service_index: int
    channel: int


@app.post("/api/wlan/channel")
def change_channel(body: ChannelChange):
    _handle_fritz_errors(fritz_client.set_wlan_channel, body.service_index, body.channel)
    return {"ok": True}


class GuestWifiToggle(BaseModel):
    enable: bool


@app.post("/api/wlan/guest")
def guest_wifi(body: GuestWifiToggle):
    _handle_fritz_errors(fritz_client.toggle_guest_wifi, body.enable)
    return {"ok": True}


@app.post("/api/reboot")
def reboot():
    """Reboots the FritzBox. This will drop every connection on your
    network for 1-2 minutes - the frontend should confirm before calling this."""
    _handle_fritz_errors(fritz_client.reboot_box)
    return {"ok": True, "message": "Reboot triggered - the box will be back in 1-2 minutes"}


@app.get("/api/ping")
def ping(host: str = "8.8.8.8"):
    return fritz_client.ping_host(host)


@app.get("/api/speedtest")
def run_speedtest():
    """Blocking and slow (10-30s) - run this on demand, not on a poll loop."""

    def _run():
        st = speedtest.Speedtest()
        st.get_best_server()
        download = st.download()
        upload = st.upload()
        ping_ms = st.results.ping
        return {
            "download_mbps": round(download / 1_000_000, 2),
            "upload_mbps": round(upload / 1_000_000, 2),
            "ping_ms": round(ping_ms, 1),
        }

    future = executor.submit(_run)
    try:
        return future.result(timeout=60)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Speed test failed: {exc}") from exc
