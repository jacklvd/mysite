'use client';

// An ink-doodle companion that roams the page. It walks along the bottom of the
// viewport, watches your cursor, can be picked up and tossed (with gravity +
// bounce), perches on elements tagged `[data-pet-ledge]`, and chatters in little
// speech bubbles. Physics runs in a single requestAnimationFrame loop that writes
// the transform straight to the DOM (refs), so it never re-renders per frame —
// React state is only used for the discrete things you actually see change
// (animation mode, facing, blink, hat, speech bubble).
//
// Respects prefers-reduced-motion: the pet then just sits quietly in a corner
// and only reacts to clicks. Inspired by the "site pet" on meganyap.me.

import { useCallback, useEffect, useRef, useState } from 'react';
import { PetSprite, type PetMode } from './pet-sprite';
import {
	HAT_IDS,
	HAT_LABELS,
	HAT_STORAGE_KEY,
	HatShape,
	type HatId,
} from './hats';
import { QUIPS, idleQuipFor, pick } from './quips';

// ── Tunables ────────────────────────────────────────────────────────────────
const PET_W = 54;
const PET_H = 68;
const MARGIN = 4; // gap above the very bottom edge
const SPEED = 42; // walk speed, px/s
const GRAVITY = 2400; // px/s²
const FLOOR_BOUNCE = 0.28;
const WALL_BOUNCE = 0.5;
const GRAB_THRESHOLD = 6; // px of movement before a press becomes a drag
const JUMP_GAP = 160; // max horizontal gap the pet will leap across, px
const JUMP_RISE = 110; // max height difference for a leap, px
const POKE_KEY = 'pet-pokes';

type Ledge = { el: Element; top: number; left: number; right: number };

type Phys = {
	x: number;
	y: number; // top-left of the pet box, in viewport px
	vx: number;
	vy: number;
	onGround: boolean;
	perch: Ledge | null;
	walkDir: 1 | -1;
	pauseUntil: number;
	nextDecision: number;
	dizzyUntil: number;
	hopUntil: number;
	dragging: boolean;
	grabDX: number;
	grabDY: number;
};

