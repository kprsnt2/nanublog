"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ─── Constants ───────────────────────────────────────────────────────
const TRACK_COLORS = ["#7C3AED", "#a855f7", "#6d28d9"];
const TRAIN_COLORS = [
  "#EF4444", "#F97316", "#FBBF24", "#34D399", "#60A5FA",
  "#A78BFA", "#F472B6", "#FB923C", "#4ADE80", "#38BDF8",
  "#E879F9", "#FCD34D", "#2DD4BF", "#818CF8", "#FB7185",
];

const TRAIN_W = 60;
const TRAIN_H = 22;
const WHEEL_R = 5;
const CAR_GAP = 6;
const CAR_COUNT = 2; // locomotive + 2 cars
const DERAIL_CHANCE = 0.001; // per-frame probability
const AUTO_SPAWN_MS = 2500; // new train every ~2.5s
const CRASH_PARTICLE_COUNT = 16;
const SMOKE_INTERVAL = 5;
const MAX_SMOKE_PER_TRAIN = 8;
const MAX_ACTIVE_TRAINS = 25;
const MAX_CRASHES = 5;
const MAX_HONKS = 6;
const DERAIL_TTL = 90;

// Road & Vehicle constants
const VEHICLE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
const VEHICLE_SPAWN_MS = 1800;
const MAX_VEHICLES = 15;
const TRUCK_STOP_CHANCE = 0.15;
const TRUCK_STOP_FRAMES = 300; // 5 seconds at 60fps
const LEADERBOARD_KEY = "train-crash-leaderboard";

// ─── Types ───────────────────────────────────────────────────────────
interface Vec { x: number; y: number }

interface Track {
  points: Vec[];
  color: string;
  length: number;
}

interface Road {
  y: number;
  trackCrossings: { x: number; trackIdx: number }[];
}

type VehicleType = "car" | "truck" | "tram";

interface RoadVehicle {
  id: number;
  type: VehicleType;
  roadIdx: number;
  x: number; y: number;
  speed: number;
  direction: number; // 1 = right, -1 = left
  color: string;
  width: number; height: number;
  stopped: boolean;
  stopTimer: number;
  stopTrackIdx: number; // which track it stopped on
  crossed: boolean; // already counted as safe
  destroyed: boolean;
  derailed: boolean;
  derailVx: number; derailVy: number;
  derailAngle: number; derailRotSpeed: number;
  derailTimer: number;
}

interface SmokePuff {
  x: number; y: number;
  vx: number; vy: number;
  r: number; maxR: number;
  life: number; maxLife: number;
  color: string;
}

interface CrashParticle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
  emoji?: string;
}

interface CrashEffect {
  x: number; y: number;
  particles: CrashParticle[];
  shockwave: number;
  maxShockwave: number;
  life: number;
}

interface Train {
  id: number;
  trackIdx: number;
  progress: number;
  speed: number;
  color: string;
  derailed: boolean;
  derailAngle: number;
  derailVx: number;
  derailVy: number;
  derailRotSpeed: number;
  derailTimer: number;
  x: number; y: number;
  angle: number;
  crashed: boolean;
  smokePuffs: SmokePuff[];
  smokeTimer: number;
  cars: { x: number; y: number; angle: number; color: string }[];
  honkTimer: number;
}

interface LeaderboardEntry {
  crashes: number;
  safeCrossings: number;
  date: string;
}


// ─── Helpers ─────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function dist(a: Vec, b: Vec) { return Math.hypot(a.x - b.x, a.y - b.y); }
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function getTrackPoint(track: Track, progress: number): { pos: Vec; angle: number } {
  const pts = track.points;
  const totalSegs = pts.length - 1;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const idx = Math.min(Math.floor(clampedProgress * totalSegs), totalSegs - 1);
  const t = (clampedProgress * totalSegs) - idx;
  const a = pts[idx];
  const b = pts[idx + 1] || pts[idx];
  return {
    pos: { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) },
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

function calcTrackLength(points: Vec[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += dist(points[i], points[i + 1]);
  }
  return len;
}

// ─── Track Generators ────────────────────────────────────────────────
function generateTracks(w: number, h: number): Track[] {
  const tracks: Track[] = [];
  const ySpacing = Math.max(100, h / 6);
  const trackCount = Math.max(3, Math.floor(h / ySpacing));

  for (let i = 0; i < trackCount; i++) {
    const y0 = 60 + i * ySpacing;
    const pts: Vec[] = [];
    const segments = randInt(8, 14);
    for (let s = 0; s <= segments; s++) {
      const baseX = (s / segments) * (w + 200) - 100;
      const waveY = Math.sin(s * 0.8 + i * 1.5) * (30 + i * 8);
      pts.push({ x: baseX, y: y0 + waveY });
    }
    tracks.push({ points: pts, color: pick(TRACK_COLORS), length: calcTrackLength(pts) });
  }

  // Add a couple of curvy cross-tracks
  for (let c = 0; c < 2; c++) {
    const pts: Vec[] = [];
    const startX = rand(w * 0.15, w * 0.85);
    const segments = randInt(6, 10);
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      pts.push({
        x: startX + Math.sin(t * Math.PI * 2 + c) * (w * 0.25),
        y: t * h,
      });
    }
    tracks.push({ points: pts, color: pick(TRACK_COLORS), length: calcTrackLength(pts) });
  }

  return tracks;
}

