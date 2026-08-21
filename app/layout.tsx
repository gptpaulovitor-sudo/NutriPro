import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import {
  LayoutDashboard,
  Activity,
  UtensilsCrossed,
  LineChart,
  Database,
  Smartphone,
  UserCheck,
  Download,
  Upload,
  FileText,
  ShieldAlert,
  Dumbbell,
  Brain,
  Flame,
  TrendingUp,
  Trophy,
} from "lucide-react";

export const metadata: Metadata = {
  title: "NutriAx Pro - Sistema Clínico de Alta Performance",
  description: "Plataforma avançada de avaliação metabólica, prescrição e acompanhamento nutricional",
};

const NAV_ROW_1 = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard & Radar" },
  { href: "/dashboard/evaluation", icon: Activity, label: "Avaliação & Corpo" },
  { href: "/dashboard/prescription", icon: UtensilsCrossed, label: "Prescrição & Macros" },
];

const NAV_ROW_2 = [
  { href: "/dashboard/evolution", icon: LineChart, label: "Evolução Temporal" },
  { href: "/dashboard/foods", icon: Database, label: "Base de Alimentos" },
  { href: "/dashboard/performance", icon: Dumbbell, label: "Performance" },
  { href: "/patient-app", icon: Smartphone, label: "App do Paciente" },
];

