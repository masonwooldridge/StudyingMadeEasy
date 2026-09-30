import type { ReactNode } from "react";
import Brand from "./brand";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f3f0e8] p-3 sm:p-5">
      <div className="subtle-shadow mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1440px] overflow-hidden rounded-[28px] border border-[#d9d4c8] bg-[#fbfaf6] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="paper-grid relative hidden overflow-hidden bg-[#1d3b2d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <Brand light />

          <div className="relative z-10 max-w-xl py-16">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.23em] text-[#d9b9a7]">
              Built for real coursework
            </p>
            <h2 className="display-type text-6xl font-medium leading-[0.98] tracking-[-0.045em]">
              Your notes should do more than sit in a folder.
            </h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-white/70">
              Turn dense reading into a searchable, source-grounded study space that stays focused on your material.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5 border-t border-white/15 pt-7 text-sm text-white/70">
            <div><span className="mb-2 block text-2xl text-white">01</span>Upload course PDFs</div>
            <div><span className="mb-2 block text-2xl text-white">02</span>Find ideas by meaning</div>
            <div><span className="mb-2 block text-2xl text-white">03</span>Study with citations</div>
          </div>

          <div className="absolute -right-28 top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-8 top-48 h-48 w-48 rounded-full border border-[#b65f42]/50" />
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-20">
          <div className="w-full max-w-md">
            <div className="mb-12 lg:hidden"><Brand /></div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b65f42]">{eyebrow}</p>
            <h1 className="display-type mt-4 text-5xl font-semibold leading-none tracking-[-0.04em] text-[#1d251f]">
              {title}
            </h1>
            <p className="mt-4 leading-7 text-[#687169]">{subtitle}</p>
            <div className="mt-9">{children}</div>
            <div className="mt-8 border-t border-[#d9d4c8] pt-6 text-sm text-[#687169]">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
