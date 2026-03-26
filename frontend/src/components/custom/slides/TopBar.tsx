import { motion } from "motion/react";
import { Upload, X, FileText, Sun, Moon } from "lucide-react";
import { useSlideStore } from "../../../lib/store";
import { useEffect } from "react";

export default function TopBar() {
  const { fileName, requestUploadPicker, theme, setTheme } = useSlideStore();

  // Apply theme class on mount
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    // Cycle between light and dark (skip system for simplicity)
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-background/90 backdrop-blur-md border-b border-outline-variant/10 opacity-0 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-center gap-6">
        <span className="text-primary font-black tracking-tighter text-xl font-figtree">
          Presai.
        </span>
        <div className="h-4 w-px bg-outline-variant/30 hidden md:block" />
        <div className="hidden md:flex items-center gap-2 text-on-surface-variant min-w-0">
          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-medium text-sm tracking-tight truncate max-w-[200px] lg:max-w-[300px] xl:max-w-[400px]">
            {fileName || "No deck uploaded"}
          </span>
        </div>
      </div>
      


      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-muted/50 transition-all duration-200"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={requestUploadPicker}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-transparent text-foreground hover:bg-muted/50 font-medium text-sm tracking-wide transition-all duration-200"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          aria-label="Exit"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </header>
  );
}
