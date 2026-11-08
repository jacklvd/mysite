import { describe, it, expect } from 'vitest';
import { createGame, launch, movePaddle, step, H } from './engine';

const run = (g: ReturnType<typeof createGame>, seconds: number) => {
	for (let t = 0; t < seconds; t += 1 / 60) step(g, 1 / 60);
};

describe('breakout engine', () => {
	it('keeps the ball on the paddle until launched', () => {
		const g = createGame(['bug']);
		movePaddle(g, 100);
		run(g, 1);
		expect(g.status).toBe('ready');
		expect(g.ball.x).toBe(g.paddle.x + g.paddle.w / 2);
	});

	it('breaks a brick and scores when the ball reaches the wall', () => {
		const g = createGame(['bug']);
		launch(g);
		run(g, 1.5);
		expect(g.bricks.some(b => !b.alive)).toBe(true);
		expect(g.score).toBeGreaterThan(0);
	});

	it('bounces off the paddle centre straight up', () => {
		const g = createGame(['bug']);
		g.status = 'playing';
		const cx = g.paddle.x + g.paddle.w / 2;
		Object.assign(g.ball, { x: cx, y: g.paddle.y - 20, vx: 0, vy: 300 });
		run(g, 0.2);
		expect(g.ball.vy).toBeLessThan(0);
		expect(Math.abs(g.ball.vx)).toBeLessThan(1);
	});

	it('loses a life when the ball falls past the paddle, then ends the game', () => {
		const g = createGame(['bug']);
		for (let i = 0; i < 3; i++) {
			g.status = 'playing';
			Object.assign(g.ball, { x: 5, y: H - 5, vx: 0, vy: 300 });
			movePaddle(g, 600); // paddle far away
			g.status = 'playing';
			run(g, 0.5);
		}
		expect(g.lives).toBe(0);
		expect(g.status).toBe('lost');
	});

	it('wins once every brick is gone', () => {
		const g = createGame(['bug']);
		g.bricks.forEach((b, i) => (b.alive = i === 0));
		const k = g.bricks[0];
		g.status = 'playing';
		Object.assign(g.ball, {
			x: k.x + k.w / 2,
			y: k.y + k.h + 20,
			vx: 0,
			vy: -300,
		});
		run(g, 0.3);
		expect(g.status).toBe('won');
	});
});
