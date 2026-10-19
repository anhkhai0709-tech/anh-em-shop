import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir('public', {recursive:true});
for (const file of ['analytics.js','analytics.html','analytics-admin.js','index.html','admin.html','orders.html','orders.js','product.html','product.js','script.js','style.css','cloud.js','admin-cloud.js','_routes.json','_headers']) await copyFile(file, `public/${file}`);
await cp('assets','public/assets',{recursive:true});
for (const file of ['chatbot.js','chatbot.css']) await copyFile(file,`public/${file}`);
