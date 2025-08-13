# Generador de Horarios — Web (listo para GitHub Pages)

**Contenido:** aplicación web estática (HTML/CSS/JS) que reproduce la lógica de tu `schedule_generator.py` para generar combinaciones de horarios, detectar choques y exportar PDF/PNG. Incluye la configuración de los planes (si fue posible extraerla del archivo Python) y la opción de importar/exportar JSON con tus configuraciones de grupos/horarios.

## Archivos incluidos
- `index.html` — interfaz y estructura.
- `styles.css` — estilos (minimalistas, redondeados).
- `app.js` — lógica del generador y exportación (puerta de enlace para la lógica original).
- `plan_estudios.json` — catálogo de asignaturas extraído del script Python (si existe).
- `schedule_generator.py` — tu script original (incluido para referencia).
- `README.md` — este archivo.

## Uso local
1. Descomprime el ZIP y coloca todos los archivos en la misma carpeta.
2. Abre `index.html` en el navegador (Chrome/Edge/Firefox). La app es totalmente client-side y no necesita servidor para probarse.
3. Para usarla:
   - Selecciona los semestres (panel izquierdo) y agrega cursos.
   - Para cada curso, añade grupos (A–F) y cada grupo los horarios (día, inicio, fin).
   - Pulsa **Generar combinaciones** para calcular todas las combinaciones válidas y detectar choques.
   - Marca la(s) combinación(es) que quieras y pulsa **Exportar PDF** o **Exportar Imagen**.

## Publicar en GitHub Pages
1. Crea un repositorio nuevo en GitHub y sube los archivos (o sube la carpeta completa).
2. Ve a **Settings > Pages**, selecciona la rama `main` o `master` y la carpeta `/ (root)` como source.
3. Guarda. En unos minutos tu sitio estará disponible en `https://<tu-usuario>.github.io/<tu-repositorio>/`

## Notas técnicas
- La detección de solapamiento usa exactamente la misma regla que en el script Python: dos horarios **se consideran no solapados** si `fin <= inicio` (es decir, tocar un borde no cuenta como choque).
- La generación de combinaciones es producto cartesiano de los grupos con horarios configurados por curso y luego se filtra por choques.
- Exportación a PDF usa `html2canvas` + `jsPDF` (funciona bien en páginas estáticas).

## Si falta información
Si `plan_estudios.json` quedó vacío, es porque no se pudo extraer automáticamente la estructura desde `schedule_generator.py`. En ese caso, abre el archivo `schedule_generator.py` incluido en el ZIP y copia manualmente la estructura `PLAN_ESTUDIOS` al archivo `plan_estudios.json` en formato JSON.

---
Si quieres, puedo:
- Generar una versión con paleta distinta o tipografías.
- Crear una rama `gh-pages` y un ejemplo ya publicado (necesitaré acceso al repo o permiso para crearlo).
- Añadir tests o un pequeño back-end (no requerido para GitHub Pages).