const now = () => performance.now();
const clamp = (v: number, lo: number, hi: number) =>
	Math.max(lo, Math.min(hi, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export default function SitePet() {
	const [mounted, setMounted] = useState(false);
	const [reduced, setReduced] = useState(false);
	const [mode, setMode] = useState<PetMode>('idle');
	const [facing, setFacing] = useState<1 | -1>(1);
	const [grounded, setGrounded] = useState(true);
	const [blink, setBlink] = useState(false);
	const [speech, setSpeech] = useState<string | null>(null);
	const [hat, setHat] = useState<HatId>('none');
	const [menuOpen, setMenuOpen] = useState(false);

	const wrapRef = useRef<HTMLDivElement>(null);
	const p = useRef<Phys>({
		x: 120,
		y: 0,
		vx: 0,
		vy: 0,
		onGround: true,
		perch: null,
		walkDir: 1,
		pauseUntil: 0,
		nextDecision: 0,
		dizzyUntil: 0,
		hopUntil: 0,
		dragging: false,
		grabDX: 0,
		grabDY: 0,
	});

	const ledgesRef = useRef<Element[]>([]);
	const sectionRef = useRef<string | null>(null);
	const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const samples = useRef<{ t: number; x: number; y: number }[]>([]);
	const flips = useRef<number[]>([]);
	const lastDragX = useRef(0);
	const lastDragSign = useRef(0);
	const pokeWindow = useRef<{ count: number; until: number }>({
		count: 0,
		until: 0,
	});
	const pressed = useRef(false);
	const draggedThisPress = useRef(false);
	const pressStart = useRef({ x: 0, y: 0 });

	// Keep refs in sync with state we read inside the RAF loop without re-binding.
	const modeRef = useRef<PetMode>('idle');
	const facingRef = useRef<1 | -1>(1);
	const groundedRef = useRef(true);
	const setModeSafe = (m: PetMode) => {
		if (modeRef.current !== m) {
			modeRef.current = m;
			setMode(m);
		}
	};
	const setFacingSafe = (f: 1 | -1) => {
		if (facingRef.current !== f) {
			facingRef.current = f;
			setFacing(f);
		}
	};
	const setGroundedSafe = (g: boolean) => {
		if (groundedRef.current !== g) {
			groundedRef.current = g;
			setGrounded(g);
		}
	};

	const say = useCallback((text: string, ms = 2200) => {
		setSpeech(text);
		if (speechTimer.current) clearTimeout(speechTimer.current);
		speechTimer.current = setTimeout(() => setSpeech(null), ms);
	}, []);

	// ── Mount: load prefs, set initial position, wire everything up ────────────
	useEffect(() => {
		// Intentional mount guard: the pet renders nothing until mounted, so this
		// one-time flip is by design (same pattern as app/meet-jack/page.tsx).
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);

		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		setReduced(mq.matches);
		const onMq = (e: MediaQueryListEvent) => setReduced(e.matches);
		mq.addEventListener('change', onMq);

		try {
			const savedHat = localStorage.getItem(HAT_STORAGE_KEY) as HatId | null;
			if (savedHat && HAT_IDS.includes(savedHat)) setHat(savedHat);
		} catch {
			/* ignore */
		}

		const floorY = () => window.innerHeight - PET_H - MARGIN;
		p.current.x = clamp(window.innerWidth * 0.2, 0, window.innerWidth - PET_W);
		p.current.y = floorY();

		return () => {
			mq.removeEventListener('change', onMq);
			if (speechTimer.current) clearTimeout(speechTimer.current);
			if (idleTimer.current) clearTimeout(idleTimer.current);
		};
	}, []);

	// ── Reduced motion: park the pet in the corner, no physics ────────────────
	useEffect(() => {
		if (!mounted || !reduced) return;
		const place = () => {
			const el = wrapRef.current;
			if (!el) return;
			p.current.x = window.innerWidth - PET_W - 16;
			p.current.y = window.innerHeight - PET_H - MARGIN;
			el.style.transform = `translate(${p.current.x}px, ${p.current.y}px)`;
		};
		place();
		window.addEventListener('resize', place);
		return () => window.removeEventListener('resize', place);
	}, [mounted, reduced]);

	// ── Greet the visitor once per session (after the loader clears) ──────────
	useEffect(() => {
		if (!mounted) return;
		try {
			if (sessionStorage.getItem('pet-greeted')) return;
		} catch {
			/* ignore */
		}
		const t = setTimeout(() => {
			say(
				pick([
					'welcome! 🌟',
					'oh, hi! welcome',
					'hello, traveler ✨',
					'come on in!',
				]),
				2800
			);
			try {
				sessionStorage.setItem('pet-greeted', '1');
			} catch {
				/* ignore */
			}
		}, 1600);
		return () => clearTimeout(t);
	}, [mounted, say]);

	// ── Blink on a relaxed random interval ────────────────────────────────────
	useEffect(() => {
		if (!mounted) return;
		let t: ReturnType<typeof setTimeout>;
		const loop = () => {
			setBlink(true);
			setTimeout(() => setBlink(false), 120);
			t = setTimeout(loop, rand(3000, 7000));
		};
		t = setTimeout(loop, rand(3000, 7000));
		return () => clearTimeout(t);
	}, [mounted]);

	// ── Track which section is in view (for context-aware chatter) ────────────
	useEffect(() => {
		if (!mounted) return;
		const sections = Array.from(document.querySelectorAll('section[id]'));
		if (!sections.length) return;
		const io = new IntersectionObserver(
			entries => {
				for (const e of entries) {
					if (e.isIntersecting)
						sectionRef.current = (e.target as HTMLElement).id;
				}
			},
			{ threshold: 0.4 }
		);
		sections.forEach(s => io.observe(s));
		return () => io.disconnect();
	}, [mounted]);

	// ── Idle chatter ──────────────────────────────────────────────────────────
	useEffect(() => {
		if (!mounted || reduced) return;
		const schedule = () => {
			idleTimer.current = setTimeout(
				() => {
					const ph = p.current;
					if (!ph.dragging && ph.onGround && now() > ph.dizzyUntil) {
						say(idleQuipFor(sectionRef.current));
					}
					schedule();
				},
				rand(16000, 32000)
			);
		};
		schedule();
		return () => {
			if (idleTimer.current) clearTimeout(idleTimer.current);
		};
	}, [mounted, reduced, say]);

	// ── Refresh the list of perchable ledges periodically + on resize ─────────
	useEffect(() => {
		if (!mounted || reduced) return;
		const refresh = () => {
			ledgesRef.current = Array.from(
				document.querySelectorAll('[data-pet-ledge]')
			);
		};
		refresh();
		const iv = setInterval(refresh, 1500);
		window.addEventListener('resize', refresh);
		return () => {
			clearInterval(iv);
			window.removeEventListener('resize', refresh);
		};
	}, [mounted, reduced]);

	// ── Cursor eye-tracking (cheap: writes CSS vars, not React state) ─────────
	useEffect(() => {
		if (!mounted || reduced) return;
		const onMove = (e: PointerEvent) => {
			const el = wrapRef.current;
			if (!el) return;
			const cx = p.current.x + PET_W / 2;
			const cy = p.current.y + PET_H * 0.42;
			const dx = e.clientX - cx;
			const dy = e.clientY - cy;
			const d = Math.hypot(dx, dy) || 1;
			const ex = clamp((dx / d) * 2.8, -2.8, 2.8);
			const ey = clamp((dy / d) * 2.2, -2, 2.6);
			el.style.setProperty('--pet-eye-x', `${ex}px`);
			el.style.setProperty('--pet-eye-y', `${ey}px`);
		};
		window.addEventListener('pointermove', onMove);
		return () => window.removeEventListener('pointermove', onMove);
	}, [mounted, reduced]);

	// ── Physics loop ──────────────────────────────────────────────────────────
	useEffect(() => {
		if (!mounted || reduced) return;
		let raf = 0;
		let last = now();
		p.current.nextDecision = now() + rand(2000, 4000);

		const floorTop = () => window.innerHeight - PET_H - MARGIN;
		const maxX = () => window.innerWidth - PET_W;

		const liveLedges = (): Ledge[] =>
			ledgesRef.current
				.map(el => {
					const r = el.getBoundingClientRect();
					return { el, top: r.top, left: r.left, right: r.right };
				})
				// only ledges that are on screen and wide enough to stand on
				.filter(
					l =>
						l.top > 40 &&
						l.top < window.innerHeight - 40 &&
						l.right - l.left > PET_W + 8
				);

		// Ledges tagged `[data-pet-wall]` (the fixed dock) also sit in the floor strip,
		// so a floor-walking pet treats them as walls and keeps to its own side.
		const floorBlockers = () =>
			liveLedges().filter(l => l.el.hasAttribute('data-pet-wall'));

		const groundBounds = (ph: Phys): [number, number] => {
			if (ph.perch) return [ph.perch.left, ph.perch.right - PET_W];
			let lo = 0;
			let hi = maxX();
			const cx = ph.x + PET_W / 2;
			for (const l of floorBlockers()) {
				if (cx < (l.left + l.right) / 2) hi = Math.min(hi, l.left - PET_W);
				else lo = Math.max(lo, l.right);
			}
			return [lo, hi];
		};

		const decide = (ph: Phys, t: number) => {
			const roll = Math.random();
			if (roll < 0.3) ph.pauseUntil = t + rand(1000, 2600);
			else if (roll < 0.6) ph.walkDir = (ph.walkDir * -1) as 1 | -1;
			ph.nextDecision = t + rand(2200, 5200);
		};

		const tryLeap = (ph: Phys, dir: 1 | -1): boolean => {
			// From the floor, "standing on" is the floor itself and the pet's own
			// side is the edge it leaps from.
			const from = ph.perch ?? {
				el: null,
				top: floorTop() + PET_H,
				left: ph.x,
				right: ph.x + PET_W,
			};
			const fromEdge = dir > 0 ? from.right : from.left;
			let best: Ledge | null = null;
			let bestGap = Infinity;
			for (const l of liveLedges()) {
				if (l.el === from.el) continue;
				const nearEdge = dir > 0 ? l.left : l.right;
				const gap = dir > 0 ? nearEdge - fromEdge : fromEdge - nearEdge;
				if (
					gap > -20 &&
					gap < JUMP_GAP &&
					Math.abs(l.top - from.top) < JUMP_RISE
				) {
					if (gap < bestGap) {
						bestGap = gap;
						best = l;
					}
				}
			}
			if (!best) return false;
			ph.perch = null;
			ph.onGround = false;
			ph.vx = dir * Math.max(120, bestGap * 1.6);
			// Enough lift for the feet to clear the target's top by ~30px (v = √2gh).
			ph.vy = -Math.max(
				540,
				Math.sqrt(2 * GRAVITY * (from.top - best.top + 30))
			);
			ph.hopUntil = now() + 700;
			return true;
		};

		const edgeReached = (ph: Phys, dir: 1 | -1) => {
			if (ph.perch) {
				if (Math.random() < 0.45 && tryLeap(ph, dir)) return;
				if (Math.random() < 0.15) {
					// step off the edge and fall
					ph.perch = null;
					ph.onGround = false;
					ph.vy = 0;
					ph.vx = dir * 30;
					return;
				}
			} else if (Math.random() < 0.6 && tryLeap(ph, dir)) {
				return;
			} else if (Math.random() < 0.25) {
				say(pick(QUIPS.bump), 1200);
			}
			ph.walkDir = (dir * -1) as 1 | -1;
		};

		const step = () => {
			const t = now();
			const dt = clamp((t - last) / 1000, 0, 0.045);
			last = t;
			const ph = p.current;
			const el = wrapRef.current;

			if (ph.dragging) {
				// position is set by the pointer handler; nothing to integrate
				setModeSafe('drag');
			} else if (!ph.onGround) {
				// ── airborne: gravity + collisions ──
				const prevFeet = ph.y + PET_H;
				ph.vy += GRAVITY * dt;
				ph.x += ph.vx * dt;
				ph.y += ph.vy * dt;
				setModeSafe(t < ph.hopUntil ? 'hop' : 'idle');
				setGroundedSafe(false);
				if (ph.vx) setFacingSafe(ph.vx > 0 ? 1 : -1);

				// side walls
				if (ph.x < 0) {
					ph.x = 0;
					ph.vx = Math.abs(ph.vx) * WALL_BOUNCE;
				} else if (ph.x > maxX()) {
					ph.x = maxX();
					ph.vx = -Math.abs(ph.vx) * WALL_BOUNCE;
				}

				const feet = ph.y + PET_H;
				const cx = ph.x + PET_W / 2;

				// land on a ledge?
				let landed = false;
				if (ph.vy > 0) {
					for (const l of liveLedges()) {
						if (
							prevFeet <= l.top + 6 &&
							feet >= l.top &&
							cx >= l.left - 4 &&
							cx <= l.right + 4
						) {
							ph.perch = l;
							ph.y = l.top - PET_H;
							ph.vy = 0;
							ph.vx = 0;
							ph.onGround = true;
							landed = true;
							say(pick(QUIPS.perch), 1800);
							break;
						}
					}
				}

				// land on the floor?
				if (!landed && ph.y >= floorTop()) {
					ph.y = floorTop();
					if (Math.abs(ph.vy) > 240) {
						ph.vy = -ph.vy * FLOOR_BOUNCE;
						if (Math.abs(ph.vy) < 120) ph.vy = 0;
					} else {
						ph.vy = 0;
					}
					if (ph.vy === 0) {
						ph.onGround = true;
						ph.perch = null;
						if (t > ph.dizzyUntil) say(pick(QUIPS.land), 1200);
					}
				}
			} else {
				// ── grounded: dizzy / walk / pause ──
				if (ph.perch) {
					// keep synced to the (possibly scrolling) ledge
					const r = ph.perch.el.getBoundingClientRect();
					if (
						r.top < 20 ||
						r.top > window.innerHeight - 20 ||
						r.right - r.left < PET_W
					) {
						ph.perch = null;
						ph.onGround = false;
						ph.vy = 0;
					} else {
						ph.perch.top = r.top;
						ph.perch.left = r.left;
						ph.perch.right = r.right;
						ph.y = r.top - PET_H;
					}
				} else {
					ph.y = floorTop();
					const [lo, hi] = groundBounds(ph);
					if (hi < lo) {
						// No room beside the dock (narrow phones): stand on top of it instead.
						const cx = ph.x + PET_W / 2;
						const b = floorBlockers().find(
							l => cx > l.left - PET_W && cx < l.right + PET_W
						);
						if (b) {
							ph.perch = b;
							ph.x = clamp(ph.x, b.left, b.right - PET_W);
							ph.y = b.top - PET_H;
						}
					} else {
						// e.g. dropped half-overlapping the dock
						ph.x = clamp(ph.x, lo, hi);
					}
				}

				if (ph.onGround) {
					setGroundedSafe(true);
					if (t < ph.dizzyUntil) {
						setModeSafe('dizzy');
					} else if (t < ph.pauseUntil) {
						setModeSafe('idle');
					} else {
						setModeSafe('walk');
						setFacingSafe(ph.walkDir);
						ph.x += ph.walkDir * SPEED * dt;
						const [lo, hi] = groundBounds(ph);
						if (ph.x <= lo) {
							ph.x = lo;
							edgeReached(ph, -1);
						} else if (ph.x >= hi) {
							ph.x = hi;
							edgeReached(ph, 1);
						}
					}
					if (t > ph.nextDecision && t > ph.dizzyUntil) decide(ph, t);
				}
			}

			if (el) el.style.transform = `translate(${ph.x}px, ${ph.y}px)`;
			raf = requestAnimationFrame(step);
		};

		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, [mounted, reduced, say]);

	// ── Pointer interaction (drag / throw / poke / shake) ─────────────────────
	const pokeQuip = useCallback(() => {
		const t = now();
		const pw = pokeWindow.current;
		if (t > pw.until) pw.count = 0;
		pw.count += 1;
		pw.until = t + 2600;

		let total = 0;
		try {
			total = Number(localStorage.getItem(POKE_KEY) || '0') + 1;
			localStorage.setItem(POKE_KEY, String(total));
		} catch {
			/* ignore */
		}

		if (pw.count >= 5) say(pick(QUIPS.pokeMad));
		else if (pw.count >= 3) say(pick(QUIPS.pokeAnnoyed));
		else if (total <= 1) say('first poke! hi 🌟');
		else say(pick(QUIPS.pokeMild));

		// little hop
		if (p.current.onGround && now() > p.current.dizzyUntil) {
			p.current.onGround = false;
			p.current.vy = -360;
			p.current.hopUntil = now() + 500;
		}
	}, [say]);

	const onPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (reduced) {
				// static pet: a tap just makes it talk
				pokeQuip();
				return;
			}
			pressed.current = true;
			draggedThisPress.current = false;
			pressStart.current = { x: e.clientX, y: e.clientY };
			p.current.grabDX = e.clientX - p.current.x;
			p.current.grabDY = e.clientY - p.current.y;
			samples.current = [{ t: now(), x: p.current.x, y: p.current.y }];
			flips.current = [];
			lastDragX.current = e.clientX;
			lastDragSign.current = 0;
			(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
		},
		[reduced, pokeQuip]
	);

	useEffect(() => {
		if (!mounted || reduced) return;

		const onMove = (e: PointerEvent) => {
			if (!pressed.current) return;
			const dxFromStart = Math.hypot(
				e.clientX - pressStart.current.x,
				e.clientY - pressStart.current.y
			);
			if (!draggedThisPress.current && dxFromStart > GRAB_THRESHOLD) {
				draggedThisPress.current = true;
				p.current.dragging = true;
				p.current.perch = null;
				p.current.onGround = false;
				say(pick(QUIPS.drag), 1400);
			}
			if (!p.current.dragging) return;

			p.current.x = clamp(
				e.clientX - p.current.grabDX,
				0,
				window.innerWidth - PET_W
			);
			p.current.y = clamp(
				e.clientY - p.current.grabDY,
				-40,
				window.innerHeight - PET_H
			);

			// velocity samples (keep ~140ms)
			const t = now();
			samples.current.push({ t, x: p.current.x, y: p.current.y });
			while (samples.current.length && t - samples.current[0].t > 140) {
				samples.current.shift();
			}

			// shake detection
			const dir = Math.sign(e.clientX - lastDragX.current);
			if (dir !== 0 && dir !== lastDragSign.current) {
				lastDragSign.current = dir;
				flips.current.push(t);
				while (flips.current.length && t - flips.current[0] > 600)
					flips.current.shift();
				if (flips.current.length >= 4) {
					p.current.dizzyUntil = now() + 2200;
					flips.current = [];
					say(pick(QUIPS.dizzy), 2000);
				}
			}
			lastDragX.current = e.clientX;
		};

		const onUp = () => {
			if (!pressed.current) return;
			pressed.current = false;

			if (!draggedThisPress.current) {
				pokeQuip();
				return;
			}

			// throw: velocity from the recent samples
			p.current.dragging = false;
			const s = samples.current;
			if (s.length >= 2) {
				const a = s[0];
				const b = s[s.length - 1];
				const dt = (b.t - a.t) / 1000 || 0.016;
				p.current.vx = clamp((b.x - a.x) / dt, -1400, 1400);
				p.current.vy = clamp((b.y - a.y) / dt, -1600, 1600);
			} else {
				p.current.vx = 0;
				p.current.vy = 0;
			}
			p.current.onGround = false;
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		return () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
		};
	}, [mounted, reduced, say, pokeQuip]);

	const chooseHat = useCallback((id: HatId) => {
		setHat(id);
		setMenuOpen(false);
		try {
			localStorage.setItem(HAT_STORAGE_KEY, id);
		} catch {
			/* ignore */
		}
	}, []);

	if (!mounted) return null;

	return (
		<>
			<div
				ref={wrapRef}
				className="pointer-events-none fixed left-0 top-0 z-40 select-none"
				style={{ width: PET_W, height: PET_H, willChange: 'transform' }}
			>
				<div
					className="pointer-events-auto relative h-full w-full text-foreground/85"
					style={{
						cursor: reduced ? 'pointer' : grounded ? 'grab' : 'grabbing',
						touchAction: 'none',
					}}
					onPointerDown={onPointerDown}
					role="button"
					aria-label="Site pet — click to poke, drag to toss"
				>
					{/* Speech bubble */}
					{speech && (
						<div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-foreground/20 bg-background/95 px-3 py-1 font-hand text-base leading-none text-foreground shadow-sm">
							{speech}
						</div>
					)}

					{/* Shadow (shrinks when airborne) */}
					<span
						aria-hidden
						className="absolute bottom-0 left-1/2 h-2 -translate-x-1/2 rounded-[50%] bg-foreground/20 blur-[1px] transition-all duration-150"
						style={{
							width: grounded ? PET_W * 0.6 : PET_W * 0.42,
							opacity: grounded ? 0.25 : 0.12,
						}}
					/>

					<PetSprite
						mode={mode}
						blink={blink}
						facing={facing}
						hat={hat}
						className="h-full w-full"
					/>
				</div>
			</div>

			<PetHatMenu
				open={menuOpen}
				hat={hat}
				onToggle={() => setMenuOpen(o => !o)}
				onPick={chooseHat}
			/>
		</>
	);
}

function PetHatMenu({
	open,
	hat,
	onToggle,
	onPick,
}: {
	open: boolean;
	hat: HatId;
	onToggle: () => void;
	onPick: (id: HatId) => void;
}) {
	return (
		<div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
			{open && (
				<div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur">
					{HAT_IDS.map(id => (
						<button
							key={id}
							type="button"
							onClick={() => onPick(id)}
							aria-label={HAT_LABELS[id]}
							aria-pressed={hat === id}
							title={HAT_LABELS[id]}
							className={`flex h-10 w-10 items-center justify-center rounded-lg border text-foreground/80 transition-colors hover:bg-foreground/5 ${
								hat === id
									? 'border-foreground/50 bg-foreground/5'
									: 'border-transparent'
							}`}
						>
							{id === 'none' ? (
								<span className="text-[0.55rem] uppercase tracking-wide text-muted-foreground">
									off
								</span>
							) : (
								<svg
									viewBox="0 0 48 24"
									className="h-7 w-9 overflow-visible text-foreground"
								>
									<g transform="translate(0,16)">
										<HatShape id={id} />
									</g>
								</svg>
							)}
						</button>
					))}
				</div>
			)}
			<button
				type="button"
				onClick={onToggle}
				aria-label="Pick the pet's hat"
				aria-expanded={open}
				className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 text-foreground/80 shadow-md backdrop-blur transition-colors hover:bg-foreground/5"
			>
				<svg
					viewBox="0 0 48 20"
					className="h-6 w-8 overflow-visible text-foreground"
				>
					<g transform="translate(0,14)">
						<HatShape id={hat === 'none' ? 'wizard' : hat} />
					</g>
				</svg>
			</button>
		</div>
	);
}
