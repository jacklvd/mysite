'use client';
import { useEffect, useRef } from 'react';
import {
	createGame,
	launch,
	movePaddle,
	step,
	W,
	H,
	type Game,
} from '@/lib/breakout/engine';
import { seededRandom } from '@/lib/seeded-random';

// Things worth smashing. Bricks cycle through these.
const LABELS = [
	'bug',
	'TODO',
	'typo',
	'null',
	'CORS',
	'flaky test',
	'off-by-one',
	'deadline',
	'merge conflict',
	'lag',
];

const KEY_SPEED = 520; // px/s for arrow-key paddle movement

// Canvas breakout drawn like a margin doodle: inked boxes for bricks, a pencil
// for the paddle, an ink blot for the ball. Rules live in lib/breakout/engine;
// this only handles input and drawing. Colors and fonts are read from the
// theme each frame, so it follows light/dark mode live.
export function Breakout() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = W * dpr;
		canvas.height = H * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		let game: Game = createGame(LABELS);
		// Theme palette is cached and refreshed only when <html> changes theme
		// (next-themes toggles its class), not read every frame.
		let palette = themeColors();
		const themeWatch = new MutationObserver(() => (palette = themeColors()));
		themeWatch.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class', 'style'],
		});
		const keys = { left: false, right: false };
		let raf = 0;
		let last = performance.now();

		const toGameX = (clientX: number) => {
			const r = canvas.getBoundingClientRect();
			return ((clientX - r.left) / r.width) * W;
		};
		const act = () => {
			if (game.status === 'won' || game.status === 'lost')
				game = createGame(LABELS);
			else launch(game);
		};

		const onPointerMove = (e: PointerEvent) =>
			movePaddle(game, toGameX(e.clientX));
		const onPointerDown = (e: PointerEvent) => {
			movePaddle(game, toGameX(e.clientX));
			canvas.focus({ preventScroll: true });
			act();
		};
		const onKey = (e: KeyboardEvent) => {
			const down = e.type === 'keydown';
			if (e.key === 'ArrowLeft') keys.left = down;
			else if (e.key === 'ArrowRight') keys.right = down;
			else if (e.key === ' ' && down) act();
			else return;
			e.preventDefault();
		};

		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerdown', onPointerDown);
		canvas.addEventListener('keydown', onKey);
		canvas.addEventListener('keyup', onKey);
		canvas.focus({ preventScroll: true });

		const frame = (now: number) => {
			const dt = (now - last) / 1000;
			last = now;
			const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
			if (dir)
				movePaddle(
					game,
					game.paddle.x + game.paddle.w / 2 + dir * KEY_SPEED * dt
				);
			step(game, dt);
			draw(ctx, game, palette);
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(raf);
			themeWatch.disconnect();
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('keydown', onKey);
			canvas.removeEventListener('keyup', onKey);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			tabIndex={0}
			aria-label="Breakout game. Move the pencil with the mouse or arrow keys; click or press Space to launch the ink blot."
			className="block aspect-[640/420] w-full cursor-none touch-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
		/>
	);
}

// ── Drawing ─────────────────────────────────────────────────────────────────

function themeColors() {
	const root = getComputedStyle(document.documentElement);
	const body = getComputedStyle(document.body);
	const v = (name: string) => `hsl(${root.getPropertyValue(name).trim()})`;
	return {
		ink: v('--foreground'),
		blue: v('--primary'),
		red: v('--ink-red'),
		muted: v('--muted-foreground'),
		hand: body.getPropertyValue('--font-hand') || 'cursive',
		type: body.getPropertyValue('--font-type') || 'monospace',
	};
}

// A slightly crooked rectangle, the same crook every frame for a given seed.
function inkedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	seed: number
) {
	const j = (n: number) => (seededRandom(seed * 8 + n) - 0.5) * 3;
	ctx.beginPath();
	ctx.moveTo(x + j(0), y + j(1));
	ctx.lineTo(x + w + j(2), y + j(3));
	ctx.lineTo(x + w + j(4), y + h + j(5));
	ctx.lineTo(x + j(6), y + h + j(7));
	ctx.closePath();
}

function draw(
	ctx: CanvasRenderingContext2D,
	g: Game,
	c: ReturnType<typeof themeColors>
) {
	ctx.clearRect(0, 0, W, H);
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';

	// HUD
	ctx.fillStyle = c.muted;
	ctx.font = `13px ${c.type}`;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.fillText(`score ${g.score}`, 24, 26);
	ctx.textAlign = 'right';
	ctx.fillText(
		`ink ${'●'.repeat(g.lives)}${'○'.repeat(3 - g.lives)}`,
		W - 24,
		26
	);

	// Bricks
	ctx.font = `600 15px ${c.hand}`;
	ctx.textAlign = 'center';
	g.bricks.forEach((k, i) => {
		if (!k.alive) return;
		const row = Math.floor(i / 8);
		inkedRect(ctx, k.x, k.y, k.w, k.h, i);
		ctx.globalAlpha = 0.14;
		ctx.fillStyle = row % 2 ? c.red : c.blue;
		ctx.fill();
		ctx.globalAlpha = 1;
		ctx.strokeStyle = c.ink;
		ctx.lineWidth = 1.6;
		ctx.stroke();
		ctx.fillStyle = row % 2 ? c.red : c.blue;
		ctx.fillText(k.label, k.x + k.w / 2, k.y + k.h / 2 + 1, k.w - 8);
	});

	// Pencil paddle: eraser, yellow body, wood cone, graphite tip
	const p = g.paddle;
	ctx.lineWidth = 1.4;
	ctx.strokeStyle = c.ink;
	ctx.fillStyle = '#f2a7a0';
	ctx.fillRect(p.x, p.y, 12, p.h);
	ctx.strokeRect(p.x, p.y, 12, p.h);
	ctx.fillStyle = '#f2c14e';
	ctx.fillRect(p.x + 12, p.y, p.w - 30, p.h);
	ctx.strokeRect(p.x + 12, p.y, p.w - 30, p.h);
	ctx.beginPath();
	ctx.moveTo(p.x + p.w - 18, p.y);
	ctx.lineTo(p.x + p.w, p.y + p.h / 2);
	ctx.lineTo(p.x + p.w - 18, p.y + p.h);
	ctx.closePath();
	ctx.fillStyle = '#e8c9a0';
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(p.x + p.w - 6, p.y + p.h / 2 - 2);
	ctx.lineTo(p.x + p.w, p.y + p.h / 2);
	ctx.lineTo(p.x + p.w - 6, p.y + p.h / 2 + 2);
	ctx.fillStyle = c.ink;
	ctx.fill();

	// Ink blot ball
	ctx.beginPath();
	ctx.arc(g.ball.x, g.ball.y, g.ball.r, 0, Math.PI * 2);
	ctx.fillStyle = c.blue;
	ctx.fill();

	// Status note
	const note =
		g.status === 'ready'
			? 'click or press space to launch'
			: g.status === 'won'
				? 'every bug squashed ✦ click to play again'
				: g.status === 'lost'
					? 'out of ink — click to try again'
					: '';
	if (note) {
		ctx.font = `600 24px ${c.hand}`;
		ctx.fillStyle = c.red;
		ctx.textAlign = 'center';
		ctx.fillText(note, W / 2, H - 80);
	}
}
