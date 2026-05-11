import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

const LS_BOOKMARKS = "bookmarks";
const LS_SHORTCUTS = "shortcuts";

const load = (key, fallback) => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or JSON error — ignore */
  }
};

const makeId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Hybrid bookmarks hook.
 *
 * - Unauthenticated: data lives in localStorage.
 * - Authenticated: data lives in Firestore at users/{uid}/bookmarks|shortcuts.
 *   We also mirror to localStorage so the *next* cold boot paints instantly,
 *   before Firestore's own IndexedDB cache hydrates.
 *
 * Mutations are optimistic — local state updates immediately, then we write
 * to Firestore; Firestore's onSnapshot (which is offline-safe) will reconcile.
 */
export function useBookmarks() {
  const { user } = useAuth();
  const uid = user?.uid || null;

  // Start from the LS cache — instant paint, even if Firebase's cache is cold.
  const [bookmarks, setBookmarks] = useState(() => load(LS_BOOKMARKS, []));
  const [shortcuts, setShortcuts] = useState(() => load(LS_SHORTCUTS, []));
  const [syncState, setSyncState] = useState("local"); // 'local' | 'syncing' | 'synced' | 'error'
  const mode = uid && db ? "cloud" : "local";
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Persist LS mirror on every change (both modes — so signing out keeps data).
  useEffect(() => {
    save(LS_BOOKMARKS, bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    save(LS_SHORTCUTS, shortcuts);
  }, [shortcuts]);

  // Firestore subscription
  useEffect(() => {
    if (!uid || !db) {
      setSyncState("local");
      return;
    }

    setSyncState("syncing");

    const bmQ = query(
      collection(db, "users", uid, "bookmarks"),
      orderBy("addDate", "asc"),
    );
    const scQ = query(
      collection(db, "users", uid, "shortcuts"),
      orderBy("addDate", "asc"),
    );

    const unsubBm = onSnapshot(
      bmQ,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBookmarks(items);
        setSyncState("synced");
      },
      (err) => {
        console.warn("Bookmarks subscription error:", err);
        setSyncState("error");
      },
    );

    const unsubSc = onSnapshot(
      scQ,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setShortcuts(items);
      },
      (err) => console.warn("Shortcuts subscription error:", err),
    );

    return () => {
      unsubBm();
      unsubSc();
    };
  }, [uid]);

  // ----- writes -----

  const writeBookmark = useCallback(
    (bookmark) => {
      if (modeRef.current === "cloud" && db && uid) {
        setDoc(
          doc(db, "users", uid, "bookmarks", bookmark.id),
          bookmark,
        ).catch((err) => console.warn("write bookmark failed:", err));
      }
    },
    [uid],
  );

  const writeShortcut = useCallback(
    (shortcut) => {
      if (modeRef.current === "cloud" && db && uid) {
        setDoc(
          doc(db, "users", uid, "shortcuts", shortcut.id),
          shortcut,
        ).catch((err) => console.warn("write shortcut failed:", err));
      }
    },
    [uid],
  );

  const removeBookmarkRemote = useCallback(
    (id) => {
      if (modeRef.current === "cloud" && db && uid) {
        deleteDoc(doc(db, "users", uid, "bookmarks", id)).catch((err) =>
          console.warn("delete bookmark failed:", err),
        );
      }
    },
    [uid],
  );

  const removeShortcutRemote = useCallback(
    (id) => {
      if (modeRef.current === "cloud" && db && uid) {
        deleteDoc(doc(db, "users", uid, "shortcuts", id)).catch((err) =>
          console.warn("delete shortcut failed:", err),
        );
      }
    },
    [uid],
  );

  // ----- CRUD -----

  const addBookmark = useCallback(
    (bookmark) => {
      const full = {
        id: makeId(),
        pinned: false,
        notes: "",
        visits: 0,
        lastVisited: null,
        ...bookmark,
        addDate: Date.now(),
      };
      // ensure id is a string so Firestore doc id works
      full.id = String(full.id);
      setBookmarks((prev) => [...prev, full]);
      writeBookmark(full);
    },
    [writeBookmark],
  );

  const addShortcut = useCallback(
    (shortcut) => {
      const full = {
        id: makeId(),
        ...shortcut,
        addDate: Date.now(),
      };
      full.id = String(full.id);
      setShortcuts((prev) => [...prev, full]);
      writeShortcut(full);
    },
    [writeShortcut],
  );

  const updateBookmark = useCallback(
    (id, updatedData) => {
      setBookmarks((prev) => {
        const next = prev.map((b) =>
          b.id === id ? { ...b, ...updatedData } : b,
        );
        const merged = next.find((b) => b.id === id);
        if (merged) writeBookmark(merged);
        return next;
      });
    },
    [writeBookmark],
  );

  const updateShortcut = useCallback(
    (id, updatedData) => {
      setShortcuts((prev) => {
        const next = prev.map((s) =>
          s.id === id ? { ...s, ...updatedData } : s,
        );
        const merged = next.find((s) => s.id === id);
        if (merged) writeShortcut(merged);
        return next;
      });
    },
    [writeShortcut],
  );

  const deleteBookmark = useCallback(
    (id) => {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      removeBookmarkRemote(id);
    },
    [removeBookmarkRemote],
  );

  const deleteShortcut = useCallback(
    (id) => {
      setShortcuts((prev) => prev.filter((s) => s.id !== id));
      removeShortcutRemote(id);
    },
    [removeShortcutRemote],
  );

  const togglePin = useCallback(
    (id) => {
      setBookmarks((prev) => {
        const next = prev.map((b) =>
          b.id === id ? { ...b, pinned: !b.pinned } : b,
        );
        const merged = next.find((b) => b.id === id);
        if (merged) writeBookmark(merged);
        return next;
      });
    },
    [writeBookmark],
  );

  const recordVisit = useCallback(
    (id) => {
      setBookmarks((prev) => {
        const next = prev.map((b) =>
          b.id === id
            ? {
                ...b,
                visits: (b.visits || 0) + 1,
                lastVisited: Date.now(),
              }
            : b,
        );
        const merged = next.find((b) => b.id === id);
        if (merged) writeBookmark(merged);
        return next;
      });
    },
    [writeBookmark],
  );

  const reorderBookmarks = useCallback((_folder, fromId, toId) => {
    // Local reorder only — there's no "order" column yet, so this doesn't persist
    // across cloud sync. Still useful inside a single session.
    setBookmarks((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((b) => b.id === fromId);
      const toIndex = next.findIndex((b) => b.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = next.splice(fromIndex, 1);
      const adjustedTo = next.findIndex((b) => b.id === toId);
      next.splice(adjustedTo, 0, moved);
      return next;
    });
  }, []);

  const bulkUpdateFolder = useCallback(
    (ids, folder) => {
      const idSet = new Set(ids);
      let changed = [];
      setBookmarks((prev) => {
        const next = prev.map((b) => {
          if (idSet.has(b.id)) {
            const updated = { ...b, folder };
            changed.push(updated);
            return updated;
          }
          return b;
        });
        return next;
      });
      // batch write
      if (modeRef.current === "cloud" && db && uid && changed.length) {
        const batch = writeBatch(db);
        changed.forEach((b) => {
          batch.set(doc(db, "users", uid, "bookmarks", b.id), b);
        });
        batch.commit().catch((err) => console.warn("bulk update failed:", err));
      }
    },
    [uid],
  );

  const bulkDelete = useCallback(
    (ids) => {
      const idSet = new Set(ids);
      setBookmarks((prev) => prev.filter((b) => !idSet.has(b.id)));
      if (modeRef.current === "cloud" && db && uid && ids.length) {
        const batch = writeBatch(db);
        ids.forEach((id) => {
          batch.delete(doc(db, "users", uid, "bookmarks", id));
        });
        batch.commit().catch((err) => console.warn("bulk delete failed:", err));
      }
    },
    [uid],
  );

  const importBookmarks = useCallback(
    (newBookmarks) => {
      const incomingShortcuts = newBookmarks.filter(
        (b) => b.folder === "Shortcuts" || b.folder === "Quick Links",
      );
      const incomingRegular = newBookmarks.filter(
        (b) =>
          b.folder !== "Shortcuts" &&
          b.folder !== "Quick Links" &&
          b.folder !== "Search Engines",
      );

      const existingBmUrls = new Set(bookmarks.map((b) => b.url));
      const existingScUrls = new Set(shortcuts.map((s) => s.url));

      const newBms = incomingRegular
        .filter((b) => !existingBmUrls.has(b.url))
        .map((b) => ({
          id: makeId(),
          pinned: false,
          notes: "",
          visits: 0,
          lastVisited: null,
          ...b,
          id_override: undefined,
        }))
        .map((b) => ({ ...b, id: String(makeId()) }));

      const newSc = incomingShortcuts
        .filter((b) => !existingScUrls.has(b.url))
        .map((b) => ({ ...b, id: String(makeId()) }));

      setBookmarks((prev) => [...prev, ...newBms]);
      setShortcuts((prev) => [...prev, ...newSc]);

      if (modeRef.current === "cloud" && db && uid && (newBms.length || newSc.length)) {
        const batch = writeBatch(db);
        newBms.forEach((b) =>
          batch.set(doc(db, "users", uid, "bookmarks", b.id), b),
        );
        newSc.forEach((s) =>
          batch.set(doc(db, "users", uid, "shortcuts", s.id), s),
        );
        batch.commit().catch((err) => console.warn("import batch failed:", err));
      }

      return {
        bookmarksAdded: newBms.length,
        shortcutsAdded: newSc.length,
      };
    },
    [bookmarks, shortcuts, uid],
  );

  const resetBookmarks = useCallback(() => {
    const currentBmIds = bookmarks.map((b) => b.id);
    const currentScIds = shortcuts.map((s) => s.id);
    setBookmarks([]);
    setShortcuts([]);
    if (modeRef.current === "cloud" && db && uid) {
      const batch = writeBatch(db);
      currentBmIds.forEach((id) =>
        batch.delete(doc(db, "users", uid, "bookmarks", id)),
      );
      currentScIds.forEach((id) =>
        batch.delete(doc(db, "users", uid, "shortcuts", id)),
      );
      batch.commit().catch((err) => console.warn("reset batch failed:", err));
    }
  }, [bookmarks, shortcuts, uid]);

  return {
    bookmarks,
    shortcuts,
    mode,
    syncState,
    addBookmark,
    addShortcut,
    updateBookmark,
    updateShortcut,
    deleteBookmark,
    deleteShortcut,
    togglePin,
    recordVisit,
    reorderBookmarks,
    bulkUpdateFolder,
    bulkDelete,
    importBookmarks,
    resetBookmarks,
  };
}

