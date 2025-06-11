"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/40 to-indigo-300/40 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-blue-300/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-200/20 to-blue-300/20 rounded-full blur-2xl animate-pulse-slow"></div>
      </div>

      {/* Glass Navigation Hint */}
      {/* <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-6 py-2 shadow-lg">
          <div className="flex items-center space-x-4 text-sm text-slate-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>Live Demo Available</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in-up mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-200/50 backdrop-blur-sm">
              <svg
                className="w-4 h-4 text-blue-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="text-sm font-semibold text-blue-700 tracking-wide">
                Lightning Fast PDF Generation
              </span>
            </div>
          </div>

          {/* Headline */}
          <div
            className="animate-fade-in-up mb-8"
            style={{ animationDelay: "0.2s" }}
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Create Invoices
              </span>
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Instantly
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transform origin-left animate-pulse"></div>
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <div
            className="animate-fade-in-up mb-12"
            style={{ animationDelay: "0.4s" }}
          >
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Transform your billing workflow with real-time PDF generation,
              WebSocket updates, and seamless invoice management.{" "}
              <span className="text-blue-600 font-semibold">
                Built for modern businesses.
              </span>
            </p>
          </div>

          {/* Feature Highlights */}
          <div
            className="animate-fade-in-up mb-12"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="flex flex-wrap justify-center gap-2 md:gap-6 text-sm font-medium text-slate-600">
              {[
                { text: "Real-time Updates", color: "emerald-400" },
                { text: "Instant PDF Generation", color: "blue-400" },
                { text: "User Authentication", color: "purple-400" },
              ].map(({ text, color }) => (
                <div
                  key={text}
                  className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/60"
                >
                  <div className={`w-2 h-2 bg-${color} rounded-full`}></div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div
            className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            style={{ animationDelay: "0.8s" }}
          >
            <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <Link href="/register">
                  <span>Start Creating Invoices</span>
                </Link>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </button>

            <button className="group px-8 py-4 bg-white/70 backdrop-blur-sm text-slate-700 font-semibold rounded-xl border border-white/60 hover:bg-white/90 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>View Live Demo</span>
              </div>
            </button>
          </div>

          {/* Feature Cards (repeated for clarity – consider extracting as components) */}
          {/* Copy this section from the HTML above, converted to JSX (optional) */}
        </div>
      </main>

      {/* Floating Decorative Elements */}
      <div
        className="absolute top-1/4 left-10 w-4 h-4 bg-blue-400/60 rounded-full animate-float"
        style={{ animationDelay: "-1s" }}
      ></div>
      <div
        className="absolute top-3/4 right-20 w-6 h-6 bg-indigo-400/60 rounded-full animate-float"
        style={{ animationDelay: "-2s" }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-purple-400/60 rounded-full animate-float"
        style={{ animationDelay: "-4s" }}
      ></div>

      {/* Footer */}
      <footer className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="px-6 py-2">
          <p className="text-sm text-slate-600">
            Made by{" "}
            <Link href="https://github.com/NilanchalaPanda">
              <span className="font-bold underline text-blue-600">nilanchal</span>
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
