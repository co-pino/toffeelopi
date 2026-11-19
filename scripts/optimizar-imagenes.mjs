import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const raizProyecto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const carpetaPublica = path.join(raizProyecto, "public", "imagenes", "webp");
const carpetaRespaldo = path.resolve(raizProyecto, "..", "toffeelopi-originales-webp");
const carpetaOriginales = path.join(raizProyecto, "imagenes", "webp");

if (carpetaRespaldo === raizProyecto || carpetaRespaldo.startsWith(`${raizProyecto}${path.sep}`)) {
  throw new Error("La carpeta de respaldo debe estar fuera del proyecto.");
}

const imagenes = [
  {
    nombre: "cheesecake_head_iawebp.webp",
    origenInicial: path.join(carpetaOriginales, "cheesecake_head_iawebp.webp"),
    anchoMaximo: 1376,
  },
  {
    nombre: "cheesecake4webp - copia.webp",
    origenInicial: path.join(carpetaOriginales, "cheesecake4webp - copia.webp"),
    anchoMaximo: 600,
  },
  {
    nombre: "cheesecake10webp.webp",
    origenInicial: path.join(carpetaOriginales, "cheesecake10webp.webp"),
    anchoMaximo: 600,
  },
  {
    nombre: "pie2.webp",
    origenInicial: path.join(carpetaOriginales, "pie2.webp"),
    anchoMaximo: 900,
  },
  {
    nombre: "queque2.webp",
    origenInicial: path.join(carpetaOriginales, "queque2.webp"),
    anchoMaximo: 900,
  },
  {
    nombre: "tarta_manzana_durazno.webp",
    origenInicial: path.join(carpetaOriginales, "tarta_manzana_durazno.webp"),
    anchoMaximo: 900,
  },
];

await mkdir(carpetaPublica, { recursive: true });
await mkdir(carpetaRespaldo, { recursive: true });

const resultados = [];

for (const imagen of imagenes) {
  const destino = path.join(carpetaPublica, imagen.nombre);
  const respaldo = path.join(carpetaRespaldo, imagen.nombre);
  let fuenteOriginal;

  try {
    await access(respaldo);
    fuenteOriginal = respaldo;
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    await copyFile(imagen.origenInicial, respaldo);
    fuenteOriginal = respaldo;
  }

  const datosOriginales = await sharp(fuenteOriginal).metadata();
  if (!datosOriginales.width || !datosOriginales.height) {
    throw new Error(`No se pudieron leer las dimensiones originales de ${imagen.nombre}.`);
  }

  const original = await readFile(fuenteOriginal);
  const salida = await sharp(fuenteOriginal)
    .rotate()
    .resize({ width: imagen.anchoMaximo, withoutEnlargement: true })
    .webp({ quality: 72, effort: 6 })
    .toBuffer();

  await writeFile(destino, salida);

  const datosOptimizados = await sharp(salida).metadata();
  resultados.push({
    nombre: imagen.nombre,
    ancho: datosOptimizados.width,
    alto: datosOptimizados.height,
    pesoOriginal: original.length,
    pesoOptimizado: salida.length,
  });

}

const bytesOriginales = resultados.reduce((total, imagen) => total + imagen.pesoOriginal, 0);
const bytesOptimizados = resultados.reduce((total, imagen) => total + imagen.pesoOptimizado, 0);
const formatoPeso = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

console.log("Imagen | Dimensiones optimizadas | Antes | Después");
for (const imagen of resultados) {
  console.log(
    `${imagen.nombre} | ${imagen.ancho}x${imagen.alto} | ${formatoPeso(imagen.pesoOriginal)} | ${formatoPeso(imagen.pesoOptimizado)}`,
  );
}
console.log(`Total | ${formatoPeso(bytesOriginales)} | ${formatoPeso(bytesOptimizados)}`);
console.log(`Originales respaldados fuera del proyecto en: ${carpetaRespaldo}`);
