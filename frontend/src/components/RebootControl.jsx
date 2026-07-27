import { useState } from "react";
import { api } from "../lib/api";

export default function RebootControl() {
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState("idle"); // idle | rebooting | done | error
  const [message, setMessage] = useState(null);

  async function doReboot() {
    setState("rebooting");
    try {
      const res = await api.reboot();
      setState("done");
      setMessage(res.message);
    } catch (err) {
      setState("error");
      setMessage(err.message);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
      <h2 className="font-display text-sm font-semibold text-ink mb-1">Reboot the FritzBox</h2>
      <p className="font-mono text-xs text-muted mb-3">
        Drops every device on your network for 1–2 minutes. Use when something's
        genuinely stuck, not as a first move.
      </p>

      {!confirming && state !== "rebooting" && (
        <button
          onClick={() => setConfirming(true)}
          className="font-mono text-xs px-3 py-2 rounded-md border border-danger text-danger hover:bg-danger/10 transition-colors"
        >
          Reboot box
        </button>
      )}

      {confirming && (
        <div className="flex items-center gap-2">
          <button
            onClick={doReboot}
            className="font-mono text-xs px-3 py-2 rounded-md bg-danger text-base font-medium hover:opacity-90 transition-opacity"
          >
            Confirm reboot
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="font-mono text-xs px-3 py-2 rounded-md border border-panel-line text-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {state === "rebooting" && (
        <p className="font-mono text-xs text-amber">Reboot triggered — sit tight.</p>
      )}
      {state === "error" && <p className="font-mono text-xs text-danger">{message}</p>}
    </div>
  );
}
