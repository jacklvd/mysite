'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from 'next-themes';
import { useReducedMotion } from 'framer-motion';

type ShapeType =
	| 'torusKnot'
	| 'icosahedron'
	| 'octahedron'
	| 'dodecahedron'
	| 'torus'
	| 'tetrahedron';

interface Refs {
	cursorWorld: { current: THREE.Vector3 };
	clickCount: { current: number };
}

// Projects the R3F pointer (NDC) onto the z=0 world plane each frame
function CursorTracker({ refs }: { refs: Refs }) {
	const { camera, pointer } = useThree();

	useFrame(() => {
		const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5);
		vec.unproject(camera);
		const dir = vec.sub(camera.position).normalize();
		const d = -camera.position.z / dir.z;
		refs.cursorWorld.current.copy(camera.position).addScaledVector(dir, d);
	});

	return null;
}

interface ShapeProps extends Refs {
	type: ShapeType;
	color: string;
	wireframe?: boolean;
	scale?: number;
	position: [number, number, number];
	velocity: [number, number, number];
	rotSpeed: [number, number, number];
}

function Shape({
	type,
	color,
	wireframe = false,
	scale = 1,
	position,
	velocity,
	rotSpeed,
	cursorWorld,
	clickCount,
}: ShapeProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const vel = useRef(new THREE.Vector3(...velocity));
	const naturalSpeed = useRef(new THREE.Vector3(...velocity).length());
	const lastClick = useRef(0);
	const { size, camera } = useThree();

	useFrame((_, rawDelta) => {
		if (!meshRef.current) return;
		// The loop is parked while the hero is offscreen (see `frameloop` below), so
		// the first frame back carries the entire paused span. Uncapped, that single
		// delta flings every shape past its bounds. Cap at ~3 frames' worth.
		const delta = Math.min(rawDelta, 0.05);
		const mesh = meshRef.current;
		const cam = camera as THREE.PerspectiveCamera;

		// Visible world bounds
		const fovRad = (cam.fov * Math.PI) / 180;
		const camDist = cam.position.z;
		const h = 2 * Math.tan(fovRad / 2) * camDist;
		const w = h * (size.width / size.height);
		const pad = scale * 0.85;
		const bx = w / 2 - pad;
		const by = h / 2 - pad;
		const bz = 2;

		// ── Cursor interaction ──────────────────────────────────────────
		const diff = new THREE.Vector3().subVectors(
			mesh.position,
			cursorWorld.current
		);
		const dist = diff.length();
		const diffN =
			dist > 0.001 ? diff.clone().normalize() : new THREE.Vector3(1, 0, 0);

		// Hover: smooth quadratic repulsion within radius
		const hoverRadius = 2.8;
		if (dist < hoverRadius && dist > 0.001) {
			const t = 1 - dist / hoverRadius;
			vel.current.addScaledVector(diffN, t * t * 8.0 * delta);
		}

		// Click: one-time impulse per click event
		const cc = clickCount.current;
		if (lastClick.current < cc) {
			lastClick.current = cc;
			const clickRadius = 4.5;
			if (dist < clickRadius) {
				const t = Math.max(0, 1 - dist / clickRadius);
				vel.current.addScaledVector(diffN, t * 4.5);
			}
		}

		// Cap speed so shapes don't fly off after many interactions
		const spd = vel.current.length();
		const maxSpd = 6;
		if (spd > maxSpd) vel.current.multiplyScalar(maxSpd / spd);

		// Gradually damp back to natural speed when cursor is far away
		const ns = naturalSpeed.current;
		if (dist > hoverRadius * 1.1 && spd > ns) {
			const dampedSpd = Math.max(spd * Math.pow(0.55, delta), ns);
			vel.current.multiplyScalar(dampedSpd / spd);
		}

		// ── Movement & bounce ───────────────────────────────────────────
		mesh.position.x += vel.current.x * delta;
		mesh.position.y += vel.current.y * delta;
		mesh.position.z += vel.current.z * delta;

		if (Math.abs(mesh.position.x) > bx) {
			vel.current.x = -vel.current.x;
			mesh.position.x = Math.sign(mesh.position.x) * bx;
		}
		if (Math.abs(mesh.position.y) > by) {
			vel.current.y = -vel.current.y;
			mesh.position.y = Math.sign(mesh.position.y) * by;
		}
		if (Math.abs(mesh.position.z) > bz) {
			vel.current.z = -vel.current.z;
			mesh.position.z = Math.sign(mesh.position.z) * bz;
		}

		// ── Rotation ────────────────────────────────────────────────────
		mesh.rotation.x += rotSpeed[0] * delta;
		mesh.rotation.y += rotSpeed[1] * delta;
		mesh.rotation.z += rotSpeed[2] * delta;
	});

	return (
		<mesh ref={meshRef} position={position} scale={scale}>
			{type === 'torusKnot' && <torusKnotGeometry args={[0.6, 0.2, 100, 16]} />}
			{type === 'icosahedron' && <icosahedronGeometry args={[0.8, 1]} />}
			{type === 'octahedron' && <octahedronGeometry args={[0.9, 0]} />}
			{type === 'dodecahedron' && <dodecahedronGeometry args={[0.7, 0]} />}
			{type === 'torus' && <torusGeometry args={[0.7, 0.25, 16, 50]} />}
			{type === 'tetrahedron' && <tetrahedronGeometry args={[0.9, 0]} />}
			<meshStandardMaterial
				color={color}
				wireframe={wireframe}
				roughness={0.75}
				metalness={0.05}
			/>
		</mesh>
	);
}

