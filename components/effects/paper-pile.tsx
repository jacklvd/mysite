'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useReducedMotion } from 'framer-motion';
import {
	aabb,
	columnSpan,
	floorMap,
	stamp,
	surfaceY,
	topmostAt,
} from '@/lib/effects/paper-pile';

// Torn scraps of paper that fall and stack, in the same cream-and-washi
// language as the cover stickers. Click empty space to drop a new scrap, or
// pick one up and drag it — on release it falls and re-stacks wherever it
// lands. The stacking maths lives in lib/effects/paper-pile.ts; this file is
// the canvas around it.

const COL_W = 6; // height-map resolution, in px
const GRAVITY = 1400; // px/s²
const SEED = 11; // scraps that drop on their own, before any interaction
const MAX = 70; // hard cap; older scraps are swept out beyond it
const DROP_MS = 260;

interface Scrap {
	x: number;
	y: number;
	w: number;
	h: number;
	rot: number;
	vy: number;
	vr: number;
	tone: number;
	jitter: number[];
	settled: boolean;
	dragging: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeScrap(x: number, y: number): Scrap {
	return {
		x,
		y,
		w: rand(34, 76),
		h: rand(20, 34),
		rot: rand(-0.22, 0.22),
		vy: rand(0, 40),
		vr: rand(-0.5, 0.5),
		tone: Math.random(),
		// Fixed per scrap so the torn edge doesn't shimmer between frames.
		jitter: Array.from({ length: 8 }, () => rand(-2.2, 2.2)),
		settled: false,
		dragging: false,
	};
}

export function PaperPile({ className = '' }: { className?: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { resolvedTheme } = useTheme();
	const reduced = useReducedMotion();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dark = resolvedTheme === 'dark';
		// Paper stays cream in both themes, like the guestbook notes and stickers,
		// so the ink on it can be a constant dark.
		const tones = [
			'#f6f1e9',
			'#efe6d6',
			'#e6dcc9',
			'#c4685a',
			'#6fa89e',
			'#a07896',
		];
		const edge = dark ? 'rgba(0,0,0,0.45)' : 'rgba(41,37,33,0.28)';
		const shade = dark ? 'rgba(0,0,0,0.5)' : 'rgba(41,37,33,0.16)';

		let scraps: Scrap[] = [];
		let heights: number[] = [];
		let columns = 0;
		let w = 0;
		let h = 0;

		const reset = () => {
			const rect = canvas.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			w = rect.width;
			h = rect.height;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			columns = Math.max(1, Math.ceil(w / COL_W));
			heights = floorMap(columns, h);
			scraps = [];
		};

		// Re-derive the height map from whatever is currently settled. Needed any
		// time a scrap leaves the pile — swept out at the cap, or picked up — since
		// the map only ever records surfaces going up and cannot un-stamp one.
		const rebuild = () => {
			heights = floorMap(columns, h);
			for (const s of scraps) {
				if (!s.settled || s.dragging) continue;
				const { hw, hh } = aabb(s.w, s.h, s.rot);
				const [c0, c1] = columnSpan(s.x, hw, COL_W, columns);
				stamp(heights, c0, c1, s.y - hh);
			}
		};

		// Drop a scrap in, sweeping out the oldest once the pile is at its cap.
		const add = (x: number, instant = false) => {
			if (scraps.length >= MAX) {
				scraps.shift();
				rebuild();
			}

			const s = makeScrap(x, -40);
			if (instant) settle(s);
			scraps.push(s);
		};

		const settle = (s: Scrap) => {
			const { hw, hh } = aabb(s.w, s.h, s.rot);
			const [c0, c1] = columnSpan(s.x, hw, COL_W, columns);
			s.y = surfaceY(heights, c0, c1) - hh;
			s.vy = 0;
			s.vr = 0;
			s.settled = true;
			stamp(heights, c0, c1, s.y - hh);
		};

		const draw = () => {
			ctx.clearRect(0, 0, w, h);
			for (const s of scraps) {
				const hw = s.w / 2;
				const hh = s.h / 2;
				const j = s.jitter;
				ctx.save();
				ctx.translate(s.x, s.y);
				ctx.rotate(s.rot);

				ctx.beginPath();
				// Corners and edge midpoints, each nudged by the scrap's own fixed
				// jitter — a torn edge rather than a crisp rectangle.
				ctx.moveTo(-hw + j[0], -hh + j[1]);
				ctx.lineTo(0, -hh + j[2]);
				ctx.lineTo(hw + j[3], -hh + j[1]);
				ctx.lineTo(hw + j[3], 0);
				ctx.lineTo(hw + j[4], hh + j[5]);
				ctx.lineTo(0, hh + j[6]);
				ctx.lineTo(-hw + j[0], hh + j[7]);
				ctx.lineTo(-hw + j[2], 0);
				ctx.closePath();

				ctx.shadowColor = shade;
				ctx.shadowBlur = 6;
				ctx.shadowOffsetY = 2;
				ctx.fillStyle = tones[Math.floor(s.tone * tones.length)];
				ctx.fill();

				ctx.shadowColor = 'transparent';
				ctx.lineWidth = 1;
				ctx.strokeStyle = edge;
				ctx.stroke();
				ctx.restore();
			}
		};

		reset();

		// Reduced motion: build the pile without ever animating it. Same picture,
		// no movement.
		if (reduced) {
			for (let i = 0; i < SEED; i++) add(rand(w * 0.12, w * 0.88), true);
			draw();
			const ro = new ResizeObserver(() => {
				reset();
				for (let i = 0; i < SEED; i++) add(rand(w * 0.12, w * 0.88), true);
				draw();
			});
			ro.observe(canvas);
			return () => ro.disconnect();
		}

		let raf = 0;
		let last = 0;
		let sinceDrop = 0;
		let dropped = 0;
		let onscreen = true;

		const frame = (now: number) => {
			// Clamp: the loop is parked offscreen, so the first frame back would
			// otherwise carry the whole paused span and drop every scrap through the
			// floor before a collision check could run.
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;

			if (dropped < SEED) {
				sinceDrop += dt * 1000;
				if (sinceDrop > DROP_MS) {
					sinceDrop = 0;
					dropped++;
					add(rand(w * 0.12, w * 0.88));
				}
			}

			for (const s of scraps) {
				if (s.settled || s.dragging) continue;
				s.vy += GRAVITY * dt;
				s.y += s.vy * dt;
				s.rot += s.vr * dt;
				const { hw, hh } = aabb(s.w, s.h, s.rot);
				const [c0, c1] = columnSpan(s.x, hw, COL_W, columns);
				if (s.y + hh >= surfaceY(heights, c0, c1)) settle(s);
			}

			draw();
			raf = requestAnimationFrame(frame);
		};

		const start = () => {
			if (raf) return;
			last = performance.now();
			raf = requestAnimationFrame(frame);
		};
		const stop = () => {
			cancelAnimationFrame(raf);
			raf = 0;
		};

		const io = new IntersectionObserver(([e]) => {
			onscreen = e.isIntersecting;
			if (onscreen) start();
			else stop();
		});
		io.observe(canvas);

		const ro = new ResizeObserver(() => {
			reset();
			dropped = 0;
		});
		ro.observe(canvas);

		// ── Dragging ────────────────────────────────────────────────────────
		let held: Scrap | null = null;
		let grabX = 0;
		let grabY = 0;

		const at = (e: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			return { x: e.clientX - rect.left, y: e.clientY - rect.top };
		};

		const onPointerDown = (e: PointerEvent) => {
			const { x, y } = at(e);
			const i = topmostAt(scraps, x, y);

			if (i === -1) {
				add(x);
			} else {
				// Lift it out of the pile: off the height map, and moved to the end of
				// the array so it draws over everything while held.
				held = scraps[i];
				grabX = x - held.x;
				grabY = y - held.y;
				held.dragging = true;
				held.settled = false;
				held.vy = 0;
				held.vr = 0;

				// Anything that was resting on top of it has just lost its support, so
				// un-settle it and let gravity close the gap. Without this the pile
				// keeps a hole with scraps floating over it.
				// dev-note: freed scraps only fall straight down — they never slide
				// sideways into the hole. Good enough for paper, which interlocks;
				// needs real contact resolution if scraps ever get smaller than the
				// gaps they leave.
				const box = aabb(held.w, held.h, held.rot);
				const [h0, h1] = columnSpan(held.x, box.hw, COL_W, columns);
				for (const s of scraps) {
					if (!s.settled || s === held || s.y >= held.y) continue;
					const b = aabb(s.w, s.h, s.rot);
					const [s0, s1] = columnSpan(s.x, b.hw, COL_W, columns);
					if (s0 <= h1 && s1 >= h0) s.settled = false;
				}

				scraps.splice(i, 1);
				scraps.push(held);
				rebuild();
				// Keeps the drag alive when the pointer leaves the canvas. Throws if
				// the id is not an active pointer, which must not abandon the grab.
				try {
					canvas.setPointerCapture(e.pointerId);
				} catch {}
			}

			if (onscreen) start();
		};

		const onPointerMove = (e: PointerEvent) => {
			if (!held) return;
			const { x, y } = at(e);
			held.x = x - grabX;
			held.y = y - grabY;
		};

		// Let go and it simply falls from where it was released, re-stacking on
		// whatever is under it.
		const onPointerUp = (e: PointerEvent) => {
			if (!held) return;
			held.dragging = false;
			held.vy = 0;
			held = null;
			try {
				if (canvas.hasPointerCapture(e.pointerId))
					canvas.releasePointerCapture(e.pointerId);
			} catch {}
		};

		canvas.addEventListener('pointerdown', onPointerDown);
		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerup', onPointerUp);
		canvas.addEventListener('pointercancel', onPointerUp);

		start();
		return () => {
			stop();
			io.disconnect();
			ro.disconnect();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerup', onPointerUp);
			canvas.removeEventListener('pointercancel', onPointerUp);
		};
	}, [resolvedTheme, reduced]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden
			className={`w-full cursor-grab touch-none active:cursor-grabbing select-none ${className}`}
		/>
	);
}
