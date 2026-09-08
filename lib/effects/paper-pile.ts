// Stacking maths for the paper-scrap pile.
//
// Real rigid-body physics is overkill for scraps that only ever fall straight
// down: this uses a height map instead. The canvas is divided into columns, and
// each column remembers the y of whatever surface is on top of it (the floor,
// to begin with). A falling scrap settles the moment its underside reaches the
// highest surface under its own width, then stamps its own top into those
// columns so the next scrap lands on it. Canvas y grows downward, so "highest
// surface" means the SMALLEST y.

/** Columns a scrap spans, clamped to the map. `cx` is its centre. */
export function columnSpan(
	cx: number,
	halfWidth: number,
	colWidth: number,
	columns: number
): [number, number] {
	const clamp = (n: number) => Math.min(columns - 1, Math.max(0, n));
	return [
		clamp(Math.floor((cx - halfWidth) / colWidth)),
		clamp(Math.floor((cx + halfWidth) / colWidth)),
	];
}

/** The y a scrap spanning c0..c1 would come to rest against. */
export function surfaceY(heights: number[], c0: number, c1: number): number {
	let top = Infinity;
	for (let i = c0; i <= c1; i++) if (heights[i] < top) top = heights[i];
	return top;
}

/** Record a scrap's top edge, so later scraps land on it. */
export function stamp(
	heights: number[],
	c0: number,
	c1: number,
	top: number
): void {
	for (let i = c0; i <= c1; i++) if (top < heights[i]) heights[i] = top;
}

/**
 * Half-extents of a rotated rectangle's axis-aligned bounding box. The pile
 * stacks on AABBs rather than true corners — at the tilts scraps use (±12°) the
 * difference reads as a bit of air between sheets, which is what a real pile of
 * paper looks like anyway.
 */
export function aabb(w: number, h: number, rot: number) {
	const s = Math.abs(Math.sin(rot));
	const c = Math.abs(Math.cos(rot));
	return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
}

/** A fresh height map where every column is the floor. */
export function floorMap(columns: number, floor: number): number[] {
	return new Array(columns).fill(floor);
}

/** The minimum a scrap must expose to be hit-tested. */
export interface Hittable {
	x: number;
	y: number;
	w: number;
	h: number;
	rot: number;
}

/**
 * Is (px, py) inside this scrap? The point is rotated back into the scrap's
 * own frame, so the test follows the tilt rather than its bounding box — the
 * AABB is right for stacking (paper sags together) but too sloppy for picking,
 * where it would grab a scrap through a visibly empty corner.
 */
export function containsPoint(s: Hittable, px: number, py: number): boolean {
	const dx = px - s.x;
	const dy = py - s.y;
	const cos = Math.cos(-s.rot);
	const sin = Math.sin(-s.rot);
	const lx = dx * cos - dy * sin;
	const ly = dx * sin + dy * cos;
	return Math.abs(lx) <= s.w / 2 && Math.abs(ly) <= s.h / 2;
}

/**
 * Index of the scrap under the point, or -1. Scraps are drawn in array order,
 * so the last match is the one actually visible — search from the top down.
 */
export function topmostAt(
	scraps: readonly Hittable[],
	px: number,
	py: number
): number {
	for (let i = scraps.length - 1; i >= 0; i--) {
		if (containsPoint(scraps[i], px, py)) return i;
	}
	return -1;
}