export const parseBookmarkHTML = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = doc.querySelectorAll("a");
  const parsed = [];

  links.forEach((link, index) => {
    const folder =
      link.closest("dl")?.previousElementSibling?.textContent || "Imported";
    parsed.push({
      id: `${Date.now()}_${index}`,
      title: link.textContent || "Untitled",
      url: link.getAttribute("href") || "",
      folder: folder.trim(),
      addDate: parseInt(link.getAttribute("add_date") || String(Date.now())),
      icon: link.getAttribute("icon") || "",
      pinned: false,
      notes: "",
      visits: 0,
      lastVisited: null,
    });
  });

  return parsed;
};

// Escape for safe inclusion in an HTML attribute/text.
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Netscape bookmark files expect ADD_DATE as *seconds* since epoch, not ms.
// Chrome still accepts ms, but some other browsers don't — convert to seconds
// if the value looks like a ms-epoch.
const toNetscapeDate = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return Math.floor(Date.now() / 1000);
  return v > 1e12 ? Math.floor(v / 1000) : Math.floor(v);
};

export const generateBookmarkHTML = (
  bookmarks,
  shortcuts = [],
  searchEngines = [],
) => {
  const folders = [...new Set(bookmarks.map((b) => b.folder || "Bookmarks"))];

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`;

  const now = Math.floor(Date.now() / 1000);

  const writeFolder = (folderName, items, extra = "") => {
    html += `    <DT><H3 ADD_DATE="${now}"${extra}>${esc(folderName)}</H3>\n    <DL><p>\n`;
    items.forEach((bm) => {
      const date = toNetscapeDate(bm.addDate);
      const icon = bm.icon ? ` ICON="${esc(bm.icon)}"` : "";
      html += `        <DT><A HREF="${esc(bm.url)}" ADD_DATE="${date}"${icon}>${esc(bm.title || bm.url)}</A>\n`;
    });
    html += `    </DL><p>\n`;
  };

  if (shortcuts.length > 0) {
    writeFolder("Shortcuts", shortcuts);
  }

  if (searchEngines.length > 0) {
    writeFolder(
      "Search Engines",
      searchEngines.map((e) => ({
        title: e.name,
        url: e.url,
        addDate: now,
      })),
    );
  }

  folders.forEach((folder) => {
    const items = bookmarks.filter((b) => (b.folder || "Bookmarks") === folder);
    writeFolder(folder, items);
  });

  html += `</DL><p>`;
  return html;
};

export const generateBookmarkJSON = (
  bookmarks,
  shortcuts = [],
  searchEngines = [],
) => {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks,
      shortcuts,
      searchEngines: searchEngines.map(({ icon, ...rest }) => rest),
    },
    null,
    2,
  );
};

export const parseBookmarkJSON = (text) => {
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== "object") return null;
    return {
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
      shortcuts: Array.isArray(data.shortcuts) ? data.shortcuts : [],
      searchEngines: Array.isArray(data.searchEngines)
        ? data.searchEngines
        : [],
    };
  } catch {
    return null;
  }
};
