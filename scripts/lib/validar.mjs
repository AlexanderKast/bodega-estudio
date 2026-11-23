/**
 * Validación de props contra el JSON Schema que sale del esquema zod de una plantilla
 * (`z.toJSONSchema`, ver studio/src/plantillas/catalogo.ts). Cubre lo que usan las plantillas: tipos,
 * campos obligatorios, opciones fijas, listas, objetos anidados y alternativas. Devuelve una lista de
 * errores legibles con la ruta del campo («beats[1].segundos: esperaba número y llegó texto»), que es
 * lo que hace falta para corregir un JSON de props sin abrir el código.
 */
const NOMBRE = { string: "texto", number: "número", integer: "número entero", boolean: "sí/no (true o false)", array: "lista", object: "objeto", null: "vacío" };
const tipoReal = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
const dice = (v) => NOMBRE[tipoReal(v)] ?? tipoReal(v);

export const validar = (esquema, valor, ruta = "") => {
  const donde = ruta || "(raíz)";
  if (!esquema || typeof esquema !== "object" || Object.keys(esquema).length === 0) return [];
  if (esquema.anyOf) {
    const intentos = esquema.anyOf.map((e) => validar(e, valor, ruta));
    return intentos.some((e) => e.length === 0) ? [] : intentos.sort((a, b) => a.length - b.length)[0];
  }
  if (esquema.enum && !esquema.enum.includes(valor)) {
    return [`${donde}: ${JSON.stringify(valor)} no es una opción. Opciones: ${esquema.enum.map((e) => JSON.stringify(e)).join(", ")}`];
  }
  if (esquema.const !== undefined && valor !== esquema.const) return [`${donde}: tiene que ser ${JSON.stringify(esquema.const)}`];
  const t = esquema.type;
  if (t) {
    const real = tipoReal(valor);
    const cuadra = t === "integer" ? Number.isInteger(valor) : t === "number" ? real === "number" && Number.isFinite(valor) : real === t;
    if (!cuadra) return [`${donde}: esperaba ${NOMBRE[t] ?? t} y llegó ${dice(valor)} (${JSON.stringify(valor)?.slice(0, 40)})`];
  }
  const errores = [];
  if (t === "number" || t === "integer") {
    if (esquema.minimum !== undefined && valor < esquema.minimum) errores.push(`${donde}: mínimo ${esquema.minimum}, llegó ${valor}`);
    if (esquema.maximum !== undefined && valor > esquema.maximum) errores.push(`${donde}: máximo ${esquema.maximum}, llegó ${valor}`);
  }
  if (t === "array") {
    if (esquema.minItems !== undefined && valor.length < esquema.minItems) errores.push(`${donde}: necesita al menos ${esquema.minItems} elementos y trae ${valor.length}`);
    if (esquema.maxItems !== undefined && valor.length > esquema.maxItems) errores.push(`${donde}: admite hasta ${esquema.maxItems} elementos y trae ${valor.length}`);
    if (esquema.items) valor.forEach((v, i) => errores.push(...validar(esquema.items, v, `${ruta}[${i}]`)));
  }
  if (t === "object" && esquema.properties) {
    for (const campo of esquema.required ?? []) {
      if (valor[campo] === undefined) errores.push(`${ruta ? `${ruta}.` : ""}${campo}: falta (es obligatorio)`);
    }
    for (const [campo, v] of Object.entries(valor)) {
      if (esquema.properties[campo]) errores.push(...validar(esquema.properties[campo], v, ruta ? `${ruta}.${campo}` : campo));
      else if (esquema.additionalProperties === false) errores.push(`${ruta ? `${ruta}.` : ""}${campo}: este campo no existe en la plantilla. Campos: ${Object.keys(esquema.properties).join(", ")}`);
    }
  }
  return errores;
};
