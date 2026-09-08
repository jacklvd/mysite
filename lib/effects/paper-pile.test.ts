import { describe, it, expect } from 'vitest';
import {
	columnSpan,
	surfaceY,
	stamp,
	aabb,
	floorMap,
	containsPoint,
	topmostAt,
} from './paper-pile';

describe('columnSpan', () => {
	it('covers the columns the scrap actually overlaps', () => {
		expect(columnSpan(50, 20, 10, 10)).toEqual([3, 7]);
	});

	it('clamps a scrap hanging off either edge', () => {
		expect(columnSpan(2, 20, 10, 10)).toEqual([0, 2]);
		expect(columnSpan(98, 20, 10, 10)).toEqual([7, 9]);
	});
});

describe('surfaceY', () => {
	it('returns the highest surface under the scrap, not the average', () => {
		// A scrap bridging a bump rests ON the bump.
		expect(surfaceY([100, 100, 60, 100], 0, 3)).toBe(60);
	});

	it('ignores columns the scrap does not span', () => {
		expect(surfaceY([10, 100, 100, 10], 1, 2)).toBe(100);
	});
});

describe('stamp', () => {
	it('raises only the columns the scrap covers', () => {
		const h = floorMap(4, 100);
		stamp(h, 1, 2, 80);
		expect(h).toEqual([100, 80, 80, 100]);
	});

	it('never lowers a surface that is already higher', () => {
		const h = [100, 40, 100];
		stamp(h, 0, 2, 80);
		expect(h).toEqual([80, 40, 80]);
	});
});

describe('stacking end to end', () => {
	it('lands a second scrap on top of the first', () => {
		const floor = 200;
		const h = floorMap(10, floor);
		const { hw, hh } = aabb(30, 20, 0);

		const [a0, a1] = columnSpan(50, hw, 10, 10);
		const restA = surfaceY(h, a0, a1) - hh;
		stamp(h, a0, a1, restA - hh);

		const [b0, b1] = columnSpan(50, hw, 10, 10);
		const restB = surfaceY(h, b0, b1) - hh;

		expect(restA).toBe(floor - hh);
		// Exactly one scrap-height higher, i.e. resting on the first.
		expect(restA - restB).toBe(20);
	});

	it('lets a scrap fall to the floor beside the pile', () => {
		const floor = 200;
		const h = floorMap(20, floor);
		stamp(h, 0, 4, 100);
		const { hw, hh } = aabb(20, 20, 0);
		const [c0, c1] = columnSpan(150, hw, 10, 20);
		expect(surfaceY(h, c0, c1) - hh).toBe(floor - hh);
	});
});

describe('aabb', () => {
	it('is the rectangle itself when unrotated', () => {
		expect(aabb(30, 20, 0)).toEqual({ hw: 15, hh: 10 });
	});

	it('grows both extents once tilted', () => {
		const box = aabb(30, 20, Math.PI / 6);
		expect(box.hw).toBeGreaterThan(15);
		expect(box.hh).toBeGreaterThan(10);
	});
});

describe('containsPoint', () => {
	const flat = { x: 100, y: 100, w: 40, h: 20, rot: 0 };

	it('hits the centre and misses well outside', () => {
		expect(containsPoint(flat, 100, 100)).toBe(true);
		expect(containsPoint(flat, 200, 100)).toBe(false);
	});

	it('respects the scrap edges', () => {
		expect(containsPoint(flat, 119, 100)).toBe(true);
		expect(containsPoint(flat, 121, 100)).toBe(false);
		expect(containsPoint(flat, 100, 109)).toBe(true);
		expect(containsPoint(flat, 100, 111)).toBe(false);
	});

	it('follows the tilt rather than the bounding box', () => {
		const tilted = { ...flat, rot: Math.PI / 2 };
		// Rotated upright: the old horizontal reach is now empty space...
		expect(containsPoint(tilted, 119, 100)).toBe(false);
		// ...and the vertical reach is now inside it.
		expect(containsPoint(tilted, 100, 119)).toBe(true);
	});
});

describe('topmostAt', () => {
	const at = (x: number) => ({ x, y: 100, w: 40, h: 20, rot: 0 });

	it('returns the last drawn of two overlapping scraps', () => {
		expect(topmostAt([at(100), at(105)], 102, 100)).toBe(1);
	});

	it('falls through to a lower scrap outside the top one', () => {
		expect(topmostAt([at(100), at(160)], 90, 100)).toBe(0);
	});

	it('returns -1 on empty space', () => {
		expect(topmostAt([at(100)], 300, 100)).toBe(-1);
	});
});
