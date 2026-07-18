"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  FileImage,
  File as FileIcon,
  Trash2,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { getToken } from "../lib/auth";

// Adjust this to wherever your backend base URL lives (env var, config file, etc.)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface KBDocument {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIconFor(fileType: string) {
  if (fileType.includes("image")) return FileImage;
  if (fileType.includes("pdf") || fileType.includes("word") || fileType.includes("text")) return FileText;
  return FileIcon;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function KnowledgeBasePage() {
  // ── 1. Document list ──────────────────────────────────────────────────
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await fetch(`${API_BASE}/knowledge/`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error("Failed to load documents");
      const data: KBDocument[] = await res.json();
      setDocuments(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ── 3. Delete ──────────────────────────────────────────────────────────
  const handleDelete = async (docId: number) => {
    setDeletingId(docId);
    try {
      const res = await fetch(`${API_BASE}/knowledge/${docId}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error("Failed to delete document");
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  // ── 2. Upload widget ───────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/knowledge/upload`, {
        method: "POST",
        headers: { ...authHeaders() },
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.detail || "Upload failed");
      }

      // Refresh the list so the new file shows up immediately
      await fetchDocuments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-100">Knowledge Base</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Upload documents so your assistant can reference them in chat.
        </p>
      </div>

      {/* Upload widget */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-400/5"
            : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.bmp"
        />
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        ) : (
          <Upload className="h-8 w-8 text-neutral-400" />
        )}
        <div>
          <p className="text-sm font-medium text-neutral-200">
            {isUploading ? "Uploading…" : "Drop a file here, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            PDF, Word, Text, or Image — up to 50MB
          </p>
        </div>
      </div>

      {uploadError && (
        <p className="mt-3 text-sm text-red-400">{uploadError}</p>
      )}

      {/* Search + refresh */}
      <div className="mt-8 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents…"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-neutral-500"
          />
        </div>
        <button
          onClick={fetchDocuments}
          className="rounded-lg border border-neutral-700 p-2 text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Document list */}
      <div className="mt-4">
        {loadingList && documents.length === 0 && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        )}

        {listError && (
          <p className="py-4 text-sm text-red-400">{listError}</p>
        )}

        {!loadingList && !listError && filteredDocuments.length === 0 && (
          <div className="py-10 text-center text-sm text-neutral-500">
            {documents.length === 0
              ? "No documents yet — upload one to get started."
              : "No documents match your search."}
          </div>
        )}

        <ul className="divide-y divide-neutral-800">
          <AnimatePresence>
            {filteredDocuments.map((doc) => {
              const Icon = fileIconFor(doc.file_type);
              return (
                <motion.li
                  key={doc.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-200">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatBytes(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
                    aria-label={`Delete ${doc.filename}`}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
