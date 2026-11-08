// Breakout rules for the hidden "p. 06" page. Pure and DOM-free: the canvas
// component owns input + drawing and calls `step` each frame. Everything is in
// a fixed logical space (W×H); the canvas scales it to fit.

export const W = 640;
export const H = 420;

const COLS = 8;
const ROWS = 5;
const MARGIN = 24;
const GAP = 8;
const BRICK_H = 26;
const TOP = 56;
const BALL_R = 6;
const START_SPEED = 300; // px/s
const SPEED_STEP = 6; // added per brick, so the rally tightens
const MAX_BOUNCE = Math.PI / 3; // paddle edge sends the ball out at 60°
const SUBSTEP = 1 / 240; // small enough that the ball can't tunnel a brick
// 1px slack: paddle hits count if the ball was at most this far below its top
// last substep, and a resting ball floats this far above it so it isn't
// already touching on launch.
const PADDLE_SLACK = 1;

export type Brick = {
	x: number;
	y: number;
	w: number;
	h: number;
	label: string;
	alive: boolean;
};

export type Game = {
	bricks: Brick[];
	ball: { x: number; y: number; vx: number; vy: number; r: number };
	paddle: { x: number; y: number; w: number; h: number };
	speed: number;
	score: number;
	lives: number;
	status: 'ready' | 'playing' | 'won' | 'lost';
};

export function createGame(labels: string[]): Game {
	const w = (W - 2 * MARGIN - (COLS - 1) * GAP) / COLS;
	const bricks: Brick[] = [];
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++)
			bricks.push({
				x: MARGIN + c * (w + GAP),
				y: TOP + r * (BRICK_H + GAP),
				w,
				h: BRICK_H,
				label: labels[(r * COLS + c) % labels.length],
				alive: true,
			});

	const paddle = { x: W / 2 - 45, y: H - 28, w: 90, h: 10 };
	const g: Game = {
		bricks,
		ball: { x: 0, y: 0, vx: 0, vy: 0, r: BALL_R },
		paddle,
		speed: START_SPEED,
		score: 0,
		lives: 3,
		status: 'ready',
	};
	restOnPaddle(g);
	return g;
}

export function movePaddle(g: Game, centerX: number) {
	g.paddle.x = clamp(centerX - g.paddle.w / 2, 0, W - g.paddle.w);
	if (g.status === 'ready') restOnPaddle(g);
}

export function launch(g: Game) {
	if (g.status !== 'ready') return;
	g.status = 'playing';
	g.ball.vx = g.speed * Math.sin(-0.35);
	g.ball.vy = -g.speed * Math.cos(-0.35);
}

export function step(g: Game, dt: number) {
	if (g.status !== 'playing') return;
	// dev-note: fixed substeps; clamp dt so a backgrounded tab doesn't replay seconds
	let left = Math.min(dt, 0.05);
	while (left > 0 && g.status === 'playing') {
		const h = Math.min(SUBSTEP, left);
		tick(g, h);
		left -= h;
	}
}

function tick(g: Game, dt: number) {
	const b = g.ball;
	const px = b.x;
	const py = b.y;
	b.x += b.vx * dt;
	b.y += b.vy * dt;

	// Walls + ceiling
	if (b.x - b.r < 0) {
		b.x = b.r;
		b.vx = Math.abs(b.vx);
	}
	if (b.x + b.r > W) {
		b.x = W - b.r;
		b.vx = -Math.abs(b.vx);
	}
	if (b.y - b.r < 0) {
		b.y = b.r;
		b.vy = Math.abs(b.vy);
	}

	// Paddle: bounce angle depends on where it hit, not on the incoming angle
	const p = g.paddle;
	if (
		b.vy > 0 &&
		b.y + b.r >= p.y &&
		py + b.r <= p.y + PADDLE_SLACK &&
		b.x >= p.x - b.r &&
		b.x <= p.x + p.w + b.r
	) {
		const hit = clamp((b.x - (p.x + p.w / 2)) / (p.w / 2), -1, 1);
		const a = hit * MAX_BOUNCE;
		b.vx = g.speed * Math.sin(a);
		b.vy = -g.speed * Math.cos(a);
		b.y = p.y - b.r;
	}

	// Bricks: one per tick; flip the axis the ball came in on
	for (const k of g.bricks) {
		if (!k.alive || !circleHitsRect(b, k)) continue;
		k.alive = false;
		g.score += 10;
		const cameFromSide = px + b.r <= k.x || px - b.r >= k.x + k.w;
		const cameFromTopOrBottom = py + b.r <= k.y || py - b.r >= k.y + k.h;
		if (cameFromSide && !cameFromTopOrBottom) b.vx = -b.vx;
		else b.vy = -b.vy;
		g.speed += SPEED_STEP;
		const s = Math.hypot(b.vx, b.vy);
		b.vx *= g.speed / s;
		b.vy *= g.speed / s;
		if (g.bricks.every(x => !x.alive)) g.status = 'won';
		break;
	}

	// Floor: lose a life
	if (b.y - b.r > H) {
		g.lives -= 1;
		g.status = g.lives > 0 ? 'ready' : 'lost';
		restOnPaddle(g);
	}
}

function restOnPaddle(g: Game) {
	g.ball.x = g.paddle.x + g.paddle.w / 2;
	g.ball.y = g.paddle.y - g.ball.r - PADDLE_SLACK;
	g.ball.vx = 0;
	g.ball.vy = 0;
}

function circleHitsRect(
	c: { x: number; y: number; r: number },
	k: { x: number; y: number; w: number; h: number }
) {
	const nx = clamp(c.x, k.x, k.x + k.w);
	const ny = clamp(c.y, k.y, k.y + k.h);
	return (c.x - nx) ** 2 + (c.y - ny) ** 2 <= c.r * c.r;
}

function clamp(v: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(hi, v));
}
