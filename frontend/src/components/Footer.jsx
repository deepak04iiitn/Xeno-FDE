import React from "react";
import { Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Xeno Data Console
            </p>
            <p className="mt-1 text-xs text-slate-400">
              A clean, modern interface for multi-tenant Shopify analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <a href="#overview" className="hover:text-slate-200">
              Overview
            </a>
            <a href="#features" className="hover:text-slate-200">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-200">
              Pricing
            </a>
            <a href="#insights" className="hover:text-slate-200">
              Docs
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              className="rounded-full border border-slate-700 p-1.5 text-slate-300 hover:border-slate-500 hover:text-white"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              className="rounded-full border border-slate-700 p-1.5 text-slate-300 hover:border-slate-500 hover:text-white"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              className="rounded-full border border-slate-700 p-1.5 text-slate-300 hover:border-slate-500 hover:text-white"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800 pt-4 text-[0.7rem] text-slate-500">
          © {new Date().getFullYear()} Xeno -
          Built with Love.
        </div>
      </div>
    </footer>
  );
}
