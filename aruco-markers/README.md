# Marcadores ArUco para EquisMath TUI

En esta carpeta se encuentran los archivos SVG de los marcadores ArUco generados matemáticamente y una **plantilla unificada lista para imprimir en A4**.

## Hoja de Impresión Consolidada (A4):
Para imprimir todo de una sola vez de forma simple, abrí el siguiente archivo en tu navegador web:
👉 **[hoja_impresion_A4.html](file:///home/imkaleb21/dev/EquisMath/aruco-markers/hoja_impresion_A4.html)**
*Presioná `Ctrl + P`, configurá el papel en **A4**, escala al **100% (tamaño real)** y guardalo como PDF o imprimilo.*

---

## Detalle de Marcadores Generados:

### 1. Bloques de la Ecuación
- **[3x_id1.svg](file:///home/imkaleb21/dev/EquisMath/aruco-markers/3x_id1.svg)** (ID ArUco: 1)
  - **Función:** Representa el término algebraico `3x`.
  - **Ubicación:** Pegalo en la cara frontal de tu bloque de variable.
- **[minus4_id3.svg](file:///home/imkaleb21/dev/EquisMath/aruco-markers/minus4_id3.svg)** (ID ArUco: 3)
  - **Función:** Representa el término constante `-4` (negativo).
  - **Ubicación:** Pegalo en la **Cara A** de tu bloque de constante móvil.
- **[plus4_id4.svg](file:///home/imkaleb21/dev/EquisMath/aruco-markers/plus4_id4.svg)** (ID ArUco: 4)
  - **Función:** Representa el término constante `+4` (positivo - inverso aditivo).
  - **Ubicación:** Pegalo en la **Cara B** (cara opuesta) de tu bloque de constante móvil.
- **[8_id5.svg](file:///home/imkaleb21/dev/EquisMath/aruco-markers/8_id5.svg)** (ID ArUco: 5)
  - **Función:** Representa el término constante `8`.
  - **Ubicación:** Pegalo en la cara frontal de tu bloque constante fijo de la derecha.

### 2. Esquinas de Calibración del Tapete (Autocalibración)
- **[corner_tl_id10.svg](file:///home/imkaleb21/dev/EquisMath/aruco-markers/corner_tl_id10.svg)** (ID ArUco: 10)
  - **Ubicación:** Pegalo en la **Esquina Superior Izquierda** de tu cartulina negra.
- **[corner_tr_id11.svg](file:///home/imkaleb21/dev/EquisMath/aruco-markers/corner_tr_id11.svg)** (ID ArUco: 11)
  - **Ubicación:** Pegalo en la **Esquina Superior Derecha** de tu cartulina negra.
- **[corner_bl_id12.svg](file:///home/imkaleb21/dev/EquisMath/aruco-markers/corner_bl_id12.svg)** (ID ArUco: 12)
  - **Ubicación:** Pegalo en la **Esquina Inferior Izquierda** de tu cartulina negra.
- **[corner_br_id13.svg](file:///home/imkaleb21/dev/EquisMath/aruco-markers/corner_br_id13.svg)** (ID ArUco: 13)
  - **Ubicación:** Pegalo en la **Esquina Inferior Derecha** de tu cartulina negra.

---

## Instrucciones para Construcción de la Demo:

1. **Los Bloques:**
   - Imprimí la hoja unificada en A4. Cada marcador medirá aprox. 4.5 x 4.5 cm.
   - Recortalos siguiendo las líneas de trazos de las tarjetas.
   - Para el bloque del cambio de signo, pegá el **ID 3** en una cara y el **ID 4** en la cara de atrás.
2. **El Tapete Calibrado:**
   - Colocá tu cartulina negra y pegá los 4 marcadores de esquinas (**IDs 10, 11, 12, 13**) exactamente en las esquinas físicas.
   - Dividí verticalmente a la mitad para marcar el **Eje de Igualdad** y delimitá la **Zona de Denominadores** en la base derecha.
3. **Calibración Óptica:**
   - Una vez que la cámara reconozca las esquinas, las líneas guía virtuales en pantalla se auto-alinearán, asegurando una detección perfecta del movimiento de los bloques sin preocuparte por el ángulo de la laptop.
