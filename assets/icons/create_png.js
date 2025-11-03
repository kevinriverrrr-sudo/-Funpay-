// Скрипт для создания простых PNG иконок
// В реальном проекте следует использовать профессионально разработанные иконки

const fs = require('fs');

// Простейший PNG (1x1 пиксель фиолетового цвета в base64)
// Это минимальный валидный PNG файл
const base64PNG = {
  16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVR42mNk+M9QzzCKYdSA0QNGDxg9YPSAwXcAAQCmWwP9DIjgKwAAAABJRU5ErkJggg==',
  32: 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOklEQVR42u3NMQ0AAAgDILV/aHM4BEQEhYYeuXQECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQL+EzAAgckDB87Wt9cAAAAASUVORK5CYII=',
  48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAARUlEQVR42u3PMQ0AAAgDwdT/0JZ2QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL5KwAGcvQMH3tb7pAAAAABJRU5ErkJggg==',
  128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAZElEQVR42u3BAQEAAACCIP+vbkhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBtAAEnAAG8F2XSAAAAAElFTkSuQmCC'
};

const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const buffer = Buffer.from(base64PNG[size], 'base64');
  fs.writeFileSync(`icon${size}.png`, buffer);
  console.log(`Создана PNG иконка icon${size}.png`);
});

console.log('Все PNG иконки созданы!');
console.log('Примечание: Это простые placeholder иконки.');
console.log('Для production рекомендуется создать настоящие иконки с дизайном.');
