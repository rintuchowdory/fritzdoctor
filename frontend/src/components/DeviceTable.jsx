export default function DeviceTable({ devices, loading, error }) {
  return (
    <div className="rounded-xl border border-panel-line bg-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-panel-line">
        <h2 className="font-display text-sm font-semibold text-ink">
          Connected devices
          {!loading && !error && (
            <span className="font-mono text-muted font-normal"> · {devices.length}</span>
          )}
        </h2>
      </div>

      {error && (
        <p className="p-4 font-mono text-sm text-danger">{error}</p>
      )}

      {!error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wider">
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">IP</th>
                <th className="px-4 py-2 font-medium">MAC</th>
                <th className="px-4 py-2 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-panel-line/60">
                    <td className="px-4 py-2 text-muted" colSpan={5}>
                      loading…
                    </td>
                  </tr>
                ))}
              {!loading &&
                devices.map((d) => (
                  <tr key={d.mac} className="border-t border-panel-line/60">
                    <td className="px-4 py-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: d.is_active ? "#4FD1C5" : "#3A4147" }}
                      />
                    </td>
                    <td className="px-4 py-2 text-ink">{d.name || "unnamed"}</td>
                    <td className="px-4 py-2 text-muted">{d.ip || "—"}</td>
                    <td className="px-4 py-2 text-muted">{d.mac || "—"}</td>
                    <td className="px-4 py-2 text-muted">{d.interface_type || "—"}</td>
                  </tr>
                ))}
              {!loading && devices.length === 0 && (
                <tr className="border-t border-panel-line/60">
                  <td className="px-4 py-3 text-muted" colSpan={5}>
                    No devices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
