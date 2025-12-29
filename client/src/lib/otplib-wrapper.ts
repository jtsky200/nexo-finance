// Wrapper for otplib to handle CommonJS exports in browser environment
// This file ensures exports and module are defined before otplib is used

// Define exports and module in global scope if they don't exist
declare global {
  var exports: any;
  var module: any;
}

if (typeof globalThis !== 'undefined') {
  if (typeof (globalThis as any).exports === 'undefined') {
    (globalThis as any).exports = {};
  }
  if (typeof (globalThis as any).module === 'undefined') {
    (globalThis as any).module = { exports: {} };
  }
}

// Re-export otplib
export * from 'otplib';

