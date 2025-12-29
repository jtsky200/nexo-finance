// Loader for otplib that defines exports and Buffer before importing
// This ensures CommonJS compatibility in browser environment

// Import Buffer polyfill
import { Buffer } from 'buffer';

// Define exports and module in global scope
declare global {
  var exports: any;
  var module: any;
  var Buffer: typeof import('buffer').Buffer;
}

// Set up Buffer, exports and module before any imports
if (typeof globalThis !== 'undefined') {
  // Define Buffer
  if (typeof (globalThis as any).Buffer === 'undefined') {
    (globalThis as any).Buffer = Buffer;
  }
  
  // Define exports
  if (typeof (globalThis as any).exports === 'undefined') {
    (globalThis as any).exports = {};
  }
  
  // Define module
  if (typeof (globalThis as any).module === 'undefined') {
    (globalThis as any).module = { exports: {} };
  }
}

// Also set up in window for browser
if (typeof window !== 'undefined') {
  if (typeof (window as any).Buffer === 'undefined') {
    (window as any).Buffer = Buffer;
  }
  if (typeof (window as any).exports === 'undefined') {
    (window as any).exports = (globalThis as any).exports;
  }
  if (typeof (window as any).module === 'undefined') {
    (window as any).module = (globalThis as any).module;
  }
}

// Now import otplib
export const loadOtplib = async () => {
  // Ensure Buffer, exports and module are defined
  if (typeof (globalThis as any).Buffer === 'undefined') {
    (globalThis as any).Buffer = Buffer;
  }
  if (typeof (globalThis as any).exports === 'undefined') {
    (globalThis as any).exports = {};
  }
  if (typeof (globalThis as any).module === 'undefined') {
    (globalThis as any).module = { exports: {} };
  }
  
  const otplib = await import('otplib');
  return otplib;
};

