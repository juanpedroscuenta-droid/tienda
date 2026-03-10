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
  if (typeof value === 'number') return value;
  if (!value) return 0;

  let str = String(value).trim();

  // Si no hay separadores, retornar simple parseFloat
  if (!str.includes('.') && !str.includes(',')) {
    return parseFloat(str) || 0;
  }

  // Si hay puntos y comas, el último es el decimal
  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastDot > lastComma) {
      // Punto es decimal: 1,500.50 -> 1500.50
      return parseFloat(str.replace(/,/g, '')) || 0;
    } else {
      // Coma es decimal: 1.500,50 -> 1500.50
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }
  }

  // Si hay solo un tipo de separador
  const separator = lastDot !== -1 ? '.' : ',';
  const parts = str.split(separator);

  // Si hay múltiples separadores, es separador de miles: 1.000.000
  if (parts.length > 2) {
    return parseFloat(str.replace(separator === '.' ? /\./g : /,/g, '')) || 0;
  }

  // Un solo separador: 300.000 o 300.50 o 23.00
  // REGLA COLOMBIA: En Colombia casi no se usan decimales. 
  if (parts[1].length <= 3) {
    return parseFloat(str.replace(separator === '.' ? /\./g : /,/g, '')) || 0;
  }

  return parseFloat(str.replace(',', '.')) || 0;
}
