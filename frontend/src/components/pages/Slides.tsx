import ControlPill from "../custom/slides/ControlPill";
import SlideCanvas from "../custom/slides/SlideCanvas";
import TopBar from "../custom/slides/TopBar";

export default function App() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-on-primary overflow-hidden">
        <TopBar />
      <SlideCanvas />
      <ControlPill />

      {/* Background Atmospheric Elements */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
