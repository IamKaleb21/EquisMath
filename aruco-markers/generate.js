import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'js-aruco2';
const { AR } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We use the standard "ARUCO" dictionary mapping
const dictionary = new AR.Dictionary("ARUCO");

const markers = [
  // Bloques de la ecuación
  { id: 1, name: "3x_id1.svg", description: "Término 3x (Bloque variable)", type: "equation" },
  { id: 3, name: "minus4_id3.svg", description: "Término -4 (Cara aditiva negativa)", type: "equation" },
  { id: 4, name: "plus4_id4.svg", description: "Término +4 (Cara aditiva positiva)", type: "equation" },
  { id: 5, name: "8_id5.svg", description: "Término 8 (Bloque constante)", type: "equation" },
  
  // Esquinas de calibración del tapete
  { id: 10, name: "corner_tl_id10.svg", description: "Calibración: Esquina Superior Izquierda", type: "calibration" },
  { id: 11, name: "corner_tr_id11.svg", description: "Calibración: Esquina Superior Derecha", type: "calibration" },
  { id: 12, name: "corner_bl_id12.svg", description: "Calibración: Esquina Inferior Izquierda", type: "calibration" },
  { id: 13, name: "corner_br_id13.svg", description: "Calibración: Esquina Inferior Derecha", type: "calibration" }
];

const outputDir = __dirname;
const svgContents = {};

// 1. Generate individual SVG files
markers.forEach(m => {
  try {
    const svg = dictionary.generateSVG(m.id);
    
    // Add styling for high contrast printing and easy cutting outline
    const styledSvg = svg.replace(
      '<svg ', 
      '<svg style="border: 2px solid #333; margin: 10px; border-radius: 4px;" '
    );
    
    const filePath = path.join(outputDir, m.name);
    fs.writeFileSync(filePath, styledSvg);
    svgContents[m.id] = svg; // Store raw SVG content for inline HTML use
    console.log(`[OK] Generado: ${m.name} (${m.description})`);
  } catch (err) {
    console.error(`[ERROR] No se pudo generar el marcador ID ${m.id}:`, err);
  }
});

// 2. Generate a single self-contained HTML print sheet formatted for A4
const htmlPath = path.join(outputDir, "hoja_impresion_A4.html");
const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>EquisMath TUI - Plantilla de Impresión A4</title>
  <style>
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .no-print {
        display: none !important;
      }
      .page {
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        page-break-after: always;
      }
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f4f4f5;
      color: #18181b;
      margin: 20px;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .no-print {
      max-width: 800px;
      width: 100%;
      background: #ffffff;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e4e4e7;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
    }

    .no-print h1 {
      margin-top: 0;
      color: #059669;
      font-size: 24px;
    }

    .btn-print {
      background: #059669;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }

    .btn-print:hover {
      background: #047857;
    }

    /* A4 representation */
    .page {
      width: 210mm;
      height: 297mm;
      background: #ffffff;
      box-sizing: border-box;
      padding: 15mm;
      border: 1px solid #e4e4e7;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header {
      border-bottom: 2px solid #e4e4e7;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .header h2 {
      margin: 0;
      font-size: 20px;
      color: #18181b;
    }

    .header p {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #71717a;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      flex-grow: 1;
    }

    .marker-card {
      border: 1px dashed #a1a1aa;
      border-radius: 8px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      background: #fafafa;
    }

    .marker-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      color: #27272a;
    }

    .marker-desc {
      font-size: 11px;
      color: #71717a;
      margin-top: 8px;
      max-width: 180px;
    }

    .marker-svg {
      width: 45mm;
      height: 45mm;
      border: 3px solid #000000;
      box-sizing: border-box;
    }

    .footer {
      border-top: 1px solid #e4e4e7;
      padding-top: 10px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #a1a1aa;
    }
  </style>
