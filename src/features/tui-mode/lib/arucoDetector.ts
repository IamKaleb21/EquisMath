import { AR } from "js-aruco2";

export interface Point2D {
  x: number;
  y: number;
}

export interface DetectedMarker {
  id: number;
  corners: Point2D[];
  center: Point2D;
}

export class ArucoDetector {
  private detector: any;

  constructor(dictionaryName: "ARUCO" | "ARUCO_MIP_36h12" = "ARUCO") {
    // We use the ARUCO dictionary by default because it is the most standard
    // and widely supported by online marker generators.
    this.detector = new AR.Detector({
      dictionaryName,
    });
  }

  /**
   * Detects ArUco markers in the provided ImageData.
   * Returns an array of detected markers with normalized corner coordinates.
   */
  public detect(imageData: ImageData): DetectedMarker[] {
    try {
      const markers = this.detector.detect(imageData);
      if (!markers || !Array.isArray(markers)) return [];

      return markers.map((m: any) => {
        const corners: Point2D[] = m.corners.map((c: any) => ({
          x: c.x,
          y: c.y,
        }));

        // Calculate center as the centroid of the four corners
        const center: Point2D = {
          x: (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
          y: (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4,
        };

        return {
          id: m.id,
          corners,
          center,
        };
      });
    } catch (err) {
      console.error("Error in ArUco detection:", err);
      return [];
    }
  }
}
