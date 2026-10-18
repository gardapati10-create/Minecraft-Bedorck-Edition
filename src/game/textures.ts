import * as THREE from 'three';
import { BLOCK } from './constants';

// Helper to create an offscreen canvas and 2D context
function createPixelCanvas(width = 16, height = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  return tex;
}

// Pseudo-random noise helper for repeatable procedural pixel art
function seededRng(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Generate authentic Minecraft pixel textures
export function generateBlockTextures(): Record<string, THREE.CanvasTexture> {
  const textures: Record<string, THREE.CanvasTexture> = {};

  // 1. DIRT
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(101);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const base = r > 0.7 ? '#69482d' : r > 0.4 ? '#866043' : r > 0.15 ? '#775438' : '#573d26';
        ctx.fillStyle = base;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['dirt'] = canvasToTexture(canvas);
  }

  // 2. GRASS TOP
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(202);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const base = r > 0.7 ? '#4c7b23' : r > 0.4 ? '#5b8e2b' : r > 0.15 ? '#679e32' : '#3e651c';
        ctx.fillStyle = base;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['grass_top'] = canvasToTexture(canvas);
  }

  // 3. GRASS SIDE (Dirt with grass dripping top)
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(303);
    // Fill with dirt base
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.7 ? '#69482d' : r > 0.4 ? '#866043' : '#775438';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Grass overhang on top 2-4 rows
    for (let x = 0; x < 16; x++) {
      const drop = Math.floor(rng() * 3) + 2;
      for (let y = 0; y <= drop; y++) {
        const r = rng();
        ctx.fillStyle = r > 0.5 ? '#5b8e2b' : '#4c7b23';
        ctx.fillRect(x, y, 1, 1);
      }
      // occasional single pixel drip
      if (rng() > 0.6) {
        ctx.fillStyle = '#41681f';
        ctx.fillRect(x, drop + 1, 1, 1);
      }
    }
    textures['grass_side'] = canvasToTexture(canvas);
  }

  // 4. STONE
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(404);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.8 ? '#8c8c8c' : r > 0.5 ? '#797979' : r > 0.2 ? '#6c6c6c' : '#575757';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['stone'] = canvasToTexture(canvas);
  }

  // 5. COBBLESTONE
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(505);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isBorder = (x % 4 === 0 && y % 3 === 0) || (x % 5 === 2 && y % 4 === 2);
        const r = rng();
        if (isBorder || r > 0.85) {
          ctx.fillStyle = '#3a3a3a';
        } else if (r > 0.6) {
          ctx.fillStyle = '#828282';
        } else if (r > 0.3) {
          ctx.fillStyle = '#6b6b6b';
        } else {
          ctx.fillStyle = '#565656';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['cobblestone'] = canvasToTexture(canvas);
  }

  // 6. OAK LOG SIDE (Bark)
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(606);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const stripe = (x + Math.floor(rng() * 2)) % 3 === 0;
        const r = rng();
        if (stripe) {
          ctx.fillStyle = r > 0.5 ? '#433420' : '#332717';
        } else {
          ctx.fillStyle = r > 0.6 ? '#6d5432' : r > 0.3 ? '#5c4629' : '#503c22';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['oak_log_side'] = canvasToTexture(canvas);
  }

  // 7. OAK LOG TOP (Rings)
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(707);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dist = Math.sqrt((x - 7.5) ** 2 + (y - 7.5) ** 2);
        if (dist > 7) {
          ctx.fillStyle = '#433420'; // bark outer
        } else if (dist > 6) {
          ctx.fillStyle = '#634b2c';
        } else if (dist > 4.5 && dist < 5.5) {
          ctx.fillStyle = '#7a5d35'; // ring
        } else if (dist > 2.5 && dist < 3.5) {
          ctx.fillStyle = '#7a5d35'; // ring
        } else {
          const r = rng();
          ctx.fillStyle = r > 0.5 ? '#a88957' : '#9c7f4e'; // wood core
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['oak_log_top'] = canvasToTexture(canvas);
  }

  // 8. OAK PLANKS
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(808);
    for (let y = 0; y < 16; y++) {
      const isPlankLine = y % 4 === 3;
      for (let x = 0; x < 16; x++) {
        if (isPlankLine) {
          ctx.fillStyle = '#68512e';
        } else {
          const r = rng();
          ctx.fillStyle = r > 0.6 ? '#c29d63' : r > 0.3 ? '#b48f55' : '#a27e49';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Vertical seams every 8 pixels staggered
    for (let row = 0; row < 4; row++) {
      const seamX = row % 2 === 0 ? 7 : 12;
      for (let y = row * 4; y < row * 4 + 3; y++) {
        ctx.fillStyle = '#68512e';
        ctx.fillRect(seamX, y, 1, 1);
      }
    }
    textures['oak_planks'] = canvasToTexture(canvas);
  }

  // 9. OAK LEAVES (Cutout transparency)
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(909);
    ctx.clearRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        if (r > 0.22) {
          ctx.fillStyle = r > 0.7 ? '#43761c' : r > 0.45 ? '#366016' : '#284710';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    textures['oak_leaves'] = canvasToTexture(canvas);
  }

  // 10. SAND
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(1010);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.7 ? '#e3dbb0' : r > 0.4 ? '#dbd3a0' : r > 0.15 ? '#d2c792' : '#c6b980';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['sand'] = canvasToTexture(canvas);
  }

  // 11. GLASS
  {
    const { canvas, ctx } = createPixelCanvas();
    ctx.clearRect(0, 0, 16, 16);
    // Border
    ctx.fillStyle = 'rgba(215, 240, 255, 0.75)';
    ctx.strokeRect(0.5, 0.5, 15, 15);
    // Subtle glare highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(3, 4, 1, 1);
    ctx.fillRect(4, 5, 1, 1);
    ctx.fillRect(11, 11, 2, 2);
    textures['glass'] = canvasToTexture(canvas);
  }

  // 12. BRICK
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(1212);
    ctx.fillStyle = '#b3a69a'; // Mortar
    ctx.fillRect(0, 0, 16, 16);
    // 4 rows of bricks
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      const offset = (row % 2) * 4;
      for (let bx = -4 + offset; bx < 16; bx += 8) {
        for (let py = 0; py < 3; py++) {
          for (let px = 0; px < 7; px++) {
            const rx = bx + px;
            if (rx >= 0 && rx < 16) {
              const r = rng();
              ctx.fillStyle = r > 0.6 ? '#ab4d39' : r > 0.3 ? '#993f2d' : '#883525';
              ctx.fillRect(rx, y + py, 1, 1);
            }
          }
        }
      }
    }
    textures['brick'] = canvasToTexture(canvas);
  }

  // 13. ORES: COAL, IRON, DIAMOND
  const ores = [
    { name: 'coal_ore', colors: ['#1c1c1c', '#2c2c2c', '#0f0f0f'] },
    { name: 'iron_ore', colors: ['#e0bca0', '#c9a58b', '#af8b72'] },
    { name: 'diamond_ore', colors: ['#55ffff', '#46d8d8', '#2ca8b4'] },
  ];
  for (const ore of ores) {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(1313 + ore.name.length);
    // Stone background
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.7 ? '#808080' : r > 0.4 ? '#707070' : '#606060';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Ore clusters
    const spots = [
      [3, 3], [4, 3], [3, 4], [4, 4],
      [10, 5], [11, 5], [11, 6],
      [6, 10], [7, 10], [6, 11], [8, 11],
      [12, 12], [13, 12],
    ];
    for (const [ox, oy] of spots) {
      const c = ore.colors[Math.floor(rng() * ore.colors.length)];
      ctx.fillStyle = c;
      ctx.fillRect(ox, oy, 1, 1);
    }
    textures[ore.name] = canvasToTexture(canvas);
  }

  // 14. BOOKSHELF
  {
    const { canvas, ctx } = createPixelCanvas();
    // Wood plank frame
    ctx.fillStyle = '#b48f55';
    ctx.fillRect(0, 0, 16, 16);
    // Book rows
    const bookColors = ['#9e2b2b', '#2a5a94', '#2e7a3e', '#8a6230', '#633785', '#9c5b20'];
    const rng = seededRng(1414);
    for (const yOff of [2, 9]) {
      ctx.fillStyle = '#48351c'; // shelf shadow
      ctx.fillRect(1, yOff, 14, 5);
      let bx = 2;
      while (bx < 14) {
        const width = Math.min(Math.floor(rng() * 2) + 1, 14 - bx);
        const col = bookColors[Math.floor(rng() * bookColors.length)];
        ctx.fillStyle = col;
        ctx.fillRect(bx, yOff + 1, width, 4);
        bx += width + 1;
      }
    }
    textures['bookshelf'] = canvasToTexture(canvas);
  }

  // 15. CRAFTING TABLE TOP & SIDE
  {
    const { canvas, ctx } = createPixelCanvas();
    // Planks base
    ctx.fillStyle = '#b48f55';
    ctx.fillRect(0, 0, 16, 16);
    // Grid 3x3
    ctx.fillStyle = '#4d371c';
    ctx.strokeRect(2.5, 2.5, 11, 11);
    ctx.fillRect(6, 3, 1, 10);
    ctx.fillRect(10, 3, 1, 10);
    ctx.fillRect(3, 6, 10, 1);
    ctx.fillRect(3, 10, 10, 1);
    textures['crafting_table_top'] = canvasToTexture(canvas);

    // Side
    const { canvas: sc, ctx: sctx } = createPixelCanvas();
    sctx.fillStyle = '#b48f55';
    sctx.fillRect(0, 0, 16, 16);
    // Saw / tool pattern
    sctx.fillStyle = '#614624';
    sctx.fillRect(2, 2, 12, 12);
    sctx.fillStyle = '#9e9e9e';
    sctx.fillRect(4, 5, 8, 3);
    sctx.fillStyle = '#7a542b';
    sctx.fillRect(3, 4, 3, 5);
    textures['crafting_table_side'] = canvasToTexture(sc);
  }

  // 16. TNT TOP & SIDE
  {
    const { canvas, ctx } = createPixelCanvas();
    ctx.fillStyle = '#c72e20';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 5, 16, 6);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('TNT', 2, 10);
    textures['tnt_side'] = canvasToTexture(canvas);

    const { canvas: tc, ctx: tctx } = createPixelCanvas();
    tctx.fillStyle = '#c72e20';
    tctx.fillRect(0, 0, 16, 16);
    tctx.fillStyle = '#5c5c5c';
    tctx.fillRect(7, 7, 2, 2);
    textures['tnt_top'] = canvasToTexture(tc);
  }

  // 17. GLOWSTONE
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(1717);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.7 ? '#ffe88a' : r > 0.4 ? '#f7cf57' : r > 0.2 ? '#e8a933' : '#bf7722';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['glowstone'] = canvasToTexture(canvas);
  }

  // 18. BEDROCK
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(1818);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.8 ? '#4d4d4d' : r > 0.5 ? '#333333' : r > 0.2 ? '#212121' : '#111111';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['bedrock'] = canvasToTexture(canvas);
  }

  // 19. FURNACE FRONT & TOP
  {
    const { canvas, ctx } = createPixelCanvas();
    ctx.fillStyle = '#6e6e6e';
    ctx.fillRect(0, 0, 16, 16);
    // Furnace opening
    ctx.fillStyle = '#222222';
    ctx.fillRect(3, 4, 10, 8);
    // Coals
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(5, 8, 6, 3);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(6, 9, 4, 1);
    textures['furnace_front'] = canvasToTexture(canvas);
  }

  // 20. CHEST FRONT & TOP
  {
    const { canvas, ctx } = createPixelCanvas();
    ctx.fillStyle = '#9c7336';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#4d371c';
    ctx.strokeRect(1.5, 1.5, 13, 13);
    // Silver latch
    ctx.fillStyle = '#dcdcdc';
    ctx.fillRect(7, 6, 2, 4);
    ctx.fillStyle = '#222222';
    ctx.fillRect(7, 7, 2, 1);
    textures['chest_front'] = canvasToTexture(canvas);

    const { canvas: tc, ctx: tctx } = createPixelCanvas();
    tctx.fillStyle = '#9c7336';
    tctx.fillRect(0, 0, 16, 16);
    tctx.fillStyle = '#4d371c';
    tctx.strokeRect(1.5, 1.5, 13, 13);
    textures['chest_top'] = canvasToTexture(tc);
  }

  // 21. OBSIDIAN
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(2121);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.8 ? '#2c1e4a' : r > 0.5 ? '#1a122e' : r > 0.2 ? '#120c22' : '#0a0614';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['obsidian'] = canvasToTexture(canvas);
  }

  // 22. GOLD ORE & REDSTONE ORE
  {
    const { canvas: gc, ctx: gctx } = createPixelCanvas();
    const rng = seededRng(2222);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        gctx.fillStyle = r > 0.7 ? '#808080' : r > 0.4 ? '#707070' : '#606060';
        gctx.fillRect(x, y, 1, 1);
      }
    }
    // Gold specks
    gctx.fillStyle = '#fcee58';
    gctx.fillRect(4, 4, 2, 2);
    gctx.fillRect(10, 5, 2, 1);
    gctx.fillRect(7, 10, 3, 2);
    gctx.fillRect(12, 11, 2, 2);
    textures['gold_ore'] = canvasToTexture(gc);

    const { canvas: rc, ctx: rctx } = createPixelCanvas();
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        rctx.fillStyle = r > 0.7 ? '#808080' : r > 0.4 ? '#707070' : '#606060';
        rctx.fillRect(x, y, 1, 1);
      }
    }
    rctx.fillStyle = '#ff2222';
    rctx.fillRect(3, 4, 2, 2);
    rctx.fillRect(9, 6, 2, 2);
    rctx.fillRect(6, 11, 3, 2);
    textures['redstone_ore'] = canvasToTexture(rc);
  }

  // 23. STONE BRICKS
  {
    const { canvas, ctx } = createPixelCanvas();
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#444444';
    // 2x2 large stone bricks
    ctx.fillRect(0, 7, 16, 1);
    ctx.fillRect(7, 0, 1, 8);
    ctx.fillRect(11, 8, 1, 8);
    textures['stone_bricks'] = canvasToTexture(canvas);
  }

  // 24. WHITE WOOL
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(2424);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.6 ? '#f5f5f5' : r > 0.3 ? '#ebebeb' : '#dedede';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['white_wool'] = canvasToTexture(canvas);
  }

  // 25. TORCH
  {
    const { canvas, ctx } = createPixelCanvas();
    ctx.clearRect(0, 0, 16, 16);
    // Wood handle
    ctx.fillStyle = '#6d5432';
    ctx.fillRect(7, 5, 2, 10);
    // Flame
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(6, 2, 4, 3);
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(7, 1, 2, 2);
    textures['torch'] = canvasToTexture(canvas);
  }

  // 26. EMERALD ORE
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(2828);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.7 ? '#808080' : r > 0.4 ? '#707070' : '#606060';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#17dd62';
    ctx.fillRect(5, 5, 2, 2);
    ctx.fillRect(9, 8, 3, 2);
    ctx.fillRect(4, 11, 2, 2);
    textures['emerald_ore'] = canvasToTexture(canvas);
  }

  // 27. LAPIS ORE
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(2929);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.7 ? '#808080' : r > 0.4 ? '#707070' : '#606060';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#103bb2';
    ctx.fillRect(4, 4, 3, 2);
    ctx.fillRect(9, 5, 2, 2);
    ctx.fillRect(6, 9, 3, 2);
    ctx.fillRect(11, 11, 2, 2);
    textures['lapis_ore'] = canvasToTexture(canvas);
  }

  // 28. SANDSTONE
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(3030);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.7 ? '#ded59b' : r > 0.4 ? '#d4ca90' : '#c7bd82';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#b8ae75';
    ctx.fillRect(0, 15, 16, 1);
    textures['sandstone'] = canvasToTexture(canvas);
  }

  // 29. NETHERRACK
  {
    const { canvas, ctx } = createPixelCanvas();
    const rng = seededRng(3131);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        ctx.fillStyle = r > 0.7 ? '#852929' : r > 0.4 ? '#6e1e1e' : r > 0.15 ? '#571414' : '#450c0c';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    textures['netherrack'] = canvasToTexture(canvas);
  }

  // 19. BREAKING CRACK STAGES (0 to 9)
  for (let stage = 0; stage < 10; stage++) {
    const { canvas, ctx } = createPixelCanvas();
    ctx.clearRect(0, 0, 16, 16);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const rng = seededRng(9000 + stage);
    const numCracks = 3 + stage * 2;
    for (let i = 0; i < numCracks; i++) {
      const sx = Math.floor(rng() * 16);
      const sy = Math.floor(rng() * 16);
      const ex = Math.max(0, Math.min(15, sx + Math.floor(rng() * 7) - 3));
      const ey = Math.max(0, Math.min(15, sy + Math.floor(rng() * 7) - 3));
      ctx.moveTo(sx + 0.5, sy + 0.5);
      ctx.lineTo(ex + 0.5, ey + 0.5);
    }
    ctx.stroke();
    textures[`destroy_stage_${stage}`] = canvasToTexture(canvas);
  }

  return textures;
}