</head>
<body>

  <div class="no-print">
    <h1>Plantilla de Impresión de Marcadores (A4)</h1>
    <p>Esta página contiene todos los marcadores ArUco necesarios para la demo y autocalibración de <strong>EquisMath TUI</strong>. Se formateó automáticamente para ajustarse a una hoja A4 física.</p>
    <p><strong>Instrucciones para guardar o imprimir:</strong></p>
    <ul>
      <li>Haz clic en el botón <strong>Imprimir Plantilla</strong>.</li>
      <li>En la ventana de impresión, selecciona tu impresora o elige <strong>Guardar como PDF</strong>.</li>
      <li>Asegúrate de que el tamaño de papel esté configurado como <strong>A4</strong> y los márgenes en <strong>Ninguno</strong> o <strong>Predeterminado</strong>.</li>
      <li>Activa la opción de "Gráficos de fondo" si tu navegador no muestra los bordes.</li>
    </ul>
    <button class="btn-print" onclick="window.print()">
      🖨️ Imprimir Plantilla
    </button>
  </div>

  <div class="page">
    <div class="header">
      <h2>EquisMath TUI - Set Completo de Marcadores</h2>
      <p>Imprimir en escala 100% (tamaño real A4). Cada marcador mide aproximadamente 4.5 x 4.5 cm.</p>
    </div>

    <div class="grid">
      <!-- Fila 1: Bloque 3x y Bloque 8 -->
      <div class="marker-card">
        <div class="marker-title">Término 3x (ID 1)</div>
        <div class="marker-svg">
          ${svgContents[1] || ''}
        </div>
        <div class="marker-desc">Pegar en el bloque variable (Lado Izquierdo).</div>
      </div>

      <div class="marker-card">
        <div class="marker-title">Término constante 8 (ID 5)</div>
        <div class="marker-svg">
          ${svgContents[5] || ''}
        </div>
        <div class="marker-desc">Pegar en el bloque constante (Lado Derecho).</div>
      </div>

      <!-- Fila 2: Cara -4 y Cara +4 (Bloque del cambio de signo) -->
      <div class="marker-card">
        <div class="marker-title">Término constante -4 (ID 3)</div>
        <div class="marker-svg">
          ${svgContents[3] || ''}
        </div>
        <div class="marker-desc">Pegar en la <strong>Cara A</strong> del bloque móvil del 4.</div>
      </div>

      <div class="marker-card">
        <div class="marker-title">Término constante +4 (ID 4)</div>
        <div class="marker-svg">
          ${svgContents[4] || ''}
        </div>
        <div class="marker-desc">Pegar en la <strong>Cara B</strong> (opuesta) del mismo bloque del 4.</div>
      </div>

      <!-- Fila 3: Esquinas Calibración Superior (ID 10 y 11) -->
      <div class="marker-card">
        <div class="marker-title">Esquina Sup. Izquierda (ID 10)</div>
        <div class="marker-svg">
          ${svgContents[10] || ''}
        </div>
        <div class="marker-desc">Fijar en la esquina superior izquierda del tapete.</div>
      </div>

      <div class="marker-card">
        <div class="marker-title">Esquina Sup. Derecha (ID 11)</div>
        <div class="marker-svg">
          ${svgContents[11] || ''}
        </div>
        <div class="marker-desc">Fijar en la esquina superior derecha del tapete.</div>
      </div>

      <!-- Fila 4: Esquinas Calibración Inferior (ID 12 y 13) -->
      <div class="marker-card">
        <div class="marker-title">Esquina Inf. Izquierda (ID 12)</div>
        <div class="marker-svg">
          ${svgContents[12] || ''}
        </div>
        <div class="marker-desc">Fijar en la esquina inferior izquierda del tapete.</div>
      </div>

      <div class="marker-card">
        <div class="marker-title">Esquina Inf. Derecha (ID 13)</div>
        <div class="marker-svg">
          ${svgContents[13] || ''}
        </div>
        <div class="marker-desc">Fijar en la esquina inferior derecha del tapete.</div>
      </div>
    </div>

    <div class="footer">
      <span>EquisMath TUI - Prototipo de Modelo de Utilidad (MVP)</span>
      <span>Página 1 de 1</span>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(htmlPath, htmlContent);
console.log(`[OK] Hoja de impresión consolidada creada en: hoja_impresion_A4.html`);
