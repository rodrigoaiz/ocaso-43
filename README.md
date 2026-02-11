# Portal de Administración - Ocaso 43

Este es el portal administrativo del **Condominio Ocaso No. 43**, diseñado para gestionar de manera transparente y eficiente las minutas de asambleas, reglamentos y protocolos internos de la comunidad.

## 🚀 Tecnologías Utilizadas

- **[Astro 5](https://astro.build/)**: Framework web para una carga ultra rápida.
- **[Tailwind CSS 4](https://tailwindcss.com/)**: Estilizado moderno con la paleta de colores personalizada "Ocaso".
- **[MDX](https://mdxjs.com/)**: Para la creación de contenido enriquecido (minutas y documentos).
- **[Vercel](https://vercel.com/)**: Plataforma de despliegue y hosting SSR.

## 🛠️ Estructura del Proyecto

```text
/
├── src/
│   ├── content/        # Contenido MDX (Minutas y Documentos)
│   ├── layouts/        # Plantillas de diseño base
│   ├── components/     # Componentes interactivos
│   ├── pages/          # Rutas y páginas de la aplicación
│   ├── middleware.ts   # Sistema de autenticación SSR
│   └── styles/         # Estilos globales y tokens de diseño
├── public/             # Archivos estáticos
└── astro.config.mjs    # Configuración de Astro y Adaptador Vercel
```

## 💻 Desarrollo Local

Para ejecutar el proyecto en tu máquina:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```
2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
3. **Limpiar caché (en caso de errores extraños):**
   ```bash
   rm -rf .astro
   npm run dev
   ```

## 📑 Gestión de Contenido

Para añadir nuevas minutas o documentos:
- **Minutas:** Crear un archivo `.mdx` en `src/content/minutas/[AÑO]/[MES]/`.
- **Documentos:** Crear un archivo `.mdx` en `src/content/documentos/`.

Ambos requieren un *frontmatter* (encabezado) con el título, fecha y descripción.

## 🚢 Despliegue

El proyecto está configurado para desplegarse automáticamente en **Vercel** al hacer push a la rama `main`:

```bash
git add .
git commit -m "Descripción de tus cambios"
git push origin main
```

---
**Administración Ocaso 43**  
*Transparencia y Comunidad*
