export type LogoStyle = "wordmark" | "seal" | "monogram" | "modern" | "linked" | "technical" | "signature" | "glass";

export function Brand({ variant = "wordmark", large = false }: { variant?: LogoStyle; large?: boolean }) {
  if (variant === "glass") {
    return <span className={`brand-glass${large ? " brand-glass-large" : ""}`} aria-label="Check Claude · check.cd">
      <img src="/logo.svg?v=bent-mark" alt="" width="36" height="36" />
      <span>Check <strong><b>C</b>lau<b>d</b>e</strong></span>
    </span>;
  }
  if (variant === "signature") {
    return <span className={`brand-signature${large ? " brand-signature-large" : ""}`} aria-label="Check Claude · check.cd">
      <svg viewBox="0 0 52 42" className="brand-signature-symbol" fill="none" aria-hidden="true"><path d="M26 7H11L4 14V29L11 36H26" stroke="currentColor" strokeWidth="6"/><path d="M46 1V36H33L26 29V21L33 14H46" stroke="var(--accent)" strokeWidth="6"/></svg>
      <span className="brand-signature-type"><span>Check</span><span><b>C</b>lau<b>d</b>e</span></span>
    </span>;
  }
  if (variant === "modern" || variant === "linked" || variant === "technical") {
    return <span className={`brand-v2 brand-v2-${variant}${large ? " brand-v2-large" : ""}`} aria-label="Check Claude · check.cd">
      {variant === "linked" ? <svg viewBox="0 0 52 52" className="brand-link-symbol" fill="none" aria-hidden="true"><path d="M29 12a15 15 0 1 0 0 28" stroke="currentColor" strokeWidth="5"/><path d="M41 5v35h-9a10 10 0 0 1 0-20h9" stroke="var(--accent)" strokeWidth="5"/></svg> : null}
      {variant === "technical" ? <span className="brand-tech-symbol" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><path d="M8 4H4v4m16-4h4v4M4 20v4h4m16-4v4h-4M8 14l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span> : null}
      <span className="brand-v2-text"><span className="brand-v2-check">Check</span><span className="brand-v2-claude"><b>C</b>lau<b>d</b>e</span></span>
    </span>;
  }
  return <span className={`brand brand-${variant}${large ? " brand-large" : ""}`} aria-label="Check Claude · check.cd">
    {variant === "seal" ? <span className="brand-check-seal" aria-hidden="true">✓</span> : null}
    {variant === "monogram" ? <span className="brand-monogram" aria-hidden="true">C<span>d</span><i>✓</i></span> : null}
    <span className="brand-type"><span className="brand-check">check<span className="brand-check-dot">.</span></span><span className="brand-claude"><b>C</b>lau<b>d</b>e</span></span>
    {variant === "wordmark" ? <span className="brand-domain" aria-hidden="true">.cd</span> : null}
  </span>;
}
