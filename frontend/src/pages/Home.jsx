import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ShoppingBag,
  Users,
  Clock,
  ArrowRight,
  LineChart,
  ShieldCheck,
  Zap,
  TrendingUp,
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 text-slate-900">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 flex justify-center">
        <div className="h-96 w-[36rem] rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-1/2 -z-10 flex justify-center">
        <div className="h-64 w-[28rem] rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      {/* Content wrapper */}
      <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 pb-20 pt-12 md:px-6 lg:px-8 lg:pt-20">
        {/* Hero */}
        <section
          id="overview"
          className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center"
        >
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 to-sky-50/80 backdrop-blur-sm px-4 py-2 text-xs text-slate-700 shadow-sm">
              <Zap className="h-3.5 w-3.5 text-indigo-600" />
              <span className="uppercase tracking-[0.2em] text-[0.65rem] font-semibold text-indigo-700">
                Shopify data · In minutes
              </span>
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-tight">
              A single, beautiful console for{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                all your Shopify customer data.
              </span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Ingest, unify, and visualize your Shopify customers, orders, and
              products from multiple stores — without wrestling with raw APIs or
              spreadsheets.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/sign-up"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/sign-in"
                className="text-base font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Sign In →
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-5 py-4 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-2">
                    {stat.label}
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right card: mini dashboard mock */}
          <div className="relative rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 shadow-2xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-500 animate-in fade-in slide-in-from-right">
            <div className="absolute -top-3 -right-3 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-sky-400/20 rounded-full blur-2xl"></div>
            
            <div className="mb-5 flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">This week</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  $84.2K revenue
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/50">
                <TrendingUp className="h-3.5 w-3.5" />
                +14.2%
              </span>
            </div>

            <div className="space-y-3 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 border border-slate-100 relative z-10">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-3">
                <span>Top Stores</span>
                <span className="text-slate-400">Last 30 days</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: "Dev Store - India", value: "$14.2K", colorClass: "bg-indigo-500" },
                  { name: "Demo Store - US", value: "$8.8K", colorClass: "bg-sky-500" },
                  { name: "Test Store - EU", value: "$5.1K", colorClass: "bg-emerald-500" },
                ].map((c, idx) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-3 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${c.colorClass}`}></div>
                      <span className="truncate text-sm font-medium text-slate-700">{c.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {c.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 relative z-10">
              {[
                { label: "Repeat rate", value: "32%", icon: "🔄" },
                { label: "Avg. AOV", value: "$128", icon: "💰" },
                { label: "Stores", value: "5", icon: "🏪" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-3 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Built for fast-moving data teams.
              </h2>
              <p className="max-w-xl text-base text-slate-600 leading-relaxed">
                Everything you need to ingest Shopify data, keep it in sync, and
                turn it into decision-ready insights.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-indigo-300 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-600 group-hover:from-indigo-200 group-hover:to-sky-200 transition-all duration-300 shadow-sm">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section
          id="pricing"
          className="relative rounded-3xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 backdrop-blur-sm p-8 sm:p-12 overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-sky-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-400/10 to-sky-400/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100/80 px-4 py-1.5 border border-indigo-200/50">
                <Zap className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                  Get Started Today
                </span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Ready to transform your Shopify data?
              </h2>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Join thousands of businesses using Xeno to unlock powerful insights from their Shopify stores. 
                Start your free account and explore the dashboards with a production-grade foundation.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:items-end sm:min-w-[280px]">
              <Link
                to="/sign-up"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">✓</span>
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
