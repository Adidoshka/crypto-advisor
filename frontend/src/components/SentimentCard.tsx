// Decorative marketing content for the Login/Register left panel — hardcoded
// numbers, not real data (same non-functional-decoration pattern as the static
// meme fallback in dashboard.ts). Shared to avoid duplicating it across both pages.
export default function SentimentCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
        <span className="text-brand-cyan">BTC SENTIMENT INDICATOR</span>
        <span className="text-brand-green">92% EXTREME BULLISH</span>
      </div>
      <svg viewBox="0 0 280 90" className="mt-4 w-full">
        <line x1="140" y1="0" x2="140" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <polyline
          points="10,68 65,45 110,72 165,55 220,32 270,28"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="65" cy="45" r="4" fill="#00f0ff" />
        <circle cx="220" cy="32" r="4" fill="#10b981" />
      </svg>
    </div>
  );
}
