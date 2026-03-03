"use client";

import { useState, useEffect, useCallback } from "react";
import type { WatchItem } from "@/lib/types";

const INPUT_CLASS =
  "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700";
const EDIT_INPUT_CLASS =
  "w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 text-sm";

export default function WatchesPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editPartNumber, setEditPartNumber] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/watches");
      if (!res.ok) throw new Error("Failed to load watch items");
      const data: WatchItem[] = await res.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, userEmail, partNumber, note }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to add watch item");
      }

      // Reset form and refresh list
      setUserName("");
      setUserEmail("");
      setPartNumber("");
      setNote("");
      await fetchItems();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: number) {
    try {
      const res = await fetch(`/api/watches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove watch item");
      if (editId === id) setEditId(null);
      await fetchItems();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function startEdit(item: WatchItem) {
    setEditId(item.id);
    setEditUserName(item.userName);
    setEditUserEmail(item.userEmail);
    setEditPartNumber(item.partNumber);
    setEditNote(item.note);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function handleSaveEdit() {
    if (editId === null) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/watches/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: editUserName,
          userEmail: editUserEmail,
          partNumber: editPartNumber,
          note: editNote,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update watch item");
      }

      setEditId(null);
      await fetchItems();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Watch List</h1>
      <p className="text-gray-500 mb-6">
        Add, edit, or remove part numbers to be notified about upcoming production.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Add Watch Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">Add a Watch</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="userName">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="userName"
              type="text"
              required
              maxLength={200}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="userEmail">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="userEmail"
              type="email"
              required
              maxLength={200}
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className={INPUT_CLASS}
              placeholder="jane.smith@teledyne.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="partNumber">
              Part Number <span className="text-red-500">*</span>
            </label>
            <input
              id="partNumber"
              type="text"
              required
              maxLength={100}
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              className={INPUT_CLASS}
              placeholder="1234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="note">
              Reason / Note
            </label>
            <input
              id="note"
              type="text"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Tracking yield issue"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded transition-colors"
        >
          {submitting ? "Adding..." : "Add Watch"}
        </button>
      </form>

      {/* Watch Items Table */}
      {loading ? (
        <p className="text-gray-500">Loading watch items...</p>
      ) : items.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
          No watch items yet. Add one above to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Part Number</th>
                <th className="px-4 py-2 text-left">Note</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editId === item.id ? (
                  <tr
                    key={item.id}
                    className="border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20"
                  >
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        required
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        className={EDIT_INPUT_CLASS}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="email"
                        required
                        value={editUserEmail}
                        onChange={(e) => setEditUserEmail(e.target.value)}
                        className={EDIT_INPUT_CLASS}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        required
                        value={editPartNumber}
                        onChange={(e) => setEditPartNumber(e.target.value)}
                        className={`${EDIT_INPUT_CLASS} font-semibold`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className={EDIT_INPUT_CLASS}
                      />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(item.createdDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving || !editUserName || !editUserEmail || !editPartNumber}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm px-3 py-1 rounded transition-colors"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-sm px-3 py-1 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                <tr
                  key={item.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 even:bg-gray-50 dark:even:bg-gray-800/50"
                >
                  <td className="px-4 py-2">{item.userName}</td>
                  <td className="px-4 py-2">{item.userEmail}</td>
                  <td className="px-4 py-2 font-semibold">{item.partNumber}</td>
                  <td className="px-4 py-2">{item.note}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(item.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        disabled={editId !== null}
                        className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white text-sm px-3 py-1 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={editId !== null}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm px-3 py-1 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
