export function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-accent/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute top-1/3 left-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]" />
    </div>
  )
}
