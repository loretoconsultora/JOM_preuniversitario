import Image from "next/image";

export function JomLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logo-jom.png"
      alt="JOM Preuniversitario"
      width={640}
      height={279}
      priority
      className={`rounded-lg bg-jom-white p-1 ${className}`}
    />
  );
}
