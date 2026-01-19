import { useState, useEffect } from "react";
import { searchEngines as defaultEngines } from "../data/searchEngines";

export function useSearchEngines() {
  const [engines, setEngines] = useState(() => {
    let initialEngines = defaultEngines;

    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("searchEngines");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Re-hydrate icons for default engines because they contain React Elements which don't survive JSON serialization
          initialEngines = parsed.map((eng) => {
            const defaultEngine = defaultEngines.find((d) => d.id === eng.id);
            if (defaultEngine) {
              return { ...eng, icon: defaultEngine.icon };
            }
            return eng;
          });
        } catch (e) {
          console.error("Failed to parse search engines", e);
        }
      }
    }
    return initialEngines;
  });

  useEffect(() => {
    // Strip icons before saving to avoid React Element serialization issues
    // We create a clean copy where 'icon' is removed
    const toSave = engines.map(({ icon, ...rest }) => rest);
    localStorage.setItem("searchEngines", JSON.stringify(toSave));
  }, [engines]);

  const addEngine = (engine) => {
    setEngines((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ...engine,
        // If no icon is provided, we can't really generate a complex SVG here.
        // The consumer of this hook will handle the favicon display logic based on URL.
        isCustom: true,
      },
    ]);
  };

  const deleteEngine = (id) => {
    // Prevent deleting default engines? Or allow it?
    // Let's allow deleting custom ones only to stay safe for now, or all if user wants control.
    // User asked "add custom search engines", implies managing them.
    setEngines((prev) => prev.filter((e) => e.id !== id));
  };

  // Import logic: Merge new engines, avoiding duplicates by URL
  const importEngines = (newEngines) => {
    setEngines((prev) => {
      const combined = [...prev];
      newEngines.forEach((ne) => {
        // Check if engine with same URL already exists
        if (!combined.some((e) => e.url === ne.url)) {
          combined.push({
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: ne.name,
            url: ne.url,
            isCustom: true,
          });
        }
      });
      return combined;
    });
  };

  const resetEngines = () => {
    setEngines(defaultEngines);
  };

  return {
    engines,
    addEngine,
    deleteEngine,
    importEngines,
    resetEngines,
  };
}
