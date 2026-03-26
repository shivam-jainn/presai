import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { UploadCloud } from "lucide-react";
import { init, type PPTXPreviewer } from "pptx-preview";
import { ApiError, getPPTXUrl, ingestPPT } from "../../../lib/api";
import { useSlideStore } from "../../../lib/store";

const ACCEPTED_EXTENSIONS = ["ppt", "pptx"];
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

const isAllowedPresentation = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ACCEPTED_EXTENSIONS.includes(extension);
};

export default function SlideCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const renderRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<PPTXPreviewer | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const {
    isFileUploaded,
    isIngesting,
    ingestionStatus,
    ingestionError,
    currentSlide,
    totalSlides,
    uploadPickerRequest,
    setFileUploaded,
    setPptUrl,
    setIngestionSessionId,
    setIngestionStatus,
    setSlideContent,
    setTotalSlides,
    setCurrentSlide,
  } = useSlideStore();

  useEffect(() => {
    if (!containerRef.current) return;
    
    // ResizeObserver ensures scale perfectly tracks container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Calculate the scale needed to fit the slide exactly into the container
        // using object-fit: contain logic mathematically.
        const newScale = Math.min(width / SLIDE_WIDTH, height / SLIDE_HEIGHT);
        setScale(newScale || 1);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (uploadPickerRequest > 0) {
      inputRef.current?.click();
    }
  }, [uploadPickerRequest]);

  useEffect(() => {
    return () => {
      previewRef.current?.destroy();
      previewRef.current = null;
    };
  }, []);

  // Update slide rendering when currentSlide changes
  useEffect(() => {
    if (!previewRef.current || !isFileUploaded || totalSlides <= 0) {
      return;
    }
    previewRef.current.renderSingleSlide(currentSlide);
  }, [currentSlide, isFileUploaded, totalSlides]);

  const renderLocalFile = async (file: File): Promise<void> => {
    if (!renderRef.current) {
      throw new Error("Slide rendering container is not ready");
    }

    previewRef.current?.destroy();
    renderRef.current.innerHTML = "";

    const buffer = await file.arrayBuffer();
    const previewer = init(renderRef.current, {
      mode: "slide",
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
    });
    await previewer.preview(buffer);
    previewer.renderSingleSlide(0);
    previewRef.current = previewer;

    const detectedSlides = previewer.slideCount ?? 0;
    setTotalSlides(detectedSlides);
    setCurrentSlide(0);
  };

  const processFile = async (file: File): Promise<void> => {
    setLocalError(null);

    if (!isAllowedPresentation(file)) {
      const message = "Only .ppt and .pptx files are supported.";
      setLocalError(message);
      setIngestionStatus("failed", message);
      return;
    }

    try {
      setCurrentSlide(0);
      setTotalSlides(0);
      await renderLocalFile(file);
      setFileUploaded(true, file.name);
      setIngestionStatus("ingesting");

      const result = await ingestPPT(file);
      setSlideContent(result.slides ?? {});
      const localRenderedSlides = previewRef.current?.slideCount ?? 0;
      setTotalSlides(Math.max(localRenderedSlides, result.total_slides ?? 0));
      setPptUrl(result.file_url ?? getPPTXUrl(result.filename));
      setIngestionSessionId(result.ingestion_session_id ?? null);
      setIngestionStatus("success");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unable to upload and render this presentation.";
      setLocalError(message);
      setIngestionStatus("failed", message);
    }
  };

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }

    event.target.value = "";
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleOpenPicker = () => {
    inputRef.current?.click();
  };

  return (
    <main className="min-h-screen pt-24 pb-40 px-6 flex flex-col items-center justify-center">

      <div className="relative w-full max-w-6xl aspect-video group">
        <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        <motion.div
          onClick={() => {
            if (!isFileUploaded) {
              handleOpenPicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          whileHover={{ scale: 1.003 }}
          className={`relative h-full w-full rounded-xl overflow-hidden border transition-colors duration-200 cursor-pointer ${
            dragActive
              ? "border-primary/60 bg-primary/5"
              : "border-outline-variant/20 bg-surface-container-low"
          } shadow-[0_24px_80px_rgba(0,0,0,0.6)]`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            onChange={handleInputChange}
          />

          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-linear-to-br from-surface-container-low via-transparent to-surface-container-low/40" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#d3bbff_0%,transparent_70%)]" />
          </div>

          {!isFileUploaded && (
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-10">
              <UploadCloud className="w-14 h-14 text-primary mb-4" />
              <p className="font-figtree font-black text-3xl md:text-5xl tracking-tight text-on-surface mb-4">
                Drop your PPT/PPTX here
              </p>
              <p className="font-inter text-on-surface-variant max-w-xl text-base md:text-lg">
                Drag and drop a deck or click this canvas to open your file picker. Slides render immediately after selection.
              </p>
            </div>
          )}
<div
  ref={containerRef}
  className={`relative z-10 h-full w-full flex items-center justify-center overflow-hidden bg-white ${
    isFileUploaded ? "flex" : "hidden"
  }`}
>
  <div
    style={{
      width: `${SLIDE_WIDTH}px`,
      height: `${SLIDE_HEIGHT}px`,
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      position: "absolute", // CRITICAL: This pulls the giant element out of flex layout preventing container blowouts
      top: "50%",
      left: "50%",
      marginLeft: `-${SLIDE_WIDTH / 2}px`, // Center horizontally based on unscaled width
      marginTop: `-${SLIDE_HEIGHT / 2}px`, // Center vertically based on unscaled height
    }}
  >
    <div ref={renderRef} className="w-full h-full" />
  </div>
</div>

          <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-full bg-background/80 border border-outline-variant/20 text-xs font-semibold tracking-wide text-on-surface-variant z-20">
            {isIngesting
              ? "Ingesting..."
              : ingestionStatus === "success"
                ? "Ready"
                : "Drop or click to upload"}
          </div>
        </motion.div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2 min-h-10">

        {(localError || ingestionError) && (
          <span className="font-inter text-red-400 text-xs font-semibold tracking-wide">
            {localError || ingestionError}
          </span>
        )}
      </div>
    </main>
  );
}
