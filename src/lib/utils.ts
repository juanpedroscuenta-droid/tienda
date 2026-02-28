import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}
export function parseFormattedPrice(value: string | number): number {
  console.log("[PriceParser] Input:", value);
  if (typeof value === 'number') return value;
  if (!value) return 0;

  let str = String(value).trim();

  // Si no hay separadores, retornar simple parseFloat
  if (!str.includes('.') && !str.includes(',')) {
    const result = parseFloat(str) || 0;
    console.log("[PriceParser] No separators found, result:", result);
    return result;
  }

  // Si hay puntos y comas, el último es el decimal
  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    let result;
    if (lastDot > lastComma) {
      // Punto es decimal: 1,500.50 -> 1500.50
      result = parseFloat(str.replace(/,/g, '')) || 0;
    } else {
      // Coma es decimal: 1.500,50 -> 1500.50
      result = parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }
    console.log("[PriceParser] Mixed separators found, result:", result);
    return result;
  }

  // Si hay solo un tipo de separador
  const separator = lastDot !== -1 ? '.' : ',';
  const parts = str.split(separator);

  // Si hay múltiples separadores, es separador de miles: 1.000.000
  if (parts.length > 2) {
    const result = parseFloat(str.replace(separator === '.' ? /\./g : /,/g, '')) || 0;
    console.log("[PriceParser] Multiple same separators, result:", result);
    return result;
  }

  // Un solo separador: 300.000 o 300.50 o 23.00
  // REGLA COLOMBIA: En Colombia casi no se usan decimales. 
  // Si alguien pone 23.00, es muy probable que quiera decir 2300.
  // Si el bloque después del separador tiene 1, 2 o 3 dígitos, lo tratamos como miles si es un punto.
  if (parts[1].length <= 3) {
    const result = parseFloat(str.replace(separator === '.' ? /\./g : /,/g, '')) || 0;
    console.log("[PriceParser] Single separator treated as thousand (Colonial rule), result:", result);
    return result;
  }

  // En cualquier otro caso (más de 3 dígitos después del separador, que es raro), tratar como decimal
  const result = parseFloat(str.replace(',', '.')) || 0;
  console.log("[PriceParser] Treated as decimal, result:", result);
  return result;
}
