import Image from "next/image";

type OrquestraBrandProps = {
  compact?: boolean;
  className?: string;
  tone?: "dark" | "light";
};

export function OrquestraBrand({ compact = false, className = "", tone = "light" }: OrquestraBrandProps) {
  const onDarkSurface = tone === "dark";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        alt="Logo Orquestra.cs"
        className={`shrink-0 rounded-xl ${compact ? "size-10" : "size-12"}`}
        height={compact ? 40 : 48}
        priority
        src="/icons/orquestra-icon.svg"
        width={compact ? 40 : 48}
      />
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${onDarkSurface ? "text-cyan-200" : "text-cyan-800"}`}>Orquestra.cs</p>
        <p className={`mt-1 font-bold leading-none ${compact ? "text-base" : "text-xl"} ${onDarkSurface ? "text-white" : "text-slate-950"}`}>
          Orquestra <span className={onDarkSurface ? "text-cyan-200" : "text-cyan-700"}>Hub</span>
        </p>
      </div>
    </div>
  );
}

export function OrquestraMark({ className = "" }: { className?: string }) {
  return <Image alt="Marca Orquestra.cs" className={className} height={230} priority src="/icons/orquestra-icon.svg" width={230} />;
}
