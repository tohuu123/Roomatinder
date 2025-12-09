"use client";

export function GreenHomeBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100">
      
      {/* Animated moving blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-80">
        
        {/* Light Mint Blob */}
        <div className="absolute -top-20 -left-20 w-[45rem] h-[45rem] bg-green-300/80 blur-3xl rounded-full animate-greenFade" />

        {/* Emerald Blob */}
        <div className="absolute top-1/3 -right-24 w-[40rem] h-[40rem] bg-emerald-400/70 blur-3xl rounded-full animate-greenFadeSlow" />

        {/* Lime highlight */}
        <div className="absolute bottom-0 left-1/4 w-[35rem] h-[35rem] bg-lime-300/60 blur-3xl rounded-full animate-greenFadeDelay" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}