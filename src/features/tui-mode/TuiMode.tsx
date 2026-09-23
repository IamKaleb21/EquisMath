import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  VideoOff,
  Settings,
  Info,
  RotateCcw,
} from "lucide-react";
import { useWebcam } from "./hooks/useWebcam";
import { ArucoDetector, type DetectedMarker, type Point2D } from "./lib/arucoDetector";
import { EquationBar } from "@/features/block-system/EquationBar";
import { EquationGraph } from "@/features/visualization/EquationGraph";
import { ValueTable } from "@/features/visualization/ValueTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { EquationState, SolutionStep } from "@/shared/types";

// Expected ArUco IDs for the demo
const ID_3X = 1;      // Marker for 3x
const ID_MINUS_4 = 3;  // Marker for -4
const ID_PLUS_4 = 4;   // Marker for +4 (flipped version of -4)
const ID_8 = 5;       // Marker for 8

type DemoState =
  | "STATE_1_SETUP"       // Initial setup: 3x - 4 = 8
  | "STATE_2_TRANSPOSE"   // Transposition: 3x = 8 + 4
  | "STATE_3_RESOLVE"     // Digital fusion prompt: "operate" by removing blocks
  | "STATE_4_DESPEJE"     // Division: 3x in denominator -> x = 12 / 3
  | "STATE_5_VICTORY";    // Solved: x = 4