const ALL_NAV_MODULES = [...NAV_ROW_1, ...NAV_ROW_2];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full bg-black">
      <body className="h-full bg-black text-gray-200 flex flex-col antialiased selection:bg-red-600 selection:text-white relative overflow-x-hidden">
        
        {/* ═══ MARCA D'ÁGUA HOLOGRÁFICA NO FUNDO ═══ */}
        <div
          className="fixed inset-0 pointer-events-none -z-10 opacity-5 mix-blend-screen"
          style={{
            backgroundImage: "url('/logo.png')",
            backgroundPosition: "bottom right",
            backgroundRepeat: "no-repeat",
            backgroundSize: "50%",
          }}
          aria-hidden="true"
        />

        {/* ═══ CABEÇALHO SUPERIOR (TOP HEADER HUD - 2 LINHAS) ═══ */}
        <header className="sticky top-0 z-50 w-full bg-black/85 backdrop-blur-md border-b border-red-900/50 px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_4px_25px_rgba(0,0,0,0.85)]">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="text-xl font-black tracking-tight text-white group-hover:text-red-400 transition-colors">
                Nutri<span className="text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]">Ax</span>
              </span>
              <span className="text-xs font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/80 px-2 py-0.5 rounded tracking-widest uppercase">
                PRO HUD
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
              <span className="font-bold text-emerald-400">DATA ENGINE ON</span>
            </div>
          </div>

          {/* Navegação Horizontal dos Módulos em 2 Linhas */}
          <nav className="hidden lg:flex flex-col gap-1.5 items-end">
            <div className="flex items-center gap-1.5">
              {NAV_ROW_1.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white bg-zinc-900/60 hover:bg-red-950/40 hover:border-red-600/50 border border-zinc-800/60 transition-all tracking-wide"
                  >
                    <Icon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              {NAV_ROW_2.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white bg-zinc-900/60 hover:bg-red-950/40 hover:border-red-600/50 border border-zinc-800/60 transition-all tracking-wide"
                  >
                    <Icon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Status do Sistema HUD */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
              <span className="font-semibold text-emerald-400">DATA ENGINE ON</span>
            </div>
          </div>
        </header>

        {/* ═══ ESTRUTURA PRINCIPAL: SIDEBAR + CONTEÚDO ═══ */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          
          {/* ═══ BARRA LATERAL (GESTÃO DO PACIENTE + CRONÔMETRO/CRACHÁ) ═══ */}
          <aside className="w-full md:w-72 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-gray-200 border-r border-zinc-800/80 flex flex-col shrink-0 p-5 gap-5 shadow-2xl z-40 md:sticky md:top-[75px] md:h-[calc(100vh-75px)] md:overflow-y-auto">
            
            <div className="space-y-6">
              {/* Logo da Marca no Topo da Sidebar */}
              <div className="pt-2 text-center">
                <img
                  src="/logo.png"
                  alt="NutriAx Logo"
                  className="w-32 mx-auto drop-shadow-[0_0_12px_rgba(255,0,0,0.85)] object-contain"
                />
              </div>

              {/* Card de Gestão do Paciente Ativo */}
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-red-500" />
                    Paciente Ativo
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.9)] animate-pulse" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-white truncate">
                    Paulo Vitor R de Sousa
                  </h2>
                  <p className="text-sm font-medium text-gray-300 mt-0.5">
                    38 anos • 1,96 m • <span className="text-red-400 font-bold">116 kg</span>
                  </p>
                  <p className="text-xs font-semibold text-gray-400 mt-1">
                    Meta: <span className="text-gray-200">Perda de peso & Preservação Muscular</span>
                  </p>
                </div>

                {/* Ações de Nuvem & PDF */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-200 border border-zinc-700 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-red-400" />
                      Baixar
                    </button>
                    <button
                      type="button"
                      className="w-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                    >
                      <Upload className="w-3.5 h-3.5 text-white" />
                      Salvar
                    </button>
                  </div>

                  <button
                    type="button"
                    className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-900/60 hover:border-red-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-red-500" />
                    Exportar Relatório PDF
                  </button>
                </div>
              </div>

              {/* Menu Mobile para telas pequenas */}
              <div className="block lg:hidden space-y-1 pt-2 border-t border-zinc-800">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Navegação dos Módulos
                </span>
                {ALL_NAV_MODULES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-red-500" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ═══ PILARES NUTRIAX ═══ */}
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 rounded-xl p-4 space-y-1.5 shrink-0">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Trophy className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">
                  Pilares NutriAx
                </span>
              </div>

              {/* Pilar 1 — Mentalidade (Em Breve) */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 opacity-50 cursor-not-allowed">
                <Brain className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-zinc-400 block">1. Mentalidade</span>
                </div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Em breve</span>
              </div>

              {/* Pilar 2 — Disciplina (Em Breve) */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 opacity-50 cursor-not-allowed">
                <ShieldAlert className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-zinc-400 block">2. Disciplina</span>
                </div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Em breve</span>
              </div>

              {/* Pilar 3 — Nutrição */}
              <Link
                href="/dashboard/prescription"
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-950/30 border border-red-800/40 hover:border-red-600/60 hover:bg-red-950/50 transition-all group"
              >
                <UtensilsCrossed className="w-4 h-4 text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-red-300 block">3. Nutrição</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse" />
              </Link>

              {/* Pilar 4 — Performance — LINK ATIVO */}
              <Link
                href="/dashboard/performance"
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-950/30 border border-blue-800/40 hover:border-blue-500/60 hover:bg-blue-950/50 transition-all group"
              >
                <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-blue-300 block">4. Performance</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.9)]" />
              </Link>

              {/* Pilar 5 — Resultado (Em Breve) */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 opacity-50 cursor-not-allowed">
                <Flame className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-zinc-400 block">5. Resultado</span>
                </div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Em breve</span>
              </div>
            </div>

            {/* ═══ CARTÃO DO NUTRICIONISTA (RODAPÉ DA SIDEBAR) ═══ */}
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center gap-3">
                {/* Foto do Nutricionista */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-red-500/40 shrink-0 shadow-[0_0_10px_rgba(255,0,0,0.3)]">
                  <img
                    src="/nutritionist.jpg"
                    alt="Paulo Vitor Ribeiro de Sousa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-red-950/10 mix-blend-color" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-white leading-tight truncate">
                    Paulo Vitor Ribeiro de Sousa
                  </h3>
                  <p className="text-[11px] font-semibold text-red-400 tracking-wide mt-0.5 truncate">
                    Nutricionista Responsável
                  </p>
                </div>
              </div>

              {/* Indicador LED Verde de Online */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/70 text-xs font-mono">
                <span className="text-gray-400 font-medium">Status da Estação:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse" />
                  <span className="font-bold text-emerald-400">ONLINE</span>
                </div>
              </div>
            </div>

          </aside>

          {/* ═══ ÁREA DE CONTEÚDO PRINCIPAL ═══ */}
          <main className="flex-1 bg-black p-4 md:p-6 lg:p-8">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}
