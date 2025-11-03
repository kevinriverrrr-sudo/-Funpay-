#!/bin/bash

# Скрипт для создания иконок расширения (placeholder)
# В реальном проекте здесь должны быть настоящие иконки

# Создаем простые SVG иконки с помощью ImageMagick или convert
# Если инструменты недоступны, создаем заглушки

sizes=(16 32 48 128)

for size in "${sizes[@]}"; do
  # Создаем простую SVG иконку с градиентом
  cat > "icon${size}.svg" << SVGEOF
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="$((size/8))" fill="url(#grad)"/>
  <text x="50%" y="60%" font-family="Arial" font-size="$((size*3/4))" fill="white" text-anchor="middle">🎨</text>
</svg>
SVGEOF
done

echo "SVG иконки созданы"
