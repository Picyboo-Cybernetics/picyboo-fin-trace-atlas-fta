export function Footer() {
  return (
    <footer className="app-footer py-10 text-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-accent">FinTrace Atlas</p>
          <p className="mt-1 max-w-xl text-xs uppercase tracking-[0.2em] text-muted">
            Intelligent insights for financial traceability and regulatory technology leaders.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs md:items-end">
          <div className="flex flex-col items-start gap-1 md:items-end">
            <a href="https://picyboo.com" target="_blank" rel="noreferrer">
              picyboo.com
            </a>
            <a href="https://picyboo.net" target="_blank" rel="noreferrer">
              picyboo.net <span className="ml-1 text-[0.6rem] uppercase tracking-[0.3em] text-muted">Sandbox</span>
            </a>
          </div>
          <span className="text-muted">Data: official public sources only.</span>
          <span className="text-muted">© 2025 Picyboo™ Cybernetics Inc.</span>
        </div>
      </div>
    </footer>
  )
}