// ─── Road Generator ──────────────────────────────────────────────────
function generateRoads(tracks: Track[], w: number, h: number): Road[] {
  const roads: Road[] = [];
  const roadCount = randInt(2, 3);
  const usedYs: number[] = [];

  for (let r = 0; r < roadCount; r++) {
    // Pick a Y that doesn't overlap with other roads
    let y = 0;
    for (let attempt = 0; attempt < 20; attempt++) {
      y = rand(80, h - 80);
      if (usedYs.every(uy => Math.abs(uy - y) > 80)) break;
    }
    usedYs.push(y);

    // Find where this road crosses each track
    const crossings: { x: number; trackIdx: number }[] = [];
    for (let ti = 0; ti < tracks.length; ti++) {
      const pts = tracks[ti].points;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if ((a.y <= y && b.y >= y) || (a.y >= y && b.y <= y)) {
          const t = (y - a.y) / (b.y - a.y);
          if (t >= 0 && t <= 1) {
            crossings.push({ x: lerp(a.x, b.x, t), trackIdx: ti });
          }
        }
      }
    }
    roads.push({ y, trackCrossings: crossings });
  }
  return roads;
}

// ─── Pre-render tracks & roads to offscreen canvas ───────────────────
function renderTracksToBuffer(tracks: Track[], roads: Road[], w: number, h: number, dpr: number): HTMLCanvasElement {
  const offscreen = document.createElement("canvas");
  offscreen.width = w * dpr;
  offscreen.height = h * dpr;
  const ctx = offscreen.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Draw roads first (below tracks)
  for (const road of roads) {
    // Road surface
    ctx.fillStyle = "rgba(60, 60, 70, 0.6)";
    ctx.fillRect(0, road.y - 14, w, 28);
    // Road edges
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, road.y - 14); ctx.lineTo(w, road.y - 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, road.y + 14); ctx.lineTo(w, road.y + 14);
    ctx.stroke();
    // Dashed center line
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = "rgba(255, 200, 50, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, road.y); ctx.lineTo(w, road.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crossing markers (where road meets tracks)
    for (const cross of road.trackCrossings) {
      ctx.fillStyle = "rgba(255, 200, 50, 0.25)";
      ctx.fillRect(cross.x - 15, road.y - 16, 30, 32);
      // Warning stripes
      ctx.strokeStyle = "rgba(255, 100, 50, 0.4)";
      ctx.lineWidth = 2;
      for (let s = -12; s <= 12; s += 6) {
        ctx.beginPath();
        ctx.moveTo(cross.x + s - 3, road.y - 16);
        ctx.lineTo(cross.x + s + 3, road.y + 16);
        ctx.stroke();
      }
    }
  }

  for (const track of tracks) {
    const pts = track.points;
    if (pts.length < 2) continue;

    // Track bed
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = "rgba(80, 40, 140, 0.4)";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Rails
    for (const offset of [-5, 5]) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const next = pts[i + 1] || pts[i];
        const angle = Math.atan2(next.y - pts[i].y, next.x - pts[i].x) + Math.PI / 2;
        const rx = pts[i].x + Math.cos(angle) * offset;
        const ry = pts[i].y + Math.sin(angle) * offset;
        if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      }
      ctx.strokeStyle = track.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Sleepers
    ctx.strokeStyle = "rgba(160, 120, 220, 0.3)";
    ctx.lineWidth = 3;
    for (let i = 0; i < pts.length - 1; i++) {
      const steps = Math.max(1, Math.floor(dist(pts[i], pts[i + 1]) / 15));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const sx = lerp(pts[i].x, pts[i + 1].x, t);
        const sy = lerp(pts[i].y, pts[i + 1].y, t);
        const angle = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x) + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(angle) * 8, sy + Math.sin(angle) * 8);
        ctx.lineTo(sx - Math.cos(angle) * 8, sy - Math.sin(angle) * 8);
        ctx.stroke();
      }
    }
  }

  return offscreen;
}

// ─── Smoke color pool (avoid string allocations) ─────────────────────
const SMOKE_POOL = ["rgba(120,120,120,", "rgba(160,160,160,", "rgba(200,200,200,"];

// ─── Leaderboard helpers ─────────────────────────────────────────────
function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveLeaderboard(entries: LeaderboardEntry[]) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 10)));
}

