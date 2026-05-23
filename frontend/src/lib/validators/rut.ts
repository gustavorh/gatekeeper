/**
 * Valida el formato de un RUT chileno (sin verificar dígito verificador).
 * Acepta formatos: 12345678-9, 12.345.678-9, 123456789.
 */
export function isValidRutFormat(rut: string): boolean {
  if (!rut) return false;
  const clean = rut.replace(/[.-]/g, "").toUpperCase();
  if (clean.length < 8 || clean.length > 9) return false;
  return /^[0-9]+K?$/.test(clean);
}

/**
 * Normaliza un RUT al formato canónico 12345678-9 (sin puntos, con guion).
 */
export function normalizeRut(rut: string): string {
  const clean = rut.replace(/[.-]/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}
