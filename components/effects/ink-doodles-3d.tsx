'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from 'next-themes';
import { useReducedMotion } from 'framer-motion';
import { seededRandom } from '@/lib/seeded-random';

// 3D margin doodles: real 3D objects drawn only as ink outlines, each traced
// twice — a solid stroke plus a faint second pass that jitters a few times a
// second ("line boil"), like hand-drawn animation. Ink color follows the theme.
// Purely decorative and pointer-transparent; mount it client-only.

const BOIL_FPS = 8;

// ── Geometry: everything is line segments ───────────────────────────────────

function segments(pairs: number[][]) {
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pairs.flat(), 3));
	return g;
}

function edges(g: THREE.BufferGeometry) {
	return new THREE.EdgesGeometry(g, 20);
}

function merge(...geoms: THREE.BufferGeometry[]) {
	const pts: number[] = [];
	for (const g of geoms)
		pts.push(...(g.getAttribute('position').array as Float32Array));
	const out = new THREE.BufferGeometry();
	out.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
	return out;
}

// Folded paper plane, nose along +z.
const plane = () => {
	const nose = [0, 0, 1.1];
	const l = [-0.95, 0.05, -0.6];
	const r = [0.95, 0.05, -0.6];
	const back = [0, 0, -0.6];
	const keel = [0, -0.32, -0.6];
	return segments([
		nose,
		l,
		l,
		back,
		nose,
		r,
		r,
		back, // wings
		nose,
		back,
		nose,
		keel,
		keel,
		back, // centre fold + keel
		[-0.45, 0.02, 0.25],
		[-0.5, 0.03, -0.6], // wing creases
		[0.45, 0.02, 0.25],
		[0.5, 0.03, -0.6],
	]);
};

// Closed book with page lines on the fore-edge.
const book = () =>
	merge(
		edges(new THREE.BoxGeometry(1.4, 0.3, 1)),
		segments(
			[-0.07, 0, 0.07].flatMap(y => [
				[0.7, y, -0.45],
				[0.7, y, 0.45],
			])
		)
	);

// Hexagonal pencil: body + sharpened cone + eraser band.
const pencil = () =>
	merge(
		edges(new THREE.CylinderGeometry(0.13, 0.13, 1.5, 6)),
		edges(new THREE.ConeGeometry(0.13, 0.4, 6).translate(0, 0.95, 0)),
		edges(
			new THREE.CylinderGeometry(0.135, 0.135, 0.18, 6).translate(0, -0.66, 0)
		)
	);

const sparkle = () => edges(new THREE.OctahedronGeometry(0.32));

// ── Pieces ──────────────────────────────────────────────────────────────────

function Sketch({
	geometry,
	color,
	still,
}: {
	geometry: THREE.BufferGeometry;
	color: THREE.Color;
	still: boolean;
}) {
	const ghost = useRef<THREE.LineSegments>(null);
	const lastTick = useRef(-1);

	useFrame(({ clock }) => {
		const g = ghost.current;
		if (still || !g) return;
		const tick = Math.floor(clock.elapsedTime * BOIL_FPS);
		if (tick === lastTick.current) return;
		lastTick.current = tick;
		const j = (n: number) => (seededRandom(tick * 4 + n) - 0.5) * 0.06;
		g.rotation.set(j(0), j(1), j(2));
		g.scale.setScalar(1 + j(3) * 0.5);
	});

	return (
		<group>
			<lineSegments geometry={geometry}>
				<lineBasicMaterial color={color} transparent opacity={0.85} />
			</lineSegments>
			<lineSegments ref={ghost} geometry={geometry}>
				<lineBasicMaterial color={color} transparent opacity={0.35} />
			</lineSegments>
		</group>
	);
}

function Doodles({ color, still }: { color: THREE.Color; still: boolean }) {
	const geo = useMemo(
		() => ({
			plane: plane(),
			book: book(),
			pencil: pencil(),
			sparkle: sparkle(),
		}),
		[]
	);
	const planeRef = useRef<THREE.Group>(null);
	const bookRef = useRef<THREE.Group>(null);
	const pencilRef = useRef<THREE.Group>(null);
	const sparkleRef = useRef<THREE.Group>(null);
	const ahead = useMemo(() => new THREE.Vector3(), []);

	// Paper plane loops a lazy figure-eight in the upper left.
	const planeAt = (t: number, v: THREE.Vector3) =>
		v.set(
			-4.2 + 1.7 * Math.sin(t),
			2.1 + 0.6 * Math.sin(2 * t),
			0.8 * Math.cos(t)
		);

	useFrame(({ clock, camera, pointer }, delta) => {
		if (still) return;
		const t = clock.elapsedTime * 0.35;
		const p = planeRef.current;
		if (p) {
			planeAt(t, p.position);
			p.lookAt(planeAt(t + 0.05, ahead));
			p.rotateZ(-Math.cos(t) * 0.5); // bank into the turn
		}
		if (bookRef.current) bookRef.current.rotation.y += delta * 0.3;
		if (pencilRef.current) pencilRef.current.rotation.y += delta * 0.5;
		if (sparkleRef.current) sparkleRef.current.rotation.y -= delta * 0.8;

		// Parallax: the page tilts a touch toward the cursor
		camera.position.x = THREE.MathUtils.lerp(
			camera.position.x,
			pointer.x * 0.6,
			0.04
		);
		camera.position.y = THREE.MathUtils.lerp(
			camera.position.y,
			pointer.y * 0.4,
			0.04
		);
		camera.lookAt(0, 0, 0);
	});

	return (
		<>
			<group ref={planeRef} position={[-4.2, 2.1, 0.8]} scale={0.8}>
				<Sketch geometry={geo.plane} color={color} still={still} />
			</group>
			<group
				ref={bookRef}
				position={[-4.8, -2.3, 0]}
				rotation={[0.45, 0.6, 0.1]}
			>
				<Sketch geometry={geo.book} color={color} still={still} />
			</group>
			<group position={[4.9, -1.4, 0]} rotation={[0, 0, -0.55]}>
				<group ref={pencilRef}>
					<Sketch geometry={geo.pencil} color={color} still={still} />
				</group>
			</group>
			<group ref={sparkleRef} position={[4.6, 2.5, 0]}>
				<Sketch geometry={geo.sparkle} color={color} still={still} />
			</group>
		</>
	);
}

// Reads the theme's --foreground as a THREE.Color (CSS stores "H S% L%").
function useInkColor() {
	const { resolvedTheme } = useTheme();
	const [color, setColor] = useState(() => new THREE.Color('#1a1a1a'));
	useEffect(() => {
		// next-themes flips the <html> class in the same tick; read after paint.
		const id = requestAnimationFrame(() => {
			const hsl = getComputedStyle(document.documentElement)
				.getPropertyValue('--foreground')
				.trim()
				.split(/\s+/)
				.join(', ');
			if (hsl) setColor(new THREE.Color(`hsl(${hsl})`));
		});
		return () => cancelAnimationFrame(id);
	}, [resolvedTheme]);
	return color;
}

export default function InkDoodles3D() {
	const color = useInkColor();
	const still = !!useReducedMotion();

	return (
		<Canvas
			className="!pointer-events-none"
			dpr={[1, 2]}
			gl={{ alpha: true, antialias: true }}
			camera={{ position: [0, 0, 8], fov: 50 }}
			frameloop={still ? 'demand' : 'always'}
			eventSource={document.body}
			eventPrefix="client"
		>
			<Doodles color={color} still={still} />
		</Canvas>
	);
}
