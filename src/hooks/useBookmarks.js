import { useState, useEffect } from "react";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("bookmarks");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [shortcuts, setShortcuts] = useState(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("shortcuts");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
  }, [shortcuts]);

  const addBookmark = (bookmark) => {
    setBookmarks((prev) => [
      ...prev,
      { id: Date.now(), ...bookmark, addDate: Date.now() },
    ]);
  };

  const addShortcut = (shortcut) => {
    setShortcuts((prev) => [
      ...prev,
      { id: Date.now(), ...shortcut, addDate: Date.now() },
    ]);
  };

  const updateBookmark = (id, updatedData) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updatedData } : b)),
    );
  };

  const updateShortcut = (id, updatedData) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s)),
    );
  };

  const deleteBookmark = (id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const deleteShortcut = (id) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  const importBookmarks = (newBookmarks) => {
    // Check if any belong to "Shortcuts" folder
    const incomingShortcuts = newBookmarks.filter(
      (b) => b.folder === "Shortcuts" || b.folder === "Quick Links",
    );
    // Also filter out Search Engines so they don't appear as bookmarks
    const incomingRegular = newBookmarks.filter(
      (b) =>
        b.folder !== "Shortcuts" &&
        b.folder !== "Quick Links" &&
        b.folder !== "Search Engines",
    );

    setBookmarks((prev) => [...prev, ...incomingRegular]);
    if (incomingShortcuts.length > 0) {
      setShortcuts((prev) => [...prev, ...incomingShortcuts]);
    }
  };

  const resetBookmarks = () => {
    setBookmarks([]);
    setShortcuts([]);
  };

  return {
    bookmarks,
    shortcuts,
    addBookmark,
    addShortcut,
    updateBookmark,
    updateShortcut,
    deleteBookmark,
    deleteShortcut,
    importBookmarks,
    resetBookmarks,
  };
}

// Helper to parse Netscape Bookmark HTML
export const parseBookmarkHTML = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = doc.querySelectorAll("a");
  const parsed = [];

  links.forEach((link, index) => {
    const folder =
      link.closest("dl")?.previousElementSibling?.textContent || "Imported";
    parsed.push({
      id: Date.now() + index,
      title: link.textContent || "Untitled",
      url: link.getAttribute("href") || "",
      folder: folder.trim(),
      addDate: parseInt(link.getAttribute("add_date") || String(Date.now())),
      icon: link.getAttribute("icon") || "",
    });
  });

  return parsed;
};

// Helper to generate Netscape Bookmark HTML
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

  // Shortcuts Folder
  if (shortcuts.length > 0) {
    html += `    <DT><H3>Shortcuts</H3>\n    <DL><p>\n`;
    shortcuts.forEach((bookmark) => {
      html += `        <DT><A HREF="${bookmark.url}" ADD_DATE="${bookmark.addDate}"${bookmark.icon ? ` ICON="${bookmark.icon}"` : ""}>${bookmark.title}</A>\n`;
    });
    html += `    </DL><p>\n`;
  }

  // Search Engines Folder
  if (searchEngines.length > 0) {
    html += `    <DT><H3>Search Engines</H3>\n    <DL><p>\n`;
    searchEngines.forEach((engine) => {
      // We act like it's a bookmark, but the URL contains the query param placeholder
      html += `        <DT><A HREF="${engine.url}" ADD_DATE="${Date.now()}">${engine.name}</A>\n`;
    });
    html += `    </DL><p>\n`;
  }

  // Regular Folders
  folders.forEach((folder) => {
    html += `    <DT><H3>${folder}</H3>\n    <DL><p>\n`;
    bookmarks
      .filter((b) => (b.folder || "Bookmarks") === folder)
      .forEach((bookmark) => {
        html += `        <DT><A HREF="${bookmark.url}" ADD_DATE="${bookmark.addDate}"${bookmark.icon ? ` ICON="${bookmark.icon}"` : ""}>${bookmark.title}</A>\n`;
      });
    html += `    </DL><p>\n`;
  });

  html += `</DL><p>`;
  return html;
};