export default function Scene() {
	const { resolvedTheme } = useTheme();
	const dark = resolvedTheme === 'dark';
	const reduced = useReducedMotion();

	const [mobile, setMobile] = useState(false);

	// Park the render loop while the hero is scrolled out of view. Six animated
	// meshes otherwise keep the GPU busy for the whole page.
	const wrapRef = useRef<HTMLDivElement>(null);
	const [onscreen, setOnscreen] = useState(true);

	useEffect(() => {
		const el = wrapRef.current;
		if (!el) return;
		const io = new IntersectionObserver(([e]) => setOnscreen(e.isIntersecting));
		io.observe(el);
		return () => io.disconnect();
	}, []);

	useEffect(() => {
		const check = () => setMobile(window.innerWidth < 768);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

	const s = mobile ? 0.55 : 1; // scale multiplier

	// Start cursor far off-screen so shapes are undisturbed before first mouse move
	const cursorWorld = useRef(new THREE.Vector3(999, 999, 0));
	const clickCount = useRef(0);
	const refs: Refs = { cursorWorld, clickCount };

	// solid shapes
	const accent = dark ? '#c4685a' : '#C2503A'; // terracotta
	const neutral1 = dark ? '#6fa89e' : '#d4cdc7'; // muted teal
	const neutral2 = dark ? '#a07896' : '#c8c0b9'; // dusty mauve
	// wireframe shapes
	const wire = dark ? '#9aa8b8' : '#b0a8a2'; // cool blue-grey

	// 'demand' paints once and then idles, so a reduced-motion or offscreen hero
	// keeps the same composition of solids — it just stops moving. Theme changes
	// still repaint, because the color props change.
	return (
		<div ref={wrapRef} className="h-full w-full">
			<Canvas
				frameloop={reduced || !onscreen ? 'demand' : 'always'}
				camera={{ position: [0, 0, 8], fov: 50 }}
				gl={{ alpha: true, antialias: true }}
				style={{ background: 'transparent' }}
				onPointerDown={() => {
					clickCount.current += 1;
				}}
			>
				<ambientLight intensity={0.7} />
				<directionalLight position={[5, 5, 5]} intensity={0.9} />
				<directionalLight position={[-4, -3, -4]} intensity={0.3} />

				<CursorTracker refs={refs} />

				<Shape
					type="torusKnot"
					color={accent}
					wireframe={false}
					scale={0.55 * s}
					position={[-3, 1.5, -1]}
					velocity={[1.4, 1.1, 0.7]}
					rotSpeed={[0.4, 0.6, 0.2]}
					{...refs}
				/>

				<Shape
					type="icosahedron"
					color={wire}
					wireframe={true}
					scale={0.8 * s}
					position={[3, -1, 0.5]}
					velocity={[-1.8, 1.3, -0.9]}
					rotSpeed={[0.3, 0.5, 0.1]}
					{...refs}
				/>

				<Shape
					type="octahedron"
					color={neutral1}
					wireframe={false}
					scale={0.7 * s}
					position={[1.5, 2, -0.5]}
					velocity={[1.2, -1.6, 0.5]}
					rotSpeed={[0.5, 0.3, 0.4]}
					{...refs}
				/>

				<Shape
					type="dodecahedron"
					color={wire}
					wireframe={true}
					scale={0.75 * s}
					position={[-2, -2, 1]}
					velocity={[-1.3, -1.5, 1.0]}
					rotSpeed={[0.2, 0.4, 0.3]}
					{...refs}
				/>

				<Shape
					type="torus"
					color={neutral2}
					wireframe={false}
					scale={0.65 * s}
					position={[0, -1.5, -1]}
					velocity={[-1.6, 0.9, -0.7]}
					rotSpeed={[0.6, 0.2, 0.5]}
					{...refs}
				/>

				<Shape
					type="tetrahedron"
					color={wire}
					wireframe={true}
					scale={0.65 * s}
					position={[2.5, 1.5, 0.3]}
					velocity={[2.0, -1.1, 1.2]}
					rotSpeed={[0.3, 0.6, 0.2]}
					{...refs}
				/>
			</Canvas>
		</div>
	);
}
