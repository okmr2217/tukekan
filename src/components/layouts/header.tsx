import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-lg items-center px-4">
        <Link href={"/"} className="flex items-center">
          <Image src={"/icon-192.png"} alt="icon" width={32} height={32} />
          <h1 className="text-2xl font-logo text-primary tracking-tight">
            <span className="text-[#e07326]">ツケ</span>カン
          </h1>
        </Link>
      </div>
    </header>
  );
}
