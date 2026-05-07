import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatStatusLabel(status?: string, fallback = "") {
  return (status || fallback).replace(/_/g, " ")
}
