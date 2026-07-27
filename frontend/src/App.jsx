import { useEffect, useState, useCallback } from "react";
import { api } from "./lib/api";
import PulseHero from "./components/PulseHero";
import StatusGrid from "./components/StatusGrid";
import DeviceTable from "./components/DeviceTable";
import WlanPanel from "./components/WlanPanel";
import RebootControl from "./components/RebootControl";

function SpeedtestCard() {
  const [state, setState] = useState("idle"); // idle | running | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function run() {
    setState("running");
    setError(null);
    try {
      const data = await api.speedtest();
      setResult(data);
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  }

  return (
    <div className="rounded-xl border border-panel-line bg-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-semibold text-ink">Speed test</h2>
        <button
          onClick={run}
          disabled={state === "running"}
          className="font-mono text-xs px-3 py-1.5 rounded-md border border-signal text-signal hover:bg-signal/10 transition-colors disabled:opacity-40"
        >
          {state === "running" ? "testing… (~20s)" : "run test"}
        </button>
      </div>
      {result && (
        <div className="flex gap-6 font-mono text-sm">
          <div>
            <p className="text-muted text-xs">download</p>
            <p className="text-ink text-lg">{result.download_mbps} Mbps</p>
          </div>
          <div>
            <p className="text-muted text-xs">upload</p>
            <p className="text-ink text-lg">{result.upload_mbps} Mbps</p>
          </div>
          <div>
            <p className="text-muted text-xs">ping</p>
            <p className="text-ink text-lg">{result.ping_ms} ms</p>
          </div>
        </div>
      )}
      {error && <p className="font-mono text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [devices, setDevices] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([api.status(), api.devices(), api.wlan()]);
    const [statusRes, devicesRes, wlanRes] = results;
    const newErrors = {};

    if (statusRes.status === "fulfilled") setStatus(statusRes.value);
    else newErrors.status = statusRes.reason.message;

    if (devicesRes.status === "fulfilled") setDevices(devicesRes.value);
    else newErrors.devices = devicesRes.reason.message;

    if (wlanRes.status === "fulfilled") setNetworks(wlanRes.value);
    else newErrors.wlan = wlanRes.reason.message;

    setErrors(newErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="min-h-screen px-4 py-8 md:px-10 md:py-12 max-w-5xl mx-auto space-y-6">
      <header className="flex items-baseline justify-between">
        <p className="font-display text-lg font-semibold text-ink tracking-tight">
          FritzDoctor
        </p>
        <p className="font-mono text-xs text-muted">local network diagnostics</p>
      </header>

      <PulseHero />

      <StatusGrid status={status} loading={loading} error={errors.status} />

      <div className="grid md:grid-cols-2 gap-4">
        <WlanPanel
          networks={networks}
          loading={loading}
          error={errors.wlan}
          onChanged={loadAll}
        />
        <div className="space-y-4">
          <SpeedtestCard />
          <RebootControl />
        </div>
      </div>

      <DeviceTable devices={devices} loading={loading} error={errors.devices} />

      <footer className="font-mono text-xs text-muted pt-4">
        Talks directly to your FritzBox over TR-064 — nothing leaves your network.
      </footer>
    </div>
  );
}
