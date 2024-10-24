// Query selectors
export const $ = (selector: string) => document.querySelector(selector);
export const $$ = (selector: string) => document.querySelectorAll(selector);

// Declarative iterator
export const range = (n: number) => Array.from({ length: n }, (_, i) => i);
