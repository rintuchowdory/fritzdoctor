"""
Thin wrapper around fritzconnection so main.py never has to deal with
raw TR-064 calls. Everything here talks directly to the FritzBox on
your local network.

Docs: https://fritzconnection.readthedocs.io
"""

import os
import subprocess
import time
from dataclasses import dataclass, asdict

from fritzconnection import FritzConnection
from fritzconnection.lib.fritzstatus import FritzStatus
from fritzconnection.lib.fritzhosts import FritzHosts
from fritzconnection.lib.fritzwlan import FritzWLAN


class FritzClientError(Exception):
    """Raised when we can't reach or talk to the FritzBox."""


def _connection() -> FritzConnection:
    address = os.environ["FRITZ_ADDRESS"]
    username = os.environ["FRITZ_USERNAME"]
    password = os.environ["FRITZ_PASSWORD"]
    try:
        return FritzConnection(address=address, user=username, password=password)
    except Exception as exc:  # noqa: BLE001 - surface as our own error type
        raise FritzClientError(f"Could not connect to FritzBox at {address}: {exc}") from exc


@dataclass
class BoxStatus:
    model: str
    uptime_seconds: int
    connection_status: str
    external_ip: str
    downstream_max_bps: float
    upstream_max_bps: float
    bytes_sent: int
    bytes_received: int


def get_box_status() -> dict:
    fc = _connection()
    status = FritzStatus(fc=fc)
    data = BoxStatus(
        model=fc.modelname,
        uptime_seconds=status.uptime,
        connection_status=status.connection_status,
        external_ip=status.external_ip,
        downstream_max_bps=status.max_bit_rate[0],
        upstream_max_bps=status.max_bit_rate[1],
        bytes_sent=status.bytes_sent,
        bytes_received=status.bytes_received,
    )
    return asdict(data)


def get_devices() -> list[dict]:
    fc = _connection()
    hosts = FritzHosts(fc=fc)
    devices = []
    for host in hosts.get_hosts_info():
        devices.append(
            {
                "name": host.get("name"),
                "ip": host.get("ip"),
                "mac": host.get("mac"),
                "is_active": host.get("status"),
                "interface_type": host.get("interface_type"),
            }
        )
    return devices


def get_wlan_info() -> list[dict]:
    """Returns info for every WLAN radio (2.4GHz, 5GHz, sometimes 6GHz)."""
    fc = _connection()
    networks = []
    # FritzBox exposes up to 3 WLANConfiguration services (index 1..3)
    for index in (1, 2, 3):
        try:
            wlan = FritzWLAN(fc=fc, service=index)
            info = wlan.get_info()
            networks.append(
                {
                    "service_index": index,
                    "ssid": info.get("NewSSID"),
                    "channel": info.get("NewChannel"),
                    "is_enabled": info.get("NewEnable"),
                    "standard": info.get("NewStandard"),
                }
            )
        except Exception:  # noqa: BLE001 - this radio doesn't exist on this box
            continue
    return networks


def set_wlan_channel(service_index: int, channel: int) -> None:
    fc = _connection()
    wlan = FritzWLAN(fc=fc, service=service_index)
    wlan.set_channel(channel)


def toggle_guest_wifi(enable: bool) -> None:
    fc = _connection()
    # Guest network is conventionally service index 3, but this varies by
    # FritzOS version - verify against get_wlan_info() before relying on it.
    wlan = FritzWLAN(fc=fc, service=3)
    wlan.fc.call_action(
        "WLANConfiguration3",
        "SetEnable",
        NewEnable=1 if enable else 0,
    )


def reboot_box() -> None:
    fc = _connection()
    fc.reboot()


def ping_host(host: str = "8.8.8.8", count: int = 4) -> dict:
    """Runs a real ping from wherever this backend is hosted (your LAN),
    which is what actually tells you if the WAN link itself is healthy."""
    start = time.time()
    try:
        result = subprocess.run(
            ["ping", "-c", str(count), "-W", "2", host],
            capture_output=True,
            text=True,
            timeout=count * 3 + 5,
        )
        output = result.stdout
        packet_loss = "unknown"
        for line in output.splitlines():
            if "packet loss" in line:
                packet_loss = line.strip()
        return {
            "host": host,
            "reachable": result.returncode == 0,
            "packet_loss": packet_loss,
            "raw": output,
            "duration_seconds": round(time.time() - start, 2),
        }
    except Exception as exc:  # noqa: BLE001
        return {"host": host, "reachable": False, "error": str(exc)}
