import { describe, it, expect } from 'vitest';
import { railSpan } from './rail';

describe('railSpan', () => {
	it('spans the first dot to the last dot, not the whole rail', () => {
		// Dots at 10/110/310 on a 500px rail: the track stops at the last dot,
		// leaving that role's bullets (310→500) hanging below it.
		const s = railSpan([10, 110, 310], 500);
		expect(s.top).toBe(10);
		expect(s.height).toBe(300);
		expect(s.to).toBe(0.62);
	});

	it('completes before the rail bottom reaches the viewport centre', () => {
		// The bug this guards: `to` of 1 means the fill only finishes once the last
		// role has scrolled well past centre.
		expect(railSpan([10, 310], 500).to).toBeLessThan(1);
	});

	it('starts the fill at the first dot rather than the rail edge', () => {
		expect(railSpan([50, 450], 500).from).toBe(0.1);
	});

	it('keeps a non-empty progress range for a single dot', () => {
		const s = railSpan([10], 500);
		expect(s.height).toBe(0);
		expect(s.to).toBeGreaterThan(s.from);
	});

	it('survives an unmeasured rail', () => {
		expect(railSpan([], 0)).toEqual({
			top: 0,
			height: 0,
			from: 0,
			to: 1,
			stops: [],
		});
		expect(railSpan([10, 20], 0).to).toBeGreaterThan(0);
	});

	describe('stops', () => {
		it("puts the first dot at the line's head and the last at its end", () => {
			const { stops } = railSpan([10, 110, 310], 500);
			expect(stops[0]).toBe(0);
			expect(stops[stops.length - 1]).toBe(1);
		});

		it('places middle dots proportionally along the track', () => {
			// 110 sits a third of the way between 10 and 310.
			expect(railSpan([10, 110, 310], 500).stops[1]).toBeCloseTo(1 / 3);
		});

		it('does not light a dot before the line reaches it', () => {
			// The regression: a tall role lit its dot while the fill was at 5%.
			const { stops } = railSpan([10, 110, 310], 500);
			const reachedAt = (fill: number) => stops.filter(s => fill >= s).length;
			expect(reachedAt(0.05)).toBe(1);
			expect(reachedAt(0.34)).toBe(2);
			expect(reachedAt(1)).toBe(3);
		});

		it('gives every dot a stop, even when unscrubbable', () => {
			expect(railSpan([10], 500).stops).toEqual([0]);
			expect(railSpan([10, 10], 500).stops).toEqual([0, 0]);
		});
	});
});
