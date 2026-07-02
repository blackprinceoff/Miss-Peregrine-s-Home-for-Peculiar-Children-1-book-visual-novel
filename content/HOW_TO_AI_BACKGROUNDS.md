# Як згенерувати фони для візуальної новели (безкоштовно)

## Варіант 1: Leonardo AI (найкращий для фонів, 150 безплатних токенів/день)

1. Зареєструватись на https://leonardo.ai
2. Натиснути `AI Image Generation`
3. Ввести промпт, наприклад:
   ```
   dark atmospheric abandoned victorian house on a misty island, eerie, vintage photo style, sepia tones, overgrown garden, 1920s england, cinematic lighting, wide shot, 16:9
   ```
4. Вибрати `Cinematic` або `Photo` пресет
5. Генерувати → скачати як PNG/WebP → покласти в `assets/backgrounds/`
6. Перейменувати файл у потрібний id (напр. `flashback.svg` → `flashback.png`)

## Варіант 2: Bing Image Creator (DALL-E 3, безплатно)

1. https://www.bing.com/create
2. Промпти англійською дають кращий результат
3. Співвідношення: вказуйте `--ar 16:9` в кінці промпту
4. Скачати .png → в assets/backgrounds/

## Промпти для кожної сцени

- **flashback** — warm sepia memory of a boy with his grandfather, Florida backyard, golden hour, nostalgic, soft light, 16:9
- **house** — mysterious old stone mansion on a remote foggy island, gothic architecture, overcast sky, 1920s, cinematic, 16:9
- **forest** — dark damp forest path at dusk, twisted trees, mossy ground, eerie atmosphere, 16:9
- **night** — stormy night sky over the ocean, dark clouds, lightning in the distance, lonely island silhouette, 16:9
- **interior** — warm dimly lit vintage study room, old bookshelves, lamp glow, sepia tones, cozy but mysterious, 16:9
- **dark** — pure darkness with subtle texture, deep shadows, 16:9

## Як замінити фон

1. Згенерувати зображення 1280×720 або 1920×1080 (співвідношення 16:9)
2. Скачати як `.webp` або `.png`
3. Покласти в `assets/backgrounds/` з тим самим іменем (напр. `flashback.webp`)
4. В `js/scenes/*.js` у ноди з `bg: "flashback"` автоматично підтягнеться новий файл
5. Якщо розширення не `.svg` — треба змінити в `js/engine.js` рядок:
   ```
   `url(assets/backgrounds/${node.bg}.svg)` → `url(assets/backgrounds/${node.bg}.webp)`
   ```
   Або простіше: перейменувати .webp у .svg (некоректно, але браузер все одно спробує завантажити)

## Альтернатива: Stable Diffusion локально

Якщо є відеокарта NVIDIA з 6+ ГБ VRAM:
- Завантажити https://github.com/AUTOMATIC1111/stable-diffusion-webui
- Встановити, запустити, генерувати локально без лімітів
