# Configuración de VS Code para Autocompletado MDX

Esta carpeta contiene configuración para mejorar la experiencia de desarrollo con archivos MDX en este proyecto.

## 📦 Extensiones Necesarias

Las siguientes extensiones se instalarán automáticamente (o VS Code te las sugerirá):

- **Astro** (`astro-build.astro-vscode`) - ✅ Ya instalada
- **YAML** (`redhat.vscode-yaml`) - ✅ Instalada automáticamente
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Recomendada

## 🎯 Cómo Usar el Autocompletado

### 1. **Snippets de Frontmatter**

Cuando crees un nuevo archivo `.mdx`, escribe uno de estos prefijos y presiona `Tab` o `Enter`:

- `minuta` - Crea frontmatter completo para minutas
- `proyecto-binario` - Proyecto con votación sí/no
- `proyecto-seleccion` - Proyecto con múltiples opciones
- `trabajo` - Trabajo realizado
- `documento` - Documento oficial

**Ejemplo:** Escribe `minuta` + `Tab` en un nuevo archivo MDX y se autocompleta todo el frontmatter.

### 2. **Validación YAML**

Gracias a los JSON Schemas en `schemas/`, VS Code te mostrará:

- ✅ Propiedades permitidas mientras escribes
- ⚠️ Errores si escribes propiedades que no existen
- 💡 Autocompletado de propiedades con `Ctrl+Space`
- 📝 Descripciones de cada campo al pasar el mouse

### 3. **Validación en Build Time**

Los schemas en `/src/content/config.ts` siguen validando cuando ejecutas:

```bash
npm run build
npm run dev
```

Si hay errores de validación, Astro te lo dirá en la consola.

## 📁 Archivos en esta Carpeta

### `settings.json`
Configura VS Code para usar los JSON Schemas con archivos MDX específicos:
- Minutas: `/src/content/minutas/**/*.mdx`
- Proyectos: `/src/content/proyectos-votacion/**/*.mdx`
- Trabajos: `/src/content/trabajos-realizados/**/*.mdx`
- Documentos: `/src/content/documentos/**/*.mdx`

### `schemas/*.schema.json`
Schemas JSON que describen la estructura del frontmatter para cada tipo de contenido.
Estos schemas se generan a partir de los schemas Zod en `src/content/config.ts`.

### `mdx.code-snippets`
Fragmentos de código para autocompletar rápidamente el frontmatter completo.

### `extensions.json`
Lista de extensiones recomendadas para este proyecto.

## 🔧 Solución de Problemas

### No veo autocompletado
1. Asegúrate de que la extensión **YAML** está instalada (revisa la lista de extensiones)
2. Recarga VS Code: `Cmd+Shift+P` → "Developer: Reload Window"
3. Verifica que estás en un archivo dentro de las carpetas correctas (ej: `/src/content/minutas/`)

### Los snippets no funcionan
1. Asegúrate de estar en un archivo `.mdx`
2. Escribe el prefijo completo (ej: `minuta`) y espera un segundo
3. Presiona `Ctrl+Space` para forzar el autocompletado

### Cambios en config.ts no se reflejan
Los JSON Schemas son estáticos. Si cambias `src/content/config.ts`, debes actualizar manualmente los archivos en `schemas/`.

## 📚 Más Información

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [YAML Extension Docs](https://github.com/redhat-developer/vscode-yaml)
- [VS Code Snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets)
