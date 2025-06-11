"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, logout } = useAuth();
  const router = useRouter();

  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/invoices`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setInvoices(response.data.invoices);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          logout();
          router.push("/login");
        }
        setError("Failed to load invoices. Please try again.");
      }
    };

    fetchInvoices();

    // Set up WebSocket connection
    const socket = io("http://localhost:5000");

    // Join user's room after connection
    socket.on("connect", () => {
      console.log("Connected to server");
      socket.emit("join", user.id);
    });

    socket.on("invoiceStatusUpdate", (data) => {
      console.log("Received invoice status update:", data);
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice._id === data.invoiceId
            ? { ...invoice, status: data.status, pdfPath: data.pdfPath }
            : invoice
        )
      );
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, [user, router, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/invoices`,
        {
          customerName,
          amount: parseFloat(amount),
          date,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newInvoice = response.data.invoice;
      setInvoices((prev) => [newInvoice, ...prev]);

      setCustomerName("");
      setAmount("");
      setDate("");
    } catch (err) {
      console.error("Error creating invoice:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create invoice. Please check your input."
      );
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        logout();
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/invoices/${invoiceId}/download`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download invoice:", err);
      setError(
        "Failed to download invoice. It might not be ready or an error occurred."
      );
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        logout();
        router.push("/login");
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-700">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Invoice Generator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.name}</span>!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Create New Invoice
            </h2>

            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Customer Name
                </label>
                <input
                  type="text"
                  id="customerName"
                  required
                  className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  required
                  className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  required
                  className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                {loading ? "Generating..." : "Generate Invoice"}
              </button>
            </form>

            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Your Invoices
            </h2>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <li className="px-4 py-6 text-center text-gray-500">
                    No invoices yet. Create your first invoice above.
                  </li>
                ) : (
                  invoices.map((invoice) => (
                    <li
                      key={invoice._id}
                      className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            Invoice Number:{" "}
                            <span className="font-semibold">
                              {invoice.invoiceNumber}
                            </span>
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            Customer:{" "}
                            <span className="font-medium">
                              {invoice.customerName}
                            </span>{" "}
                            | Amount:{" "}
                            <span className="font-medium">
                              $
                              {invoice.amount
                                ? invoice.amount.toFixed(2)
                                : "N/A"}
                            </span>{" "}
                            | Date:{" "}
                            <span className="font-medium">
                              {invoice.date
                                ? new Date(invoice.date).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {invoice.status === "processing" ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                              Processing...
                            </span>
                          ) : (
                            <button
                              onClick={() => downloadInvoice(invoice._id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                              disabled={!invoice.pdfPath}
                            >
                              Download PDF
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
