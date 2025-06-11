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
      }, 1500); // Redirect after 1.5 seconds
      return () => clearTimeout(timer); // Cleanup timer on unmount
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="text-2xl font-semibold animate-pulse">
          Loading Application...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6">
      <h1 className="text-6xl font-extrabold mb-6 text-center leading-tight">
        InvoiceFlow
      </h1>
      <p className="text-xl md:text-2xl mb-10 text-center max-w-2xl opacity-90">
        Effortlessly create, manage, and download your invoices with ease.
      </p>

      {/* Conditional rendering based on authentication status */}
      {user ? (
        <div className="text-center">
          <p className="text-lg md:text-xl mb-4">
            Welcome back, <span className="font-bold">{user.name}</span>!
            Redirecting to your dashboard...
          </p>
          <Link href="/dashboard" legacyBehavior>
            <a className="inline-block bg-white text-indigo-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105">
              Go to Dashboard
            </a>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" legacyBehavior>
            <a className="inline-block bg-white text-indigo-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105">
              Login
            </a>
          </Link>
          <Link href="/register" legacyBehavior>
            <a className="inline-block bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-800 transition duration-300 ease-in-out transform hover:scale-105 border-2 border-white">
              Register
            </a>
          </Link>
        </div>
      )}

      <footer className="absolute bottom-6 text-sm opacity-80">
        &copy; {new Date().getFullYear()} InvoiceFlow. All rights reserved.
      </footer>
    </div>
  );
}
