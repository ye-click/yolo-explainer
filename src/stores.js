import { writable, derived } from 'svelte/store';

export const yoloStore = writable(null);
export const svgStore = writable(undefined);
export const selectedGridCell = writable({row: -1, col: -1});
export const hoverInfoStore = writable({});
export const selectedImageStore = writable('dog.jpg');
export const detectionResults = writable([]);
export const showNMSStore = writable(false);
