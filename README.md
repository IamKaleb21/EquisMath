# EquisMath

Aplicación web gamificada para aprender álgebra resolviendo ecuaciones lineales mediante bloques arrastrables.

## Características

- **Selector de rol**: Elige entre modo Estudiante (con niveles) o modo Profesor (sandbox)
- **Modo estudiante**: 
  - Selección de nivel de dificultad
  - Ecuaciones generadas automáticamente
  - Bloques arrastrables con drag-and-drop
  - Validación de movimientos y simplificación automática
  - Detección de victoria y progresión
  - Sistema de pistas (hand-hint) tras inactividad o errores
- **Modo profesor**: 
  - Input de ecuaciones en LaTeX (MathLive)
  - Sandbox para experimentar con bloques
  - Visualización en tiempo real
- **Motor de ecuaciones**: Generación por nivel y parsing de LaTeX a bloques
- **Sistema de bloques**: Drag-and-drop con dnd-kit, reglas de transformación, simplificación con Nerdamer
- **Visualización**: Gráfica interactiva (Mafs) y tabla de valores
- **Feedback**: Barra de progreso, confetti en victoria, animaciones con Framer Motion
- **Persistencia**: Guardado automático en localStorage

## Tecnologías

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **pnpm** - Gestor de paquetes
- **Tailwind CSS 4** - Estilos
- **Nerdamer** - Motor matemático (generación, validación, simplificación)
- **dnd-kit** - Sistema de drag-and-drop
- **Framer Motion** - Animaciones y transiciones
- **Mafs** - Gráficas matemáticas interactivas
- **MathLive** - Input de ecuaciones en LaTeX
- **Zustand** - Estado global
- **shadcn/ui** - Componentes UI
- **canvas-confetti** - Efectos de victoria

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm run dev

# Build de producción
pnpm run build

# Preview del build
pnpm run preview
```

## Despliegue con Docker

```bash
# Construir imagen
docker build -t equismath .

# Ejecutar contenedor
docker run -d -p 8080:80 --name equismath equismath
```

La aplicación estará disponible en `http://localhost:8080`.

## Estructura del proyecto

```
src/
├── app/              # App.tsx, router por rol
├── features/         # Módulos por funcionalidad
│   ├── role-selector/       # Selector Estudiante/Profesor
│   ├── student-mode/        # Modo estudiante con niveles
│   ├── teacher-mode/        # Modo profesor/sandbox
│   ├── equation-engine/     # Generación y parsing
│   ├── block-system/        # Drag-and-drop, validación
│   ├── visualization/       # Gráfica (Mafs) y tabla
│   ├── feedback/            # Progreso, confetti
│   ├── hint-system/         # Sistema de pistas
│   └── persistence/         # localStorage
├── shared/           # Código compartido
│   ├── types/       # Tipos TypeScript
│   ├── store/       # Estado global (Zustand)
│   └── lib/         # Utilidades
├── components/
│   └── ui/          # Componentes shadcn/ui
└── integration/     # Tests de flujo completo
```

## Licencia

MIT
