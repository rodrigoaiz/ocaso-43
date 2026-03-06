# Guía de Imágenes para Proyectos

Esta carpeta contiene las imágenes utilizadas en el portal de Ocaso 43.

## Estructura de Carpetas

```
public/img/
├── proyectos/          # Imágenes para proyectos de votación
├── minutas/            # Imágenes para minutas (opcional)
└── documentos/         # Imágenes para documentos (opcional)
```

## Cómo Agregar Imágenes a Proyectos

### 1. Agregar la Imagen

Coloca tu imagen en `/public/img/proyectos/` con un nombre descriptivo:

```
public/img/proyectos/tapa-valvula.jpg
public/img/proyectos/cisterna-grietas.jpg
public/img/proyectos/camaras-entrada.jpg
```

### 2. Usar en el MDX

En tu archivo MDX del proyecto, agrega el import y usa el componente:

```mdx
---
titulo: "Mi Proyecto"
fecha: 2026-03-15
# ... otros campos
---

import ProjectImage from '../../components/ProjectImage.astro';

# Mi Proyecto

## Evidencia Fotográfica

<ProjectImage 
  src="/img/proyectos/nombre-imagen.jpg"
  alt="Descripción clara de la imagen"
  caption="Pie de foto opcional para contexto adicional"
/>

## Más contenido...
```

### Ejemplo Real

```mdx
<ProjectImage 
  src="/img/proyectos/tapa-valvula.jpg"
  alt="Válvula de agua expuesta en azotea"
  caption="Estado actual: Válvula sin protección contra elementos"
/>
```

### Múltiples Imágenes

Puedes agregar varias imágenes simplemente repitiendo el componente:

```mdx
<ProjectImage 
  src="/img/proyectos/problema-01.jpg"
  alt="Vista general del problema"
  caption="Foto 1: Vista panorámica de la zona afectada"
/>

<ProjectImage 
  src="/img/proyectos/problema-02.jpg"
  alt="Detalle del daño estructural"
  caption="Foto 2: Acercamiento al daño detectado"
/>
```

## Best Practices

### Optimización de Imágenes

Antes de subir imágenes, optimízalas para reducir tamaño:

- **Herramientas recomendadas**: TinyPNG, ImageOptim, Squoosh
- **Resolución máxima**: 1600px de ancho
- **Formato**: JPG para fotos, PNG para gráficos/diagramas
- **Peso objetivo**: < 200KB por imagen

### Nombrado de Archivos

Usa nombres descriptivos y consistentes:

✅ **Bien:**
- `cisterna-grietas-pared-este.jpg`
- `valvula-azotea-sin-proteccion.jpg`
- `camaras-propuesta-ubicacion.jpg`

❌ **Mal:**
- `IMG_1234.jpg`
- `foto.jpg`
- `image-final-v2-copia.jpg`

### Alt Text

El atributo `alt` es importante para:
- Accesibilidad (lectores de pantalla)
- SEO
- Mostrar texto si la imagen no carga

**Buenas prácticas:**
- Sé descriptivo pero conciso
- Menciona el contenido importante de la imagen
- No uses "imagen de..." o "foto de..."

✅ **Bien:** `"Grietas en pared este de la cisterna"`  
❌ **Mal:** `"Imagen de la cisterna"` o `"Foto"`

## Props del Componente ProjectImage

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `src` | `string` | ✅ | Ruta de la imagen en `/public/img/` |
| `alt` | `string` | ✅ | Texto alternativo descriptivo |
| `caption` | `string` | ❌ | Pie de foto (aparece debajo) |
| `className` | `string` | ❌ | Clases CSS adicionales |

## Características del Componente

El componente `<ProjectImage>` incluye automáticamente:

- ✅ **Lazy loading** - Carga solo cuando es visible
- ✅ **Responsive** - Se adapta al ancho del contenedor
- ✅ **Bordes redondeados** - Diseño consistente Ocaso
- ✅ **Shadow** - Sombra sutil para profundidad
- ✅ **Hover effect** - Ligero zoom al pasar el mouse
- ✅ **Caption opcional** - Pie de foto estilizado
- ✅ **Optimizado para SEO** - Atributos correctos

No necesitas agregar ninguno de estos estilos manualmente.
