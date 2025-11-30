import React from "react";
import {
  BarChart3,
  ShoppingBag,
  Users,
  Clock,
  ArrowRight,
  LineChart,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
    
  const stats = [
    { label: "Customers synced", value: "120k+" },
    { label: "Orders processed", value: "3.2M" },
    { label: "Avg. uplift", value: "18%" },
  ];

  const features = [
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      title: "Shopify-native ingestion",
      desc: "Plug into Shopify once and keep your customer, order, and product data continuously in sync.",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Live business insights",
      desc: "Monitor revenue, cohorts, and repeat behavior in real time with beautiful visual dashboards.",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Multi-tenant ready",
      desc: "Serve multiple brands from a single platform while keeping data isolated and secure.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Enterprise-grade security",
      desc: "Isolated schemas, strict auth, and auditable access baked in from day zero.",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 flex justify-center">
        <div className="h-64 w-[36rem] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Content wrapper */}
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-16 pt-8 md:px-6 lg:px-8 lg:pt-12">
        {/* Hero */}
        <section
          id="overview"
          className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5" />
              <span className="uppercase tracking-[0.2em] text-[0.65rem] text-slate-500">
                Shopify data · In minutes
              </span>
            </div>

            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              A single, beautiful console for{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                all your Shopify customer data.
              </span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Ingest, unify, and visualize your Shopify customers, orders, and
              products from multiple stores — without wrestling with raw APIs or
              spreadsheets.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-500/50">
                Launch sandbox
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Watch 2-min demo
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right card: mini dashboard mock */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-xl shadow-slate-200/40">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">This week</p>
                <p className="text-xl font-semibold text-slate-900">
                  ₹8.4L revenue
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <LineChart className="h-3.5 w-3.5" />
                +14.2%
              </span>
            </div>

            <div className="space-y-3 rounded-2xl bg-white p-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Top customers</span>
                <span className="text-slate-400">Last 30 days</span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { name: "Dev Store - India", value: "₹1.4L" },
                  { name: "Demo Store - US", value: "$2.8k" },
                  { name: "Test Store - EU", value: "€1.1k" },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span className="truncate text-slate-700">{c.name}</span>
                    <span className="font-medium text-slate-900">
                      {c.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">Repeat rate</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  32%
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">Avg. AOV</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  ₹1,280
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">Stores</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  5
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Built for fast-moving data teams.
              </h2>
              <p className="max-w-xl text-sm text-slate-600">
                Everything you need to ingest Shopify data, keep it in sync, and
                turn it into decision-ready insights.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-500/70 hover:bg-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:text-indigo-700">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Simple pricing / CTA */}
        <section
          id="pricing"
          className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Start with a sandbox store today.
              </h2>
              <p className="mt-1 max-w-md text-sm text-slate-600">
                Connect your Shopify development store, explore the dashboards,
                and ship your assignment with a production-grade foundation.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <p className="text-xs uppercase tracking-wide text-emerald-600">
                Free for development stores
              </p>
              <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/50">
                Connect Shopify
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className="text-[0.7rem] text-slate-500">
                No credit card. Localhost-friendly.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
