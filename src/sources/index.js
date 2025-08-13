
import { unsplashSource } from './unsplash';
import { duckduckgoSource } from './duckduckgo';

export const sources = [
  unsplashSource,
  duckduckgoSource,
];

export const getSource = (name) => {
    return sources.find(s => s.name === name);
}
