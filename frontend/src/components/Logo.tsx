import logo from '../assets/logo.png';

// Shared across auth pages (Login/Register), Onboarding, and the Dashboard navbar — 'md' is the
// original compact mark, 'nav' a modest bump for header bars, 'lg' the large auth-page treatment.
export default function Logo({
  showWordmark = false,
  size = 'md',
}: {
  showWordmark?: boolean;
  size?: 'md' | 'nav' | 'lg';
}) {
  const markClass = { md: 'w-11 h-11', nav: 'w-14 h-14', lg: 'w-16 h-16' }[size];
  const wordmarkClass = { md: 'text-2xl', nav: 'text-3xl', lg: 'text-4xl 2xl:text-5xl' }[size];
  return (
    <div className="flex items-center gap-3">
      <img src={logo} alt="CoinSage" className={markClass} />
      {showWordmark && (
        <span className={`font-outfit font-extrabold ${wordmarkClass} text-white tracking-tight`}>CoinSage</span>
      )}
    </div>
  );
}
