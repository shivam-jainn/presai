import ControlPill from "../custom/slides/ControlPill";
import SlideCanvas from "../custom/slides/SlideCanvas";
import TopBar from "../custom/slides/TopBar";
import StatusToast from "../custom/slides/StatusToast";
import RealTimeTranscript from "../custom/slides/RealTimeTranscript";

export default function Slides() {
  return (
    <div className="h-screen w-screen bg-neutral-50 dark:bg-neutral-950 selection:bg-primary selection:text-primary-foreground overflow-hidden">
      <TopBar />
      <SlideCanvas />
      <ControlPill />
      <RealTimeTranscript />
      <StatusToast />
    </div>
  );
}
