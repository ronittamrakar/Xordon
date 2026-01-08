import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (phoneNumber.startsWith('+')) {
    // International format - just return as is
    return phoneNumber;
  }
  
  return phoneNumber;
}
