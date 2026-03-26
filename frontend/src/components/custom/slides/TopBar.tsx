import { motion } from "motion/react";
import { Upload, LogOut, FileText } from "lucide-react";
import { useSlideStore } from "../../../lib/store";

export default function TopBar() {
  const { fileName, requestUploadPicker } = useSlideStore();

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-background/80 backdrop-blur-md border-b border-outline-variant/10">
      <div className="flex items-center gap-6">
        <span className="text-primary font-black tracking-tighter text-xl font-figtree">
          Presai.
        </span>
        <div className="h-4 w-px bg-outline-variant/30 hidden md:block" />
        <div className="hidden md:flex items-center gap-2 text-on-surface-variant">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm tracking-tight">
            {fileName || "No deck uploaded"}
          </span>
        </div>
      </div>
      
      <nav className="hidden lg:flex items-center gap-8">
        <a 
          href="#" 
          className="text-primary border-b-2 border-primary pb-1 font-figtree font-bold tracking-tight text-lg hover:text-white transition-colors duration-200"
        >
          Deck
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <motion.button 
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(211, 187, 255, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={requestUploadPicker}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-lg font-bold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-primary/10"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden text-white sm:inline">Upload another deck</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface font-bold text-sm tracking-wide transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit</span>
        </motion.button>
      </div>
    </header>
  );
}
