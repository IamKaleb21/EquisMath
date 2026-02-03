# EquisMath

Aplicación web para resolver y visualizar ecuaciones lineales de forma interactiva.

## Características

- **Parser de ecuaciones**: Interpreta ecuaciones lineales de una o dos variables
- **Resolución paso a paso**: Muestra el proceso de resolución detallado
- **Gráfica interactiva**: Visualiza las ecuaciones con líneas infinitas estilo GeoGebra
- **Tooltips en puntos**: Muestra coordenadas al pasar el cursor sobre puntos de interés
- **Zoom y pan**: Navega por el plano cartesiano con controles de zoom
- **Soporte para sistemas**: Resuelve sistemas de dos ecuaciones lineales
- **Diseño Neo-Chalkboard**: Interfaz con estética de pizarra moderna

## Tecnologías

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS 4** - Estilos
- **Mafs** - Gráficas matemáticas interactivas
- **MathLive** - Input de ecuaciones matemáticas
- **Zustand** - Estado global
- **shadcn/ui** - Componentes UI

## Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
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
├── components/       # Componentes React
│   ├── ui/          # Componentes shadcn/ui
│   ├── Graph.tsx    # Gráfica interactiva (Mafs)
│   ├── InputBar.tsx # Input de ecuaciones (MathLive)
│   └── ...
├── modules/         # Lógica de negocio
│   ├── parser.ts    # Parser de ecuaciones
│   └── solver.ts    # Resolución de ecuaciones
├── store/           # Estado global (Zustand)
├── types/           # Tipos TypeScript
└── utils/           # Utilidades
```

## Licencia

MIT
