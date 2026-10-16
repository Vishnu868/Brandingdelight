/** Text-based payment marks (no third-party logo files). */
export function PaymentBadges({ dark = false }: { dark?: boolean }) {
  const base = `rounded-md px-2 py-1 text-[10.5px] font-bold tracking-wide ${dark ? "bg-white/10 text-white" : "border border-line bg-white text-ink-soft"}`;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={base}>UPI</span>
      <span className={base}>VISA</span>
      <span className={base}>Mastercard</span>
      <span className={base}>RuPay</span>
      <span className={base}>Net Banking</span>
      <span className={base}>Wallets</span>
      <span className={base}>EMI</span>
    </div>
  );
}