// Standard equations for each state
const EQ_STATE_1: EquationState = {
  leftSide: [
    { id: "tui-c-3", type: "CONSTANT", value: 3, sign: 1 },
    { id: "tui-v-x", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
    { id: "tui-c-4", type: "CONSTANT", value: 4, sign: -1 },
  ],
  rightSide: [{ id: "tui-c-8", type: "CONSTANT", value: 8, sign: 1 }],
  solution: 4,
};

const EQ_STATE_2: EquationState = {
  leftSide: [
    { id: "tui-c-3", type: "CONSTANT", value: 3, sign: 1 },
    { id: "tui-v-x", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
  ],
  rightSide: [
    { id: "tui-c-8", type: "CONSTANT", value: 8, sign: 1 },
    { id: "tui-c-4-flipped", type: "CONSTANT", value: 4, sign: 1 },
  ],
  solution: 4,
};

const EQ_STATE_3: EquationState = {
  leftSide: [
    { id: "tui-c-3", type: "CONSTANT", value: 3, sign: 1 },
    { id: "tui-v-x", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
  ],
  rightSide: [{ id: "tui-c-12", type: "CONSTANT", value: 12, sign: 1 }],
  solution: 4,
};

const EQ_STATE_4: EquationState = {
  leftSide: [{ id: "tui-v-x", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 }],
  rightSide: [
    { id: "tui-c-12", type: "CONSTANT", value: 12, sign: 1 },
    { id: "tui-c-3-div", type: "CONSTANT", value: 3, sign: 1 }, // conceptually divisor, represented as constant
  ],
  solution: 4,
};

const EQ_STATE_5: EquationState = {
  leftSide: [{ id: "tui-v-x", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 }],
  rightSide: [{ id: "tui-c-4", type: "CONSTANT", value: 4, sign: 1 }],
  solution: 4,
};

// Map each state to its equation
const STATE_EQUATIONS: Record<DemoState, EquationState> = {
  STATE_1_SETUP: EQ_STATE_1,
  STATE_2_TRANSPOSE: EQ_STATE_2,
  STATE_3_RESOLVE: EQ_STATE_3,
  STATE_4_DESPEJE: EQ_STATE_4,
  STATE_5_VICTORY: EQ_STATE_5,
};

export function TuiMode() {
  const { videoRef, stream, error: webcamError, isLoading, startWebcam, stopWebcam } = useWebcam();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectorRef = useRef<ArucoDetector | null>(null);

  // Calibration lines (normalized coordinates 0 to 1)
  const [calibX, setCalibX] = useState(0.5); // Equality axis (Vertical)
  const [calibY, setCalibY] = useState(0.75); // Denominator threshold (Horizontal)
  const [isMirrored, setIsMirrored] = useState(true); // Toggle camera mirroring

  // Demo flow states
  const [demoState, setDemoState] = useState<DemoState>("STATE_1_SETUP");
  const [detectedIds, setDetectedIds] = useState<number[]>([]);
  const [historySteps, setHistorySteps] = useState<SolutionStep[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Debouncing for optical state transitions
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debounceProgress, setDebounceProgress] = useState(0); // 0 to 100%
  const pendingStateRef = useRef<DemoState | null>(null);

  // Canvas interaction
  const draggingLineRef = useRef<"vertical" | "horizontal" | null>(null);

  // Highlight points for graph
  const [highlightedX, setHighlightedX] = useState<number | null>(null);

  // Temporal smoothing cache to prevent flickering dropouts
  const lastSeenMarkersRef = useRef<Record<number, { center: Point2D; timestamp: number }>>({});

  useEffect(() => {
    detectorRef.current = new ArucoDetector("ARUCO");
    startWebcam();

    return () => {
      stopWebcam();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    if (!stream) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Check video dimension readiness
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Sync canvas dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      // Draw video stream (mirrored optionally) with contrast/brightness filters to stabilize detection
      ctx.save();
      if (isMirrored) {
        ctx.translate(cw, 0);
        ctx.scale(-1, 1);
      }
      ctx.filter = "contrast(1.45) brightness(1.08)";
      ctx.drawImage(video, 0, 0, cw, ch);
      ctx.filter = "none";
      ctx.restore();

      // Retrieve image data and detect markers
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const markers = detectorRef.current ? detectorRef.current.detect(imageData) : [];

      // Update temporal smoothing cache
      const now = Date.now();
      markers.forEach((m) => {
        lastSeenMarkersRef.current[m.id] = {
          center: m.center,
          timestamp: now,
        };
      });

      // Extract detected IDs (filter out markers that haven't been seen in the last 600ms)
      const activeIds = Object.keys(lastSeenMarkersRef.current)
        .map(Number)
        .filter((id) => now - lastSeenMarkersRef.current[id].timestamp < 600);
      setDetectedIds(activeIds);

      // Render debugging outlines for markers
      markers.forEach((marker) => {
        ctx.strokeStyle = "#10b981"; // Emerald-500
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(marker.corners[0].x, marker.corners[0].y);
        ctx.lineTo(marker.corners[1].x, marker.corners[1].y);
        ctx.lineTo(marker.corners[2].x, marker.corners[2].y);
        ctx.lineTo(marker.corners[3].x, marker.corners[3].y);
        ctx.closePath();
        ctx.stroke();

        // Label marker name based on mapped IDs
        let label = `ID: ${marker.id}`;
        if (marker.id === ID_3X) label = "3x (ID 1)";
        else if (marker.id === ID_MINUS_4) label = "-4 (ID 3)";
        else if (marker.id === ID_PLUS_4) label = "+4 (ID 4)";
        else if (marker.id === ID_8) label = "8 (ID 5)";

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px monospace";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(label, marker.center.x - 20, marker.center.y);
        ctx.shadowBlur = 0;
      });

      // Draw calibration overlays
      const cx = calibX * cw;
      const cy = calibY * ch;

      const lx = cx / 2;
      const ly = cy / 2;
      const rx = cx + (cw - cx) / 2;
      const ry = cy / 2;

      // Helper to draw a dashed ghost/placeholder block on the canvas
      const drawGhostBlock = (x: number, y: number, label: string, sublabel: string) => {
        ctx.strokeStyle = "rgba(161, 161, 170, 0.35)"; // Zinc-400 with opacity
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.roundRect(x - 40, y - 30, 80, 60, 8);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(161, 161, 170, 0.5)";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, x, y + 2);

        ctx.fillStyle = "rgba(161, 161, 170, 0.35)";
        ctx.font = "8px monospace";
        ctx.fillText(sublabel, x, y + 14);
        ctx.textAlign = "left";
      };

      // use already declared 'now' variable
      
      const checkActive = (id: number) => {
        const marker = lastSeenMarkersRef.current[id];
        return marker && (now - marker.timestamp < 600);
      };

      const m3x = lastSeenMarkersRef.current[ID_3X];
      const active3x = checkActive(ID_3X);
      const activeMinus4 = checkActive(ID_MINUS_4);
      const activePlus4 = checkActive(ID_PLUS_4);
      const active8 = checkActive(ID_8);

      // A. STATE_1_SETUP: Draw ghost placeholders for initial blocks
      if (demoState === "STATE_1_SETUP") {
        if (!active3x) drawGhostBlock(lx - 55, ly, "3x", "ID 1 (L)");
        if (!activeMinus4) drawGhostBlock(lx + 55, ly, "-4", "ID 3 (L)");
        if (!active8) drawGhostBlock(rx, ry, "8", "ID 5 (R)");
      }

      // B. STATE_2_TRANSPOSE: Draw ghost placeholders for transposed step
      if (demoState === "STATE_2_TRANSPOSE") {
        if (!active3x) drawGhostBlock(lx, ly, "3x", "ID 1 (L)");
        if (!active8) drawGhostBlock(rx - 55, ry, "8", "ID 5 (R)");
        if (!activePlus4) drawGhostBlock(rx + 55, ry, "+4", "ID 4 (R)");
      }

      // C. STATE_3_RESOLVE: Draw connecting lines and sum bubble for constants fusion
      if (demoState === "STATE_3_RESOLVE") {
        const mPlus4 = lastSeenMarkersRef.current[ID_PLUS_4];
        const m8 = lastSeenMarkersRef.current[ID_8];

        if (activePlus4 && active8 && mPlus4 && m8) {
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(mPlus4.center.x, mPlus4.center.y);
          ctx.lineTo(m8.center.x, m8.center.y);
          ctx.stroke();
          ctx.setLineDash([]);

          const midX = (mPlus4.center.x + m8.center.x) / 2;
          const midY = (mPlus4.center.y + m8.center.y) / 2;

          ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(midX - 55, midY - 18, 110, 36, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#10b981";
          ctx.font = "bold 13px monospace";
          ctx.textAlign = "center";
          ctx.fillText("8 + 4 = 12", midX, midY + 2);
          ctx.fillStyle = "#a1a1aa";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText("FUSIÓN DIGITAL", midX, midY + 12);
          ctx.textAlign = "left";
        }
      }

      // D. STATE_4_DESPEJE (or STATE_3_RESOLVE once constants are physically removed):
      // Draw virtual constant block showing 12 on the right side.
      if (demoState === "STATE_4_DESPEJE" || demoState === "STATE_3_RESOLVE") {
        if (demoState === "STATE_4_DESPEJE" || (demoState === "STATE_3_RESOLVE" && !activePlus4 && !active8)) {
          const vry = ry - 20;

          ctx.shadowColor = "rgba(16, 185, 129, 0.4)";
          ctx.shadowBlur = 12;

          ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(rx - 45, vry - 35, 90, 70, 10);
          ctx.fill();
          ctx.stroke();

          ctx.shadowBlur = 0;

          ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(rx - 38, vry - 28, 76, 56, 6);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 26px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("12", rx, vry + 2);

          ctx.fillStyle = "#10b981";
          ctx.font = "bold 10px monospace";
          ctx.fillText("CONSTANTE", rx, vry + 18);
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.font = "8px sans-serif";
          ctx.fillText("[ VIRTUAL ]", rx, vry + 28);
          ctx.textAlign = "left";

          if (demoState === "STATE_4_DESPEJE") {
            const dy = cy + (ch - cy) / 2;
            
            if (!active3x) {
              drawGhostBlock(rx, dy, "3x", "ID 1 (Mover aquí)");
            } else if (m3x) {
              const is3xRightDenom = m3x.center.x >= cx && m3x.center.y >= cy;
              if (is3xRightDenom) {
                const lineY = (vry + 35 + m3x.center.y - 30) / 2;
                ctx.strokeStyle = "#a855f7"; 
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(rx - 60, lineY);
                ctx.lineTo(rx + 60, lineY);
                ctx.stroke();

                ctx.fillStyle = "rgba(9, 9, 11, 0.9)";
                ctx.strokeStyle = "#a855f7";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(rx + 80, lineY - 18, 90, 36, 8);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#a855f7";
                ctx.font = "bold 12px monospace";
                ctx.textAlign = "center";
                ctx.fillText("12 / 3 = 4", rx + 125, lineY + 2);
                ctx.fillStyle = "#a1a1aa";
                ctx.font = "bold 8px sans-serif";
                ctx.fillText("DIVISIÓN TUI", rx + 125, lineY + 12);
                ctx.textAlign = "left";
              }
            }
          }
        }
      }

      // E. STATE_5_VICTORY: Draw virtual solved equation blocks
      if (demoState === "STATE_5_VICTORY") {
        const vly = ly;
        const vry = ry;

        // Draw virtual Variable "x"
        ctx.shadowColor = "rgba(59, 130, 246, 0.4)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(lx - 40, vly - 30, 80, 60, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("x", lx, vly + 4);
        ctx.fillStyle = "#3b82f6";
        ctx.font = "bold 9px monospace";
        ctx.fillText("VARIABLE", lx, vly + 18);

        // Draw virtual Solution "4"
        ctx.shadowColor = "rgba(16, 185, 129, 0.4)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(rx - 40, vry - 30, 80, 60, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("4", rx, vry + 4);
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 9px monospace";
        ctx.fillText("SOLUCIÓN", rx, vry + 18);

        // Draw equals sign
        ctx.fillStyle = "rgba(9, 9, 11, 0.9)";
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - 20, ly - 20, 40, 40, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f97316";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("=", cx, ly + 9);
        ctx.textAlign = "left";
      }

      // Equal axis line (Vertical)
      ctx.strokeStyle = draggingLineRef.current === "vertical" ? "#f97316" : "#e4e4e7"; // Orange / Zinc-200
      ctx.lineWidth = draggingLineRef.current === "vertical" ? 3 : 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, cy); // stops at the denominator zone
      ctx.stroke();

      // Equal axis tag
      ctx.fillStyle = draggingLineRef.current === "vertical" ? "#f97316" : "#3f3f46";
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.roundRect(cx - 40, 10, 80, 24, 6);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Igualdad (=)", cx, 26);

      // Denominator divider line (Horizontal)
      ctx.strokeStyle = draggingLineRef.current === "horizontal" ? "#a855f7" : "#e4e4e7"; // Purple / Zinc-200
      ctx.lineWidth = draggingLineRef.current === "horizontal" ? 3 : 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(cw, cy);
      ctx.stroke();

      // Denominator zone tag
      ctx.fillStyle = draggingLineRef.current === "horizontal" ? "#a855f7" : "#3f3f46";
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.roundRect(cw - 130, cy - 28, 120, 24, 6);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Denominadores", cw - 70, cy - 12);

      // Reset text alignment for other drawings
      ctx.textAlign = "left";

      // If not using simulation, run state machine checks using optical detection
      if (!isSimulating) {
        evaluateOpticalTransitions(markers, cw, ch);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream, calibX, calibY, demoState, isSimulating, isMirrored]);

  // Evaluate physical markers positions and trigger transitions
  const evaluateOpticalTransitions = (_markers: DetectedMarker[], width: number, height: number) => {
    const now = Date.now();

    // Helper to get smoothed marker presence and center position
    const getSmoothMarker = (id: number) => {
      const record = lastSeenMarkersRef.current[id];
      if (record && now - record.timestamp < 600) { // 600ms persistence window
        return record;
      }
      return null;
    };

    let nextState: DemoState | null = null;

    // Check condition based on current demo state
    if (demoState === "STATE_1_SETUP") {
      const m3x = getSmoothMarker(ID_3X);
      const mMinus4 = getSmoothMarker(ID_MINUS_4);
      const m8 = getSmoothMarker(ID_8);

      if (m3x && mMinus4 && m8) {
        const is3xLeft = m3x.center.x < calibX * width && m3x.center.y < calibY * height;
        const isMinus4Left = mMinus4.center.x < calibX * width && mMinus4.center.y < calibY * height;
        const is8Right = m8.center.x >= calibX * width && m8.center.y < calibY * height;

        if (is3xLeft && isMinus4Left && is8Right) {
          nextState = "STATE_2_TRANSPOSE";
        }
      }
    } else if (demoState === "STATE_2_TRANSPOSE") {
      const m3x = getSmoothMarker(ID_3X);
      const mPlus4 = getSmoothMarker(ID_PLUS_4);
      const m8 = getSmoothMarker(ID_8);

      if (m3x && mPlus4 && m8) {
        const is3xLeft = m3x.center.x < calibX * width && m3x.center.y < calibY * height;
        const is8Right = m8.center.x >= calibX * width && m8.center.y < calibY * height;
        const isPlus4Right = mPlus4.center.x >= calibX * width && mPlus4.center.y < calibY * height;

        if (is3xLeft && is8Right && isPlus4Right) {
          nextState = "STATE_3_RESOLVE";
        }
      }
    } else if (demoState === "STATE_3_RESOLVE") {
      const m3x = getSmoothMarker(ID_3X);
      const mPlus4 = getSmoothMarker(ID_PLUS_4);
      const m8 = getSmoothMarker(ID_8);

      // Transition to state 4 (simplify to 12) once constants are removed from the mat
      if (m3x && !mPlus4 && !m8) {
        const is3xLeft = m3x.center.x < calibX * width && m3x.center.y < calibY * height;
        if (is3xLeft) {
          nextState = "STATE_4_DESPEJE";
        }
      }
    } else if (demoState === "STATE_4_DESPEJE") {
      const m3x = getSmoothMarker(ID_3X);

      if (m3x) {
        // Despeje complete when 3x slides below calibration Y on the right side
        const is3xRightDenom = m3x.center.x >= calibX * width && m3x.center.y >= calibY * height;
        if (is3xRightDenom) {
          nextState = "STATE_5_VICTORY";
        }
      }
    }

    // Handle debouncing
    if (nextState) {
      if (pendingStateRef.current !== nextState) {
        pendingStateRef.current = nextState;
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

        const startTime = Date.now();
        const duration = 1500; // 1.5s debounce

        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / duration) * 100, 100);
          setDebounceProgress(progress);
          if (progress >= 100) clearInterval(progressInterval);
        }, 50);

        transitionTimerRef.current = setTimeout(() => {
          clearInterval(progressInterval);
          setDebounceProgress(0);
          applyStateTransition(nextState!);
          pendingStateRef.current = null;
        }, duration);
      }
    } else {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      pendingStateRef.current = null;
      setDebounceProgress(0);
    }
  };

  const getMarkerZone = (x: number, y: number, w: number, h: number) => {
    const isLeft = x < calibX * w;
    const isBelow = y >= calibY * h;
    if (isBelow) {
      return isLeft ? "DENOMINADOR_IZQ" : "DENOMINADOR_DER";
    }
    return isLeft ? "IZQUIERDA" : "DERECHA";
  };

  const getDiagnostics = () => {
    const now = Date.now();
    const w = videoRef.current?.videoWidth || 640;
    const h = videoRef.current?.videoHeight || 480;

    const check = (id: number) => {
      const marker = lastSeenMarkersRef.current[id];
      if (!marker || now - marker.timestamp > 600) {
        return { detected: false, zone: null };
      }
      return { detected: true, zone: getMarkerZone(marker.center.x, marker.center.y, w, h) };
    };

    if (demoState === "STATE_1_SETUP") {
      return [
        { label: "Bloque 3x (ID 1)", expected: "IZQUIERDA", ...check(ID_3X) },
        { label: "Bloque -4 (ID 3)", expected: "IZQUIERDA", ...check(ID_MINUS_4) },
        { label: "Bloque 8 (ID 5)", expected: "DERECHA", ...check(ID_8) },
      ];
    }
    if (demoState === "STATE_2_TRANSPOSE") {
      return [
        { label: "Bloque 3x (ID 1)", expected: "IZQUIERDA", ...check(ID_3X) },
        { label: "Bloque +4 (ID 4)", expected: "DERECHA", ...check(ID_PLUS_4) },
        { label: "Bloque 8 (ID 5)", expected: "DERECHA", ...check(ID_8) },
      ];
    }
    if (demoState === "STATE_3_RESOLVE") {
      const m3x = check(ID_3X);
      const mPlus4 = check(ID_PLUS_4);
      const m8 = check(ID_8);
      return [
        { label: "Bloque 3x (ID 1)", expected: "IZQUIERDA", ...m3x },
        { label: "Bloque +4 (ID 4) - ¡Remover!", expected: "REMOVED", detected: mPlus4.detected, zone: mPlus4.zone },
        { label: "Bloque 8 (ID 5) - ¡Remover!", expected: "REMOVED", detected: m8.detected, zone: m8.zone },
      ];
    }
    if (demoState === "STATE_4_DESPEJE") {
      return [
        { label: "Bloque 3x (ID 1)", expected: "DENOMINADOR_DER", ...check(ID_3X) },
      ];
    }
    return [];
  };

  // Perform state transition and record step history
  const applyStateTransition = (target: DemoState) => {
    setDemoState(target);

    // Update history steps
    if (target === "STATE_2_TRANSPOSE") {
      setHistorySteps([
        {
          stepNumber: 1,
          description: "Pasar -4 sumando al otro lado",
          equationAfter: STATE_EQUATIONS.STATE_2_TRANSPOSE,
        },
      ]);
    } else if (target === "STATE_4_DESPEJE") {
      setHistorySteps([
        {
          stepNumber: 1,
          description: "Pasar -4 sumando al otro lado",
          equationAfter: STATE_EQUATIONS.STATE_2_TRANSPOSE,
        },
        {
          stepNumber: 2,
          description: "Operar términos constantes (8 + 4 = 12)",
          equationAfter: STATE_EQUATIONS.STATE_3_RESOLVE,
        },
      ]);
    } else if (target === "STATE_5_VICTORY") {
      setHistorySteps([
        {
          stepNumber: 1,
          description: "Pasar -4 sumando al otro lado",
          equationAfter: STATE_EQUATIONS.STATE_2_TRANSPOSE,
        },
        {
          stepNumber: 2,
          description: "Operar términos constantes (8 + 4 = 12)",
          equationAfter: STATE_EQUATIONS.STATE_3_RESOLVE,
        },
        {
          stepNumber: 3,
          description: "Pasar 3 dividiendo al otro lado (12 / 3 = 4)",
          equationAfter: STATE_EQUATIONS.STATE_5_VICTORY,
        },
      ]);
      // Trigger confetti explosion!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleSimulateState = (target: DemoState) => {
    setIsSimulating(true);
    applyStateTransition(target);
  };

  const handleResetDemo = () => {
    setDemoState("STATE_1_SETUP");
    setHistorySteps([]);
    setDebounceProgress(0);
    setIsSimulating(false);
    pendingStateRef.current = null;
  };

  // Mouse drag handlers for calibrator lines
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cw = canvas.width;
    const ch = canvas.height;

    // Convert mouse coordinates relative to canvas dimensions
    const mouseX = (x / rect.width) * cw;
    const mouseY = (y / rect.height) * ch;

    const currentLineX = calibX * cw;
    const currentLineY = calibY * ch;

    // Detect click threshold (within 15 pixels)
    if (Math.abs(mouseX - currentLineX) < 15) {
      draggingLineRef.current = "vertical";
    } else if (Math.abs(mouseY - currentLineY) < 15) {
      draggingLineRef.current = "horizontal";
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingLineRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingLineRef.current === "vertical") {
      const val = Math.max(0.1, Math.min(0.9, x / rect.width));
      setCalibX(val);
    } else if (draggingLineRef.current === "horizontal") {
      const val = Math.max(0.1, Math.min(0.9, y / rect.height));
      setCalibY(val);
    }
  };

  const handleCanvasMouseUp = () => {
    draggingLineRef.current = null;
  };

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-2 md:grid-cols-12 md:p-4">
      {/* Columna Izquierda: Cámara y calibración */}
      <div className="flex flex-col gap-3 md:col-span-6 lg:col-span-7">
        <Card className="flex flex-1 flex-col overflow-hidden border-border/50 bg-zinc-950/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg text-emerald-400">
              <Camera className="size-5" />
              Feed Óptico TUI
            </CardTitle>
            <div className="flex items-center gap-3">
              {stream && (
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground font-medium select-none">
                  <input
                    type="checkbox"
                    checked={isMirrored}
                    onChange={(e) => setIsMirrored(e.target.checked)}
                    className="accent-emerald-500 rounded border-zinc-700 bg-zinc-800 size-3.5"
                  />
                  Invertir Espejo
                </label>
              )}
              {stream ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Cámara Activa
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
                  Sin Cámara
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="relative flex flex-1 flex-col items-center justify-center p-2 min-h-[300px]">
            {/* Hidden video element for webcam streaming */}
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
            />

            {/* Display Canvas with webcam drawings */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-black">
              {stream ? (
                <canvas
                  ref={canvasRef}
                  className="h-full w-full cursor-crosshair object-contain"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <VideoOff className="size-12 text-zinc-600 animate-pulse" />
                  <div>
                    <h3 className="font-medium text-foreground">
                      {isLoading ? "Cargando cámara..." : "Acceso a cámara requerido"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                      {webcamError || "Esta demo interactúa con bloques físicos. Conecta el clip reflector óptico a tu webcam y concede permisos."}
                    </p>
                  </div>
                  <Button
                    onClick={startWebcam}
                    disabled={isLoading}
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {isLoading ? "Cargando..." : "Permitir Cámara"}
                  </Button>
                </div>
              )}

              {/* Progress bar overlay during state transitions */}
              {debounceProgress > 0 && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 backdrop-blur-sm">
                  <div className="flex justify-between text-xs text-emerald-400 font-mono mb-1.5">
                    <span>Estabilizando movimiento físico...</span>
                    <span>{Math.round(debounceProgress)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${debounceProgress}%` }}
                      transition={{ ease: "linear" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Calibrator Instructions */}
            {stream && (
              <div className="mt-2.5 flex w-full items-start gap-2 rounded-lg bg-zinc-900/60 p-2 text-xs text-muted-foreground border border-zinc-800">
                <Info className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold text-zinc-300">Calibración rápida:</span> Arrastrá las líneas de color en la cámara para alinearlas con tu cartulina. La vertical punteada debe seguir el <span className="text-zinc-200 font-medium">Eje del Igualdad</span> y la horizontal define la zona inferior de <span className="text-zinc-200 font-medium">Denominadores</span>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de control de demo / Simulación */}
        <Card className="border-border/50 bg-zinc-900/40">
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-zinc-300">Depuración y Simulación:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleSimulateState("STATE_1_SETUP")}
                  className={cn(
                    "font-mono text-xs",
                    demoState === "STATE_1_SETUP" && isSimulating && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  )}
                >
                  [1] Setup
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleSimulateState("STATE_2_TRANSPOSE")}
                  className={cn(
                    "font-mono text-xs",
                    demoState === "STATE_2_TRANSPOSE" && isSimulating && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  )}
                >
                  [2] Transposición
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleSimulateState("STATE_3_RESOLVE")}
                  className={cn(
                    "font-mono text-xs",
                    demoState === "STATE_3_RESOLVE" && isSimulating && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  )}
                >
                  [3] Fusión
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleSimulateState("STATE_4_DESPEJE")}
                  className={cn(
                    "font-mono text-xs",
                    demoState === "STATE_4_DESPEJE" && isSimulating && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  )}
                >
                  [4] Despeje
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleResetDemo}
                  className="font-mono text-xs border-dashed text-zinc-400"
                >
                  <RotateCcw className="size-3 mr-1" />
                  Reiniciar
                </Button>
              </div>
            </div>

            {/* List of currently detected Marker IDs */}
            {stream && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>IDs detectados en vivo:</span>
                <div className="flex gap-1.5">
                  {[ID_3X, ID_MINUS_4, ID_PLUS_4, ID_8].map((id) => {
                    const isDetected = detectedIds.includes(id);
                    return (
                      <span
                        key={id}
                        className={cn(
                          "px-1.5 py-0.5 rounded border",
                          isDetected
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold"
                            : "bg-zinc-800/40 text-zinc-600 border-transparent"
                        )}
                      >
                        ID {id} ({id === 1 ? "3x" : id === 3 ? "-4" : id === 4 ? "+4" : "8"})
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Estado de ecuación, pasos, gráficos y tablas */}
      <div className="flex flex-col gap-3 md:col-span-6 lg:col-span-5 overflow-y-auto pr-1">
        {/* Estado actual de la Ecuación en bloques virtuales */}
        <Card className="border-border/50 bg-zinc-950/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Ecuación Virtual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <EquationBar
              equation={STATE_EQUATIONS[demoState]}
              readOnly
            />
          </CardContent>
        </Card>

        {/* Guía didáctica / Instrucciones interactivas */}
        <Card className="border-border/40 bg-zinc-900/60 shadow-md">
          <CardContent className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={demoState}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                    {demoState === "STATE_1_SETUP" && "1"}
                    {demoState === "STATE_2_TRANSPOSE" && "2"}
                    {demoState === "STATE_3_RESOLVE" && "3"}
                    {demoState === "STATE_4_DESPEJE" && "4"}
                    {demoState === "STATE_5_VICTORY" && "✓"}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">
                      {demoState === "STATE_1_SETUP" && "Paso 1: Planteamiento de Ecuación"}
                      {demoState === "STATE_2_TRANSPOSE" && "Paso 2: Transponer Término"}
                      {demoState === "STATE_3_RESOLVE" && "Paso 3: Fusión Digital (Operar)"}
                      {demoState === "STATE_4_DESPEJE" && "Paso 4: Despeje Final"}
                      {demoState === "STATE_5_VICTORY" && "¡Ecuación Resuelta!"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {demoState === "STATE_1_SETUP" && (
                        "Colocá el bloque [3x] (ID 1) y el bloque [-4] (ID 3) en el lado izquierdo del tapete. Y el bloque [8] (ID 5) en el lado derecho."
                      )}
                      {demoState === "STATE_2_TRANSPOSE" && (
                        "¡Muy bien! Ahora cruzá el bloque [-4] al lado derecho del igual. Recordá voltear el bloque físicamente para cambiar el signo mostrando [+4] (ID 4)."
                      )}
                      {demoState === "STATE_3_RESOLVE" && (
                        "Los términos constantes ya cruzaron. Para operarlos de manera digital, retirá los bloques [8] y [+4] de la mesa."
                      )}
                      {demoState === "STATE_4_DESPEJE" && (
                        "Los términos se simplificaron a 12. Ahora, despejá la x deslizando el bloque [3x] a la zona inferior de Denominadores del lado derecho."
                      )}
                      {demoState === "STATE_5_VICTORY" && (
                        "¡Excelente! El software calculó la división 12 / 3 y despejó la variable. Ecuación completada con éxito."
                      )}
                    </p>

                    {/* Diagnóstico de bloques interactivo */}
                    {demoState !== "STATE_5_VICTORY" && !isSimulating && (
                      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 font-mono text-[11px] text-zinc-300 shadow-inner">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Alineación Física</span>
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Cámara activa</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {getDiagnostics().map((item, idx) => {
                            const isCorrect = item.expected === "REMOVED" 
                              ? !item.detected 
                              : item.detected && item.zone === item.expected;
                            
                            return (
                              <div key={idx} className="flex items-center justify-between gap-4">
                                <span className={cn(
                                  "font-medium",
                                  isCorrect ? "text-zinc-300" : "text-zinc-500"
                                )}>
                                  {item.label}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                                  {isCorrect ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                      Listo
                                    </span>
                                  ) : item.expected === "REMOVED" ? (
                                    <span className="text-amber-400 font-semibold">⚠️ Detectado (Remover)</span>
                                  ) : !item.detected ? (
                                    <span className="text-red-400">❌ No detectado</span>
                                  ) : (
                                    <span className="text-amber-400">
                                      ⚠️ Mover a {item.expected === "DENOMINADOR_DER" ? "Denominador" : item.expected.toLowerCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Pasos de solución */}
        <Card className="border-border/50 bg-zinc-950/60 backdrop-blur-sm flex-1 min-h-[160px] flex flex-col">
          <CardHeader className="pb-1 py-3">
            <CardTitle className="font-display text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Pasos de Solución
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-4 pb-4 pt-1">
            {historySteps.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <Info className="size-5 mb-1.5 text-zinc-600" />
                <p className="text-xs">Los pasos aparecerán a medida que interactúes.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1.5">
                {historySteps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="flex flex-col gap-1 rounded-lg border border-border/50 bg-zinc-900/30 p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-4.5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                        {step.stepNumber}
                      </span>
                      <span className="text-xs font-semibold text-zinc-300">
                        {step.description}
                      </span>
                    </div>
                    <div className="pl-6 pt-1">
                      <EquationBar equation={step.equationAfter} readOnly />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visualización matemática (Gráfico Mafs y tabla) */}
        <Card className="border-border/50 bg-zinc-950/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-1 py-3 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Representación Matemática
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="h-[220px]">
                <EquationGraph
                  equation={STATE_EQUATIONS[demoState]}
                  highlightedPoint={highlightedX !== null ? { x: highlightedX } : null}
                />
              </div>
              <div className="h-[220px] overflow-y-auto">
                <ValueTable
                  equation={STATE_EQUATIONS[demoState]}
                  highlightedX={highlightedX}
                  onHighlight={setHighlightedX}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
