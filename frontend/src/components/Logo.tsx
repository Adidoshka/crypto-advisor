import logo from '../assets/logo.png';

// Shared between Login and Register, both of which need the identical mark.
export default function Logo({ showWordmark = false }: { showWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={logo} alt="CoinSage" className="w-11 h-11" />
      {showWordmark && (
        <span className="font-outfit font-extrabold text-2xl text-white tracking-tight">CoinSage</span>
      )}
    </div>
  );
}
