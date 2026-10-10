export function GlowBackground() {
  // Soft lime glows behind the content. Dark mode only: light mode stays flat and clean.
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden dark:block print:hidden">
      <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.045] blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-primary/[0.025] blur-[120px] animate-pulse-glow" />
    </div>
  )
}
