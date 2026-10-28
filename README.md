# Crazy Cakes Bogotá

Propuesta de página web para Crazy Cakes Bogotá, pastelería y repostería personalizada con figuras modeladas a mano, sin moldes.

Sitio: https://listoia21-pixel.github.io/crazy-cakes-bogota/

## Qué hay

- `index.html`, `styles.css`, `app.js`: la página principal, «Apaga la luz». El momento en que se apagan las luces y entra la torta: azul noche del logo, la vela como única luz y los colores de las velas del logo en cada sección.
  - Galería de 12 tortas destacadas con nombre propio; la luz recorre las tortas al bajar.
  - Colección de 30 tortas con filtros por temática y vista ampliada; desde cada una se arma el pedido.
  - Pedido en vivo: el nombre en la placa, la vela con la edad y «Sopla y pide tu deseo», que abre WhatsApp con el mensaje listo y los días que faltan para la fecha.
  - Sección de cursos de modelado y chocomodelado, preguntas frecuentes y contacto.
- `opcion-b/`: propuesta alternativa, «Edición única» (cada torta como figura de colección 1 de 1).
- `assets/fotos/`: las 30 fotos en WebP (480, 960 y 1600 px). `assets/tortas/`: fotos de la opción B.
- `sitemap.xml`, `robots.txt` y datos estructurados de pastelería (JSON-LD) en `index.html`.

## Publicación

GitHub Pages desde la rama `main`, carpeta raíz `/`. Es HTML, CSS y JavaScript sin compilación; para revisarlo en local basta servir la carpeta con un servidor HTTP.

## Fotos

Las 30 fotos vienen de las publicaciones de [@crazycakesbogota](https://www.instagram.com/crazycakesbogota/) en Instagram (1080 a 3024 px). Cuando lleguen los originales se reemplazan con los mismos nombres de archivo.

## Al comprar el dominio

Cambiar `https://listoia21-pixel.github.io/crazy-cakes-bogota/` por la dirección nueva en `index.html` (canonical, Open Graph y JSON-LD), `sitemap.xml` y `robots.txt`; publicar en Cloudflare Pages y enviar el sitemap en Search Console.

## Canales del negocio

- Instagram: https://www.instagram.com/crazycakesbogota/
- WhatsApp: https://wa.me/573171812316

El formulario solo prepara el mensaje en el navegador; nada se envía hasta que la persona lo manda desde WhatsApp.
