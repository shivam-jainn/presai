import ControlPill from "../custom/slides/ControlPill";
import SlideCanvas from "../custom/slides/SlideCanvas";
import TopBar from "../custom/slides/TopBar";

export default function App() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-on-primary overflow-hidden">
        <TopBar />
      <SlideCanvas />
      <ControlPill />

   
    </div>
  );
}