// Generate Player Skin Texture (Steve / Alex)
export function generateSteveSkinTexture(type: 'steve' | 'alex' = 'steve'): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(64, 32);
  ctx.clearRect(0, 0, 64, 32);

  // Steve colors
  const skin = type === 'steve' ? '#c48b68' : '#e0ad84';
  const hair = type === 'steve' ? '#4d301c' : '#bd6524';
  const shirt = type === 'steve' ? '#00a3a3' : '#73a544';
  const pants = type === 'steve' ? '#333b8a' : '#574635';
  const shoes = '#3d3d3d';
  const eyes = type === 'steve' ? '#413a94' : '#2b844b';

  // 1. Head (8x8x8 layout)
  // Head front at (8, 8, 8, 8)
  ctx.fillStyle = skin;
  ctx.fillRect(8, 8, 8, 8);
  // Hair on head front
  ctx.fillStyle = hair;
  ctx.fillRect(8, 8, 8, 2);
  ctx.fillRect(8, 10, 1, 2);
  ctx.fillRect(15, 10, 1, 2);
  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(9, 11, 2, 1);
  ctx.fillRect(13, 11, 2, 1);
  ctx.fillStyle = eyes;
  ctx.fillRect(10, 11, 1, 1);
  ctx.fillRect(13, 11, 1, 1);
  // Nose / mouth
  ctx.fillStyle = '#9b6345';
  ctx.fillRect(11, 12, 2, 1);
  ctx.fillRect(11, 13, 2, 1);

  // Head sides and top
  ctx.fillStyle = hair;
  ctx.fillRect(8, 0, 8, 8); // Top
  ctx.fillRect(0, 8, 8, 8); // Right
  ctx.fillRect(16, 8, 8, 8); // Left
  ctx.fillRect(24, 8, 8, 8); // Back

  // 2. Torso at (20, 20, 8, 12)
  ctx.fillStyle = shirt;
  ctx.fillRect(20, 20, 8, 12);
  // Neck dip
  ctx.fillStyle = skin;
  ctx.fillRect(22, 20, 4, 2);
  // Torso back
  ctx.fillStyle = shirt;
  ctx.fillRect(32, 20, 8, 12);

  // 3. Right Arm (44, 20, 4, 12)
  ctx.fillStyle = shirt;
  ctx.fillRect(44, 20, 4, 4);
  ctx.fillStyle = skin;
  ctx.fillRect(44, 24, 4, 8);

  // 4. Left Arm (36, 52 or mirrored)
  ctx.fillStyle = shirt;
  ctx.fillRect(36, 20, 4, 4);
  ctx.fillStyle = skin;
  ctx.fillRect(36, 24, 4, 8);

  // 5. Right Leg (4, 20, 4, 12)
  ctx.fillStyle = pants;
  ctx.fillRect(4, 20, 4, 10);
  ctx.fillStyle = shoes;
  ctx.fillRect(4, 30, 4, 2);

  // 6. Left Leg
  ctx.fillStyle = pants;
  ctx.fillRect(12, 20, 4, 10);
  ctx.fillStyle = shoes;
  ctx.fillRect(12, 30, 4, 2);

  return canvasToTexture(canvas);
}

