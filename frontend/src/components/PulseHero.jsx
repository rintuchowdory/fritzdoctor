import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const MAX_SAMPLES = 40;
const WIDTH = 900;
const HEIGHT = 160;

function healthColor(ms) {
  if (ms === null) return "#E5484D";
  if (ms < 40) return "#4FD1C5";
  if (ms < 120) return "#F2A93B";
  return "#E5484D";
}

function healthLabel(ms) {
  if (ms === null) return "unreachable";
  if (ms < 40) return "healthy";
  if (ms < 120) return "congested";
  return "struggling";
}

export default function PulseHero() {
  const [samples, setSamples] = useState(Array(MAX_SAMPLES).fill(null));
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    async function poll() {
      try {
        const result = await api.ping("1.1.1.1");
        const ms = result.reachable ? extractAvgMs(result.raw) : null;
        setLatest(ms);
        setError(null);
        setSamples((prev) => [...prev.slice(1), ms]);
      } catch (err) {
        setError(err.message);
        setSamples((prev) => [...prev.slice(1), null]);
      }
    }
    poll();
    intervalRef.current = setInterval(poll, 4000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const color = healthColor(latest);
  const points = buildPath(samples);

  return (
    <div className="rounded-2xl border border-panel-line bg-panel p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-1">
            Network pulse
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Your network is{" "}
            <span style={{ color }}>{healthLabel(latest)}</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl md:text-4xl font-medium" style={{ color }}>
            {latest !== null ? `${latest} ms` : "—"}
          </p>
          <p className="font-mono text-xs text-muted">to 1.1.1.1, live</p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-32 md:h-40"
        preserveAspectRatio="none"
      >
        <line x1="0" y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} stroke="#1E262C" strokeWidth="1" />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.6s ease" }}
        />
      </svg>

      {error && (
        <p className="font-mono text-xs text-danger mt-2">
          backend unreachable — {error}
        </p>
      )}
    </div>
  );
}

function extractAvgMs(rawOutput) {
  // Parses standard `ping` output line like:
  // rtt min/avg/max/mdev = 12.1/14.3/18.0/2.1 ms
  const match = rawOutput.match(/= [\d.]+\/([\d.]+)\//);
  return match ? Math.round(parseFloat(match[1])) : null;
}

function buildPath(samples) {
  const validValues = samples.filter((s) => s !== null);
  const max = validValues.length ? Math.max(...validValues, 40) : 40;
  const stepX = WIDTH / (MAX_SAMPLES - 1);

  return samples
    .map((s, i) => {
      const x = i * stepX;
      if (s === null) return `${x},${HEIGHT - 8}`;
      const y = HEIGHT - 8 - (s / max) * (HEIGHT - 24);
      return `${x},${y}`;
    })
    .join(" ");
}
