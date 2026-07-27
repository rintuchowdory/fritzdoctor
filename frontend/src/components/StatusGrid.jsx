function formatUptime(seconds) {
  if (!seconds) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

function formatMbps(bps) {
  if (!bps) return "—";
  return `${(bps / 1_000_000).toFixed(1)} Mbps`;
}

function Card({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-panel-line bg-panel p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">{label}</p>
      <p className="font-display text-xl font-semibold text-ink">{value}</p>
      {sub && <p className="font-mono text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function StatusGrid({ status, loading, error }) {
  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 font-mono text-sm text-danger">
        Couldn't reach the box: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Model" value={loading ? "…" : status?.model ?? "—"} />
      <Card
        label="Uptime"
        value={loading ? "…" : formatUptime(status?.uptime_seconds)}
      />
      <Card
        label="WAN status"
        value={loading ? "…" : status?.connection_status ?? "—"}
        sub={status?.external_ip}
      />
      <Card
        label="Line speed"
        value={loading ? "…" : formatMbps(status?.downstream_max_bps)}
        sub={loading ? undefined : `↑ ${formatMbps(status?.upstream_max_bps)}`}
      />
    </div>
  );
}