// ─── Main Component ──────────────────────────────────────────────────
export default function TrainCrashGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackBufferRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<{ x: number; y: number; r: number; twinkle: number }[]>([]);
  const stateRef = useRef<{
    trains: Train[];
    tracks: Track[];
    roads: Road[];
    vehicles: RoadVehicle[];
    crashes: CrashEffect[];
    nextId: number;
    w: number;
    h: number;
    frame: number;
    honks: { x: number; y: number; text: string; life: number }[];
    totalCrashes: number;
    safeCrossings: number;
  }>({
    trains: [],
    tracks: [],
    roads: [],
    vehicles: [],
    crashes: [],
    nextId: 0,
    w: 0,
    h: 0,
    frame: 0,
    honks: [],
    totalCrashes: 0,
    safeCrossings: 0,
  });

  const [trainCount, setTrainCount] = useState(0);
  const [crashCount, setCrashCount] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadLeaderboard());

  // Create a new train on a random track
  const spawnTrain = useCallback(() => {
    const s = stateRef.current;
    if (s.tracks.length === 0) return;

    // Don't spawn if we're at the cap
    const activeCount = s.trains.filter(t => !t.crashed).length;
    if (activeCount >= MAX_ACTIVE_TRAINS) return;

    const trackIdx = randInt(0, s.tracks.length - 1);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const startProgress = direction > 0 ? 0 : 1;
    const baseColor = pick(TRAIN_COLORS);

    const train: Train = {
      id: s.nextId++,
      trackIdx,
      progress: startProgress,
      speed: direction * rand(0.0008, 0.003),
      color: baseColor,
      derailed: false,
      derailAngle: 0,
      derailVx: 0,
      derailVy: 0,
      derailRotSpeed: 0,
      derailTimer: 0,
      x: 0, y: 0,
      angle: 0,
      crashed: false,
      smokePuffs: [],
      smokeTimer: 0,
      cars: Array.from({ length: CAR_COUNT }, () => ({
        x: 0, y: 0, angle: 0, color: pick(TRAIN_COLORS),
      })),
      honkTimer: rand(60, 300),
    };
    s.trains.push(train);
  }, []);

  // Create a road vehicle
  const spawnVehicle = useCallback(() => {
    const s = stateRef.current;
    if (s.roads.length === 0) return;
    const activeV = s.vehicles.filter(v => !v.destroyed).length;
    if (activeV >= MAX_VEHICLES) return;

    const roadIdx = randInt(0, s.roads.length - 1);
    const road = s.roads[roadIdx];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const type: VehicleType = pick(["car", "car", "truck", "truck", "tram"]);
    const dims = type === "car" ? { w: 30, h: 14 } : type === "truck" ? { w: 44, h: 16 } : { w: 52, h: 12 };
    const spd = type === "tram" ? rand(0.8, 1.2) : type === "truck" ? rand(0.6, 1.4) : rand(1.0, 2.0);

    s.vehicles.push({
      id: s.nextId++,
      type,
      roadIdx,
      x: direction > 0 ? -dims.w : s.w + dims.w,
      y: road.y + (direction > 0 ? -5 : 5),
      speed: spd,
      direction,
      color: pick(VEHICLE_COLORS),
      width: dims.w, height: dims.h,
      stopped: false,
      stopTimer: 0,
      stopTrackIdx: -1,
      crossed: false,
      destroyed: false,
      derailed: false,
      derailVx: 0, derailVy: 0,
      derailAngle: 0, derailRotSpeed: 0,
      derailTimer: 0,
    });
  }, []);

  // Init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      stateRef.current.w = rect.width;
      stateRef.current.h = rect.height;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Regenerate tracks & roads on resize
      stateRef.current.tracks = generateTracks(rect.width, rect.height);
      stateRef.current.roads = generateRoads(stateRef.current.tracks, rect.width, rect.height);

      // Pre-render tracks & roads to offscreen buffer
      trackBufferRef.current = renderTracksToBuffer(stateRef.current.tracks, stateRef.current.roads, rect.width, rect.height, dpr);

      // Generate stars
      starsRef.current = Array.from({ length: 50 }, () => ({
        x: rand(0, rect.width), y: rand(0, rect.height),
        r: rand(0.5, 1.8), twinkle: rand(0, Math.PI * 2),
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    // Spawn initial trains
    for (let i = 0; i < 4; i++) spawnTrain();

    // Auto-spawn trains & vehicles
    const spawnInterval = setInterval(spawnTrain, AUTO_SPAWN_MS);
    const vehicleInterval = setInterval(spawnVehicle, VEHICLE_SPAWN_MS);

    // Spawn initial vehicles
    for (let i = 0; i < 3; i++) spawnVehicle();

    // Click to spawn
    const handleClick = () => {
      spawnTrain();
      if (Math.random() > 0.5) spawnTrain();
    };
    canvas.addEventListener("click", handleClick);

    // Animation loop
    let raf: number;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      update();
      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(spawnInterval);
      clearInterval(vehicleInterval);
      // Save score on unmount
      const st = stateRef.current;
      if (st.totalCrashes > 0 || st.safeCrossings > 0) {
        const lb = loadLeaderboard();
        lb.push({ crashes: st.totalCrashes, safeCrossings: st.safeCrossings, date: new Date().toLocaleDateString() });
        lb.sort((a, b) => b.crashes - a.crashes);
        saveLeaderboard(lb);
      }
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── UPDATE ────────────────────────────────────────────────────────
  const update = useCallback(() => {
    const s = stateRef.current;
    s.frame++;

    // Update trains
    for (let ti = s.trains.length - 1; ti >= 0; ti--) {
      const train = s.trains[ti];
      if (train.crashed) continue;

      if (!train.derailed) {
        // Move along track
        train.progress += train.speed;
        const track = s.tracks[train.trackIdx];
        if (!track) { train.crashed = true; continue; }

        const { pos, angle } = getTrackPoint(track, train.progress);
        train.x = pos.x;
        train.y = pos.y;
        train.angle = angle;

        // Update cars (follow behind) — use cached track length
        const tLen = track.length;
        for (let c = 0; c < train.cars.length; c++) {
          const carOffset = (c + 1) * (TRAIN_W + CAR_GAP) / tLen;
          const carProgress = train.progress - Math.sign(train.speed) * carOffset;
          const cp = getTrackPoint(track, carProgress);
          train.cars[c].x = cp.pos.x;
          train.cars[c].y = cp.pos.y;
          train.cars[c].angle = cp.angle;
        }

        // Smoke from locomotive (capped)
        train.smokeTimer++;
        if (train.smokeTimer >= SMOKE_INTERVAL && train.smokePuffs.length < MAX_SMOKE_PER_TRAIN) {
          train.smokeTimer = 0;
          const sDir = Math.sign(train.speed);
          train.smokePuffs.push({
            x: train.x - Math.cos(train.angle) * TRAIN_W * 0.4 * sDir,
            y: train.y - Math.sin(train.angle) * TRAIN_W * 0.4 * sDir - 8,
            vx: rand(-0.3, 0.3),
            vy: rand(-1.2, -0.4),
            r: 2,
            maxR: rand(5, 9),
            life: 0,
            maxLife: rand(20, 35),
            color: pick(SMOKE_POOL),
          });
        }

        // Honk
        train.honkTimer--;
        if (train.honkTimer <= 0 && s.honks.length < MAX_HONKS) {
          train.honkTimer = rand(200, 500);
          s.honks.push({
            x: train.x, y: train.y - 25,
            text: pick(["🚂 CHOO CHOO!", "TOOT TOOT! 🚃", "🚂💨", "CHUGGA CHUGGA!", "ALL ABOARD! 🎉", "HONK! 📯"]),
            life: 50,
          });
        }

        // Random derail
        if (Math.random() < DERAIL_CHANCE && train.progress > 0.1 && train.progress < 0.9) {
          train.derailed = true;
          train.derailAngle = train.angle;
          train.derailTimer = 0;
          const dAngle = train.angle + (Math.random() > 0.5 ? 1 : -1) * rand(0.3, 1.2);
          train.derailVx = Math.cos(dAngle) * Math.abs(train.speed) * 500;
          train.derailVy = Math.sin(dAngle) * Math.abs(train.speed) * 500 - rand(1, 3);
          train.derailRotSpeed = rand(-0.08, 0.08);
        }

        // Wrap around
        if (train.progress > 1.05 || train.progress < -0.05) {
          train.progress = train.speed > 0 ? -0.02 : 1.02;
        }
      } else {
        // Derailed physics
        train.derailTimer++;
        train.x += train.derailVx;
        train.y += train.derailVy;
        train.derailVy += 0.15;
        train.derailAngle += train.derailRotSpeed;
        train.angle = train.derailAngle;

        // Cars scatter
        for (const car of train.cars) {
          car.x += train.derailVx * 0.85;
          car.y += train.derailVy * 0.9;
          car.angle += rand(-0.04, 0.04);
        }

        // Remove quickly: off-screen or TTL expired
        if (train.derailTimer > DERAIL_TTL ||
            train.y > s.h + 80 || train.x < -150 || train.x > s.w + 150) {
          train.crashed = true;
          train.smokePuffs.length = 0; // free memory
        }
      }

      // Update smoke puffs
      for (let i = train.smokePuffs.length - 1; i >= 0; i--) {
        const p = train.smokePuffs[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.r = lerp(2, p.maxR, p.life / p.maxLife);
        if (p.life >= p.maxLife) train.smokePuffs.splice(i, 1);
      }
    }

    // ─── Collision detection (only non-crashed trains) ───────────────
    const active = s.trains.filter(t => !t.crashed && !t.derailed);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy < TRAIN_W * TRAIN_W * 0.64) {
          // CRASH!
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2;

          // Create crash effect (cap total)
          if (s.crashes.length < MAX_CRASHES) {
            const particles: CrashParticle[] = [];
            for (let p = 0; p < CRASH_PARTICLE_COUNT; p++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = rand(2, 8);
              const isEmoji = Math.random() > 0.65;
              particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - rand(1, 3),
                r: rand(3, 7),
                color: pick([a.color, b.color, "#FBBF24", "#EF4444"]),
                life: 0,
                maxLife: rand(30, 55),
                emoji: isEmoji ? pick(["💥", "⭐", "🔥", "💫", "✨"]) : undefined,
              });
            }
            s.crashes.push({
              x: cx, y: cy,
              particles,
              shockwave: 0,
              maxShockwave: rand(60, 100),
              life: 60,
            });
          }

          // Derail both trains
          a.derailed = true;
          a.derailTimer = 0;
          a.derailVx = -Math.sign(a.speed || 1) * rand(3, 6);
          a.derailVy = -rand(2, 4);
          a.derailRotSpeed = rand(-0.12, 0.12);

          b.derailed = true;
          b.derailTimer = 0;
          b.derailVx = Math.sign(b.speed || 1) * rand(3, 6);
          b.derailVy = -rand(2, 4);
          b.derailRotSpeed = rand(-0.12, 0.12);

          s.totalCrashes++;

          if (s.honks.length < MAX_HONKS) {
            s.honks.push({
              x: cx, y: cy - 30,
              text: pick(["💥 BOOM!", "CRASH! 💥", "KABOOM! 🔥", "OH NO! 😱", "SMASH! 💫"]),
              life: 60,
            });
          }
        }
      }
    }

    // Update crash effects
    for (let i = s.crashes.length - 1; i >= 0; i--) {
      const c = s.crashes[i];
      c.life--;
      c.shockwave += 3;
      for (const p of c.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.97;
        p.life++;
      }
      if (c.life <= 0) s.crashes.splice(i, 1);
    }

    // ─── Update road vehicles ────────────────────────────────────────
    for (let vi = s.vehicles.length - 1; vi >= 0; vi--) {
      const v = s.vehicles[vi];
      if (v.destroyed) continue;

      if (v.derailed) {
        // Derailed vehicle physics (same as train derail)
        v.derailTimer++;
        v.x += v.derailVx;
        v.y += v.derailVy;
        v.derailVy += 0.15;
        v.derailAngle += v.derailRotSpeed;
        if (v.derailTimer > DERAIL_TTL || v.y > s.h + 80 || v.x < -150 || v.x > s.w + 150) {
          v.destroyed = true;
        }
        continue;
      }

      if (v.stopped) {
        v.stopTimer--;
        if (v.stopTimer <= 0) {
          // Truck resumes — safe crossing!
          v.stopped = false;
          if (!v.crossed) {
            v.crossed = true;
            s.safeCrossings++;
            if (s.honks.length < MAX_HONKS) {
              s.honks.push({ x: v.x, y: v.y - 25, text: pick(["✅ SAFE!", "PHEW! 😅", "CLOSE ONE! 🍀", "LUCKY! 🎉"]), life: 50 });
            }
          }
        }
      } else {
        // Move vehicle
        v.x += v.speed * v.direction;

        // Check if truck is near a track crossing — chance to stop
        if (v.type === "truck" && !v.crossed) {
          const road = s.roads[v.roadIdx];
          if (road) {
            for (const cross of road.trackCrossings) {
              const dx = Math.abs(v.x - cross.x);
              if (dx < 8 && Math.random() < TRUCK_STOP_CHANCE) {
                v.stopped = true;
                v.stopTimer = TRUCK_STOP_FRAMES;
                v.stopTrackIdx = cross.trackIdx;
                v.x = cross.x; // snap to crossing
                if (s.honks.length < MAX_HONKS) {
                  s.honks.push({ x: v.x, y: v.y - 25, text: pick(["🛑 STUCK!", "ENGINE DEAD! 🚛", "OH NO! 😰", "HELP! 🆘"]), life: 80 });
                }
                break;
              }
            }
          }
        }

        // Remove if off-screen
        if ((v.direction > 0 && v.x > s.w + v.width + 10) || (v.direction < 0 && v.x < -v.width - 10)) {
          v.destroyed = true;
        }
      }
    }

    // ─── Train-Vehicle collision ──────────────────────────────────────
    const activeTrains = s.trains.filter(t => !t.crashed && !t.derailed);
    for (const train of activeTrains) {
      for (const v of s.vehicles) {
        if (v.destroyed || v.derailed) continue;
        const dx = train.x - v.x;
        const dy = train.y - v.y;
        const collDist = (TRAIN_W / 2 + v.width / 2) * 0.7;
        if (dx * dx + dy * dy < collDist * collDist) {
          // CRASH — same epic effect as train-train!
          const cx = (train.x + v.x) / 2;
          const cy = (train.y + v.y) / 2;

          if (s.crashes.length < MAX_CRASHES) {
            const particles: CrashParticle[] = [];
            for (let p = 0; p < CRASH_PARTICLE_COUNT; p++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = rand(2, 8);
              const isEmoji = Math.random() > 0.6;
              particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - rand(1, 3),
                r: rand(3, 7),
                color: pick([train.color, v.color, "#FBBF24", "#EF4444"]),
                life: 0,
                maxLife: rand(30, 55),
                emoji: isEmoji ? pick(["💥", "⭐", "🔥", "💫", "✨", "🚛", "🚗"]) : undefined,
              });
            }
            s.crashes.push({
              x: cx, y: cy, particles,
              shockwave: 0, maxShockwave: rand(60, 100), life: 60,
            });
          }

          // Derail the train
          train.derailed = true;
          train.derailTimer = 0;
          train.derailVx = -Math.sign(train.speed || 1) * rand(3, 6);
          train.derailVy = -rand(2, 4);
          train.derailRotSpeed = rand(-0.12, 0.12);

          // Derail the vehicle (fling it)
          v.derailed = true;
          v.derailTimer = 0;
          v.derailVx = Math.sign(train.speed || 1) * rand(4, 8);
          v.derailVy = -rand(3, 6);
          v.derailAngle = 0;
          v.derailRotSpeed = rand(-0.15, 0.15);

          s.totalCrashes++;

          if (s.honks.length < MAX_HONKS) {
            s.honks.push({
              x: cx, y: cy - 30,
              text: pick(["💥 TRAIN vs TRUCK!", "CRASH! 🚂💥🚛", "KABOOM! 🔥", "WHAM! 💫", "SMASH! 💥"]),
              life: 60,
            });
          }
        }
      }
    }

    // Update honks
    for (let i = s.honks.length - 1; i >= 0; i--) {
      s.honks[i].life--;
      s.honks[i].y -= 0.5;
      if (s.honks[i].life <= 0) s.honks.splice(i, 1);
    }

    // Prune crashed trains & destroyed vehicles
    s.trains = s.trains.filter(t => !t.crashed);
    s.vehicles = s.vehicles.filter(v => !v.destroyed);

    // Throttle React state updates (every 10 frames)
    if (s.frame % 10 === 0) {
      setTrainCount(s.trains.length);
      setCrashCount(s.totalCrashes);
      setSafeCount(s.safeCrossings);
      setVehicleCount(s.vehicles.filter(v => !v.derailed).length);
    }
  }, []);

  // ─── DRAW ──────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Clear
    ctx.fillStyle = "#1a0a2e";
    ctx.fillRect(0, 0, s.w, s.h);

    // Starry background
    const stars = starsRef.current;
    for (const star of stars) {
      const alpha = 0.3 + 0.4 * Math.sin(s.frame * 0.03 + star.twinkle);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    // Draw ground gradient
    const groundGrad = ctx.createLinearGradient(0, s.h - 50, 0, s.h);
    groundGrad.addColorStop(0, "rgba(46, 16, 101, 0)");
    groundGrad.addColorStop(1, "rgba(46, 16, 101, 0.5)");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, s.h - 50, s.w, 50);

    // Draw pre-rendered tracks from buffer
    if (trackBufferRef.current) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to pixel coords
      ctx.drawImage(trackBufferRef.current, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // restore dpr
      ctx.restore();
    }

    // Draw trains
    for (const train of s.trains) {
      // Draw smoke (behind train)
      for (const puff of train.smokePuffs) {
        const alpha = 1 - puff.life / puff.maxLife;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
        ctx.fillStyle = puff.color + (alpha * 0.5).toFixed(2) + ")";
        ctx.fill();
      }

      // Draw cars (back to front)
      for (let c = train.cars.length - 1; c >= 0; c--) {
        const car = train.cars[c];
        drawCar(ctx, car.x, car.y, car.angle, car.color);
      }

      // Draw locomotive
      drawLocomotive(ctx, train.x, train.y, train.angle, train.color, train.speed > 0);
    }

    // Draw road vehicles
    for (const v of s.vehicles) {
      if (v.destroyed) continue;
      drawRoadVehicle(ctx, v, s.frame);
    }

    // Draw crash effects
    for (const crash of s.crashes) {
      // Shockwave ring
      if (crash.shockwave < crash.maxShockwave) {
        const alpha = 1 - crash.shockwave / crash.maxShockwave;
        ctx.beginPath();
        ctx.arc(crash.x, crash.y, crash.shockwave, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.6})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Particles
      for (const p of crash.particles) {
        if (p.life >= p.maxLife) continue;
        const alpha = 1 - p.life / p.maxLife;
        if (p.emoji) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = `${10 + p.r}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, p.x, p.y);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Draw honk text
    ctx.font = "bold 15px 'Nunito', sans-serif";
    ctx.textAlign = "center";
    for (const h of s.honks) {
      const alpha = Math.min(1, h.life / 15);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#FBBF24";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 3;
      ctx.strokeText(h.text, h.x, h.y);
      ctx.fillText(h.text, h.x, h.y);
    }
    ctx.globalAlpha = 1;
  }, []);

  const saveScore = useCallback(() => {
    const s = stateRef.current;
    const lb = loadLeaderboard();
    lb.push({ crashes: s.totalCrashes, safeCrossings: s.safeCrossings, date: new Date().toLocaleDateString() });
    lb.sort((a, b) => b.crashes - a.crashes);
    saveLeaderboard(lb);
    setLeaderboard([...lb.slice(0, 10)]);
  }, []);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <div className="bg-purple-900/50 backdrop-blur-sm text-purple-200 px-3 py-2 rounded-full border border-purple-500/30 font-bold">
          🚂 Trains: <span className="text-yellow-400">{trainCount}</span>
        </div>
        <div className="bg-purple-900/50 backdrop-blur-sm text-purple-200 px-3 py-2 rounded-full border border-purple-500/30 font-bold">
          🚗 Vehicles: <span className="text-cyan-400">{vehicleCount}</span>
        </div>
        <div className="bg-purple-900/50 backdrop-blur-sm text-purple-200 px-3 py-2 rounded-full border border-purple-500/30 font-bold">
          💥 Crashes: <span className="text-red-400">{crashCount}</span>
        </div>
        <div className="bg-purple-900/50 backdrop-blur-sm text-purple-200 px-3 py-2 rounded-full border border-purple-500/30 font-bold">
          ✅ Safe: <span className="text-green-400">{safeCount}</span>
        </div>
        <button
          onClick={spawnTrain}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-purple-500/30"
        >
          + Train 🚂
        </button>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-900/40">
        <canvas
          ref={canvasRef}
          className="w-full cursor-pointer"
          style={{ height: "min(70vh, 600px)", background: "#1a0a2e" }}
          id="train-crash-canvas"
        />
        <div className="absolute bottom-3 right-3 text-purple-400/50 text-xs font-bold pointer-events-none select-none">
          Click anywhere to add trains!
        </div>
      </div>

      {/* Leaderboard toggle + Save */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-5 py-2 rounded-full font-bold hover:scale-105 transition-transform active:scale-95 shadow-lg"
        >
          🏆 {showLeaderboard ? "Hide" : "Show"} Leaderboard
        </button>
        <button
          onClick={saveScore}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2 rounded-full font-bold hover:scale-105 transition-transform active:scale-95 shadow-lg"
        >
          💾 Save Score
        </button>
      </div>

      {/* Leaderboard panel */}
      {showLeaderboard && (
        <div className="bg-purple-900/60 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-4 max-w-md mx-auto">
          <h3 className="text-center text-lg font-black text-yellow-400 mb-3">🏆 Top Scores</h3>
          {leaderboard.length === 0 ? (
            <p className="text-center text-purple-300 text-sm">No scores yet! Play and save your score.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-purple-300 border-b border-purple-500/30">
                  <th className="pb-2 text-left">#</th>
                  <th className="pb-2 text-center">💥 Crashes</th>
                  <th className="pb-2 text-center">✅ Safe</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr key={i} className="text-purple-200 border-b border-purple-500/10">
                    <td className="py-1.5 font-bold text-yellow-400">{i + 1}</td>
                    <td className="py-1.5 text-center text-red-400 font-bold">{entry.crashes}</td>
                    <td className="py-1.5 text-center text-green-400 font-bold">{entry.safeCrossings}</td>
                    <td className="py-1.5 text-right text-purple-400">{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-purple-200 shadow-sm">
          <div className="text-2xl mb-1">🚂</div>
          <p className="text-xs font-bold text-purple-700">Trains & Vehicles</p>
          <p className="text-xs text-purple-400">All spawn automatically!</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-purple-200 shadow-sm">
          <div className="text-2xl mb-1">🛑</div>
          <p className="text-xs font-bold text-purple-700">Stuck Trucks</p>
          <p className="text-xs text-purple-400">Trucks get stuck on tracks!</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-purple-200 shadow-sm">
          <div className="text-2xl mb-1">💥</div>
          <p className="text-xs font-bold text-purple-700">Epic Crashes</p>
          <p className="text-xs text-purple-400">Trains smash into everything!</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-purple-200 shadow-sm">
          <div className="text-2xl mb-1">🏆</div>
          <p className="text-xs font-bold text-purple-700">Leaderboard</p>
          <p className="text-xs text-purple-400">Save scores & compete!</p>
        </div>
      </div>
    </div>
  );
}

// ─── Drawing Helpers ─────────────────────────────────────────────────
function drawLocomotive(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, facingRight: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(-TRAIN_W / 2 + 2, -TRAIN_H / 2 + 4, TRAIN_W, TRAIN_H);

  // Body
  const bodyGrad = ctx.createLinearGradient(0, -TRAIN_H / 2, 0, TRAIN_H / 2);
  bodyGrad.addColorStop(0, lightenColor(color, 40));
  bodyGrad.addColorStop(1, color);
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -TRAIN_W / 2, -TRAIN_H / 2, TRAIN_W, TRAIN_H, 5);
  ctx.fill();

  // Cabin window stripe
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(-TRAIN_W / 2 + 4, -TRAIN_H / 2 + 3, TRAIN_W - 8, 6);

  // Windows
  ctx.fillStyle = "rgba(200, 230, 255, 0.8)";
  for (let w = 0; w < 3; w++) {
    ctx.fillRect(-TRAIN_W / 2 + 6 + w * 14, -TRAIN_H / 2 + 4, 8, 4);
  }

  // Chimney
  const chimDir = facingRight ? 1 : -1;
  ctx.fillStyle = darkenColor(color, 30);
  ctx.fillRect(chimDir * (TRAIN_W / 2 - 12), -TRAIN_H / 2 - 8, 8, 10);

  // Front bumper
  ctx.fillStyle = "#555";
  ctx.fillRect(chimDir * (TRAIN_W / 2 - 2), -TRAIN_H / 2 + 2, 4, TRAIN_H - 4);

  // Wheels
  ctx.fillStyle = "#333";
  for (const wx of [-TRAIN_W / 2 + 10, 0, TRAIN_W / 2 - 10]) {
    ctx.beginPath();
    ctx.arc(wx, TRAIN_H / 2, WHEEL_R, 0, Math.PI * 2);
    ctx.fill();
  }

  // Headlight
  ctx.beginPath();
  ctx.arc(chimDir * (TRAIN_W / 2 + 1), 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#FBBF24";
  ctx.fill();

  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const cw = TRAIN_W - 8;
  const ch = TRAIN_H - 2;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(-cw / 2 + 2, -ch / 2 + 3, cw, ch);

  // Body
  const grad = ctx.createLinearGradient(0, -ch / 2, 0, ch / 2);
  grad.addColorStop(0, lightenColor(color, 30));
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 4);
  ctx.fill();

  // Roof stripe
  ctx.fillStyle = darkenColor(color, 20);
  ctx.fillRect(-cw / 2 + 2, -ch / 2, cw - 4, 3);

  // Windows
  ctx.fillStyle = "rgba(200, 230, 255, 0.7)";
  const windowSpacing = (cw - 8) / 3;
  for (let w = 0; w < 3; w++) {
    ctx.fillRect(-cw / 2 + 4 + w * windowSpacing, -ch / 2 + 5, 7, 5);
  }

  // Wheels
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(-cw / 2 + 8, ch / 2, WHEEL_R - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cw / 2 - 8, ch / 2, WHEEL_R - 1, 0, Math.PI * 2);
  ctx.fill();

  // Coupling
  ctx.fillStyle = "#666";
  ctx.fillRect(-cw / 2 - 4, -2, 4, 4);
  ctx.fillRect(cw / 2, -2, 4, 4);

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
  const b = Math.min(255, (num & 0x0000FF) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  const b = Math.max(0, (num & 0x0000FF) - amount);
  return `rgb(${r},${g},${b})`;
}

// ─── Road Vehicle Drawing ────────────────────────────────────────────
function drawRoadVehicle(ctx: CanvasRenderingContext2D, v: RoadVehicle, frame: number) {
  ctx.save();
  ctx.translate(v.x, v.y);
  if (v.derailed) ctx.rotate(v.derailAngle);

  const hw = v.width / 2;
  const hh = v.height / 2;

  // Stopped truck blink
  if (v.stopped && Math.floor(frame / 10) % 2 === 0) {
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 3;
    roundRect(ctx, -hw - 3, -hh - 3, v.width + 6, v.height + 6, 5);
    ctx.stroke();
  }

  if (v.type === "car") {
    // Car body
    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    grad.addColorStop(0, lightenColor(v.color, 30));
    grad.addColorStop(1, v.color);
    ctx.fillStyle = grad;
    roundRect(ctx, -hw, -hh, v.width, v.height, 4);
    ctx.fill();
    // Windshield
    ctx.fillStyle = "rgba(200, 230, 255, 0.8)";
    ctx.fillRect(-hw + 4, -hh + 2, 8, v.height - 4);
    ctx.fillRect(hw - 10, -hh + 2, 6, v.height - 4);
    // Wheels
    ctx.fillStyle = "#222";
    ctx.fillRect(-hw + 2, hh - 2, 6, 3);
    ctx.fillRect(hw - 8, hh - 2, 6, 3);
    ctx.fillRect(-hw + 2, -hh - 1, 6, 3);
    ctx.fillRect(hw - 8, -hh - 1, 6, 3);
    // Headlights
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(v.direction > 0 ? hw - 2 : -hw, -3, 3, 6);
  } else if (v.type === "truck") {
    // Cab
    const cabW = v.width * 0.35;
    const cabX = v.direction > 0 ? hw - cabW : -hw;
    ctx.fillStyle = v.color;
    roundRect(ctx, cabX, -hh, cabW, v.height, 3);
    ctx.fill();
    // Windshield
    ctx.fillStyle = "rgba(200, 230, 255, 0.8)";
    const wsX = v.direction > 0 ? hw - cabW + 2 : -hw + 2;
    ctx.fillRect(wsX, -hh + 2, cabW - 4, v.height - 4);
    // Cargo box
    const cargoX = v.direction > 0 ? -hw : -hw + cabW;
    const cargoW = v.width - cabW;
    ctx.fillStyle = darkenColor(v.color, 30);
    ctx.fillRect(cargoX, -hh + 1, cargoW, v.height - 2);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cargoX, -hh + 1, cargoW, v.height - 2);
    // Wheels
    ctx.fillStyle = "#222";
    ctx.fillRect(-hw + 2, hh - 2, 8, 3);
    ctx.fillRect(hw - 10, hh - 2, 8, 3);
    ctx.fillRect(0, hh - 2, 6, 3);
    ctx.fillRect(-hw + 2, -hh - 1, 8, 3);
    ctx.fillRect(hw - 10, -hh - 1, 8, 3);
    // Headlights
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(v.direction > 0 ? hw - 2 : -hw, -3, 3, 6);
  } else {
    // Tram — elongated rectangle with stripes
    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    grad.addColorStop(0, lightenColor(v.color, 20));
    grad.addColorStop(1, v.color);
    ctx.fillStyle = grad;
    roundRect(ctx, -hw, -hh, v.width, v.height, 3);
    ctx.fill();
    // Stripe
    ctx.fillStyle = darkenColor(v.color, 30);
    ctx.fillRect(-hw + 2, -1, v.width - 4, 2);
    // Windows
    ctx.fillStyle = "rgba(200, 230, 255, 0.7)";
    for (let w = 0; w < 5; w++) {
      ctx.fillRect(-hw + 4 + w * (v.width - 8) / 5, -hh + 2, 6, v.height - 4);
    }
    // Pantograph (top wire)
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -hh);
    ctx.lineTo(-3, -hh - 8);
    ctx.lineTo(3, -hh - 8);
    ctx.lineTo(0, -hh);
    ctx.stroke();
  }

  ctx.restore();
}
