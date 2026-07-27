import { useState } from "react";
import { api } from "../lib/api";

const CHANNELS_24 = [1, 6, 11];
const CHANNELS_5 = [36, 40, 44, 48, 100, 104, 108, 112, 149, 153, 157, 161];

export default function WlanPanel({ networks, loading, error, onChanged }) {
  const [busyIndex, setBusyIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);

  async function changeChannel(serviceIndex, channel) {
    setBusyIndex(serviceIndex);
    setFeedback(null);
    try {
      await api.setChannel(serviceIndex, channel);
      setFeedback({ type: "ok", text: `Switched to channel ${channel}` });
      onChanged?.();
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setBusyIndex(null);
    }
  }

  return (
    <div className="rounded-xl border border-panel-line bg-panel p-4">
      <h2 className="font-display text-sm font-semibold text-ink mb-3">WLAN radios</h2>

      {error && <p className="font-mono text-sm text-danger">{error}</p>}
      {loading && <p className="font-mono text-sm text-muted">loading…</p>}

      <div className="space-y-4">
        {!loading &&
          networks.map((net) => {
            const is5GHz = (net.channel ?? 0) > 14;
            const options = is5GHz ? CHANNELS_5 : CHANNELS_24;
            return (
              <div key={net.service_index} className="border-t border-panel-line/60 pt-3 first:border-0 first:pt-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-ink font-medium">{net.ssid || `Radio ${net.service_index}`}</p>
                    <p className="font-mono text-xs text-muted">
                      {is5GHz ? "5 GHz" : "2.4 GHz"} · currently channel {net.channel} · {net.is_enabled ? "on" : "off"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map((ch) => (
                    <button
                      key={ch}
                      disabled={busyIndex === net.service_index || ch === Number(net.channel)}
                      onClick={() => changeChannel(net.service_index, ch)}
                      className={`font-mono text-xs px-2.5 py-1.5 rounded-md border transition-colors
                        ${
                          ch === Number(net.channel)
                            ? "border-signal text-signal bg-signal/10"
                            : "border-panel-line text-muted hover:border-signal hover:text-signal"
                        }
                        disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {feedback && (
        <p
          className={`font-mono text-xs mt-3 ${
            feedback.type === "ok" ? "text-signal" : "text-danger"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <p className="font-mono text-xs text-muted mt-3">
        Tip: on 2.4 GHz, stick to 1 / 6 / 11 — those are the only channels that
        don't overlap with each other.
      </p>
    </div>
  );
}
