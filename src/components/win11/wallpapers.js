const STORAGE_KEY = 'win11_wallpaper';

// Built-in desktop wallpapers (gradients + solids), Windows 11 style.
export const WALLPAPERS = [
  { id: 'default', name: 'Aerodyne Night', bg: 'linear-gradient(135deg, #0a0f1c 0%, #0d1326 45%, #122042 100%)' },
  { id: 'bloom', name: 'Bloom', bg: 'radial-gradient(circle at 50% 38%, #243a8a 0%, #0a0f1c 72%)' },
  { id: 'aurora', name: 'Aurora', bg: 'linear-gradient(160deg, #06101f 0%, #16406b 45%, #2a6b9a 75%, #3a8acf 100%)' },
  { id: 'ocean', name: 'Ocean', bg: 'linear-gradient(135deg, #0a2a4a 0%, #0d4a6b 50%, #1a7a9a 100%)' },
  { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg, #2a1a3e 0%, #6b2a5a 50%, #c2553d 100%)' },
  { id: 'forest', name: 'Forest', bg: 'linear-gradient(135deg, #0a2018 0%, #16402a 50%, #2a6b3a 100%)' },
  { id: 'carbon', name: 'Carbon', bg: '#1c1c1f' },
  { id: 'midnight', name: 'Midnight', bg: 'linear-gradient(180deg, #050810 0%, #0a1428 100%)' },
];

export function getWallpaper() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0];
  } catch {
    return WALLPAPERS[0];
  }
}

export function setWallpaper(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}