// Map block ID to material definition (returns 6 materials for BoxGeometry or face indices)
export function getBlockFaceTextures(blockId: number, textures: Record<string, THREE.CanvasTexture>) {
  switch (blockId) {
    case BLOCK.GRASS:
      return {
        top: textures['grass_top'],
        bottom: textures['dirt'],
        side: textures['grass_side'],
      };
    case BLOCK.DIRT:
      return { all: textures['dirt'] };
    case BLOCK.STONE:
      return { all: textures['stone'] };
    case BLOCK.COBBLESTONE:
      return { all: textures['cobblestone'] };
    case BLOCK.OAK_LOG:
      return {
        top: textures['oak_log_top'],
        bottom: textures['oak_log_top'],
        side: textures['oak_log_side'],
      };
    case BLOCK.OAK_PLANKS:
      return { all: textures['oak_planks'] };
    case BLOCK.OAK_LEAVES:
      return { all: textures['oak_leaves'] };
    case BLOCK.SAND:
      return { all: textures['sand'] };
    case BLOCK.GLASS:
      return { all: textures['glass'] };
    case BLOCK.BRICK:
      return { all: textures['brick'] };
    case BLOCK.COAL_ORE:
      return { all: textures['coal_ore'] };
    case BLOCK.IRON_ORE:
      return { all: textures['iron_ore'] };
    case BLOCK.DIAMOND_ORE:
      return { all: textures['diamond_ore'] };
    case BLOCK.BOOKSHELF:
      return {
        top: textures['oak_planks'],
        bottom: textures['oak_planks'],
        side: textures['bookshelf'],
      };
    case BLOCK.CRAFTING_TABLE:
      return {
        top: textures['crafting_table_top'],
        bottom: textures['oak_planks'],
        side: textures['crafting_table_side'],
      };
    case BLOCK.TNT:
      return {
        top: textures['tnt_top'],
        bottom: textures['tnt_top'],
        side: textures['tnt_side'],
      };
    case BLOCK.GLOWSTONE:
      return { all: textures['glowstone'] };
    case BLOCK.BEDROCK:
      return { all: textures['bedrock'] };
    case BLOCK.EMERALD_ORE:
      return { all: textures['emerald_ore'] };
    case BLOCK.LAPIS_ORE:
      return { all: textures['lapis_ore'] };
    case BLOCK.SANDSTONE:
      return { all: textures['sandstone'] };
    case BLOCK.NETHERRACK:
      return { all: textures['netherrack'] };
    default:
      return { all: textures['dirt'] };
  }
}
