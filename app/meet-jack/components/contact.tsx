'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, Github, Linkedin, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
	WavyBorder,
	WavyButtonBorder,
	WavyDivider,
} from '@/components/effects/wavy-frame';
import { PageHeading } from '@/components/effects/page-heading';
import Link from 'next/link';
import {
	NOTE_COLORS,
	DEFAULT_NOTE_COLOR,
	NOTE_COLOR_STYLES,
	type NoteColor,
} from '@/lib/guestbook/colors';

interface Note {
	name: string;
	message: string;
	color: NoteColor;
	createdAt: string;
}

const SIGNED_KEY = 'guestbook-signed';

// TODO(jack): confirm these contact links. GitHub + LinkedIn are pulled from the
// site's JSON-LD; the email is your Northeastern address — swap to a preferred
// public address if you'd rather.
const socialLinks = [
	{
		name: 'Email',
		icon: Mail,
		href: 'mailto:vo.lo@northeastern.edu',
		label: 'vo.lo@northeastern.edu',
	},
	{
		name: 'GitHub',
		icon: Github,
		href: 'https://github.com/jacklvd',
		label: 'github.com/jacklvd',
	},
	{
		name: 'LinkedIn',
		icon: Linkedin,
		href: 'https://www.linkedin.com/in/itsmejack/',
		label: 'in/itsmejack',
	},
];

// Deterministic gentle rotation per card (index-based) so notes look pinned by
// hand without re-randomizing on every render or mismatching on hydration.
const ROTATIONS = ['-2deg', '1.5deg', '-1deg', '2deg', '-1.5deg', '1deg'];
const rotationFor = (i: number) => ROTATIONS[i % ROTATIONS.length];

const formSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, 'Please add your name.')
		.max(40, 'That name is a bit long.'),
	message: z
		.string()
		.trim()
		.min(5, 'Leave a few more words!')
		.max(280, 'Keep it under 280 characters.'),
	website: z.string().max(0).optional(), // honeypot
});

type FormValues = z.infer<typeof formSchema>;

function formatDate(iso: string) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

// Notes longer than this get truncated on the wall and become click-to-expand.
const PREVIEW_LIMIT = 160;

function previewOf(message: string) {
	if (message.length <= PREVIEW_LIMIT) return message;
	const slice = message.slice(0, PREVIEW_LIMIT);
	const lastSpace = slice.lastIndexOf(' ');
	return `${slice.slice(0, lastSpace > 80 ? lastSpace : PREVIEW_LIMIT).trimEnd()}…`;
}

function NoteCard({
	note,
	index,
	onOpen,
}: {
	note: Note;
	index: number;
	onOpen: () => void;
}) {
	const style =
		NOTE_COLOR_STYLES[note.color] ?? NOTE_COLOR_STYLES[DEFAULT_NOTE_COLOR];
	const isLong = note.message.length > PREVIEW_LIMIT;
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 16, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.4, ease: 'easeOut' }}
			style={{ rotate: rotationFor(index) }}
			className="group relative mb-4 break-inside-avoid"
		>
			<div
				role="button"
				tabIndex={0}
				aria-label={`Read the full note from ${note.name}`}
				onClick={onOpen}
				onKeyDown={(e: React.KeyboardEvent) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onOpen();
					}
				}}
				className={`relative ${style.paper} cursor-pointer px-5 pb-5 pt-7 shadow-[3px_5px_14px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-0.5`}
			>
				<WavyBorder
					filterId="wavy-frame-sm"
					className="border border-stone-900/15 transition-colors duration-300 group-hover:border-stone-900/30"
				/>
				{/* Washi tape */}
				<span
					aria-hidden
					className={`absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-2 ${style.tape} shadow-sm`}
				/>
				<p className="relative font-hand text-xl leading-snug text-stone-800">
					{isLong ? previewOf(note.message) : note.message}
				</p>
				{isLong && (
					<span className="relative mt-2 inline-block font-hand text-base text-stone-500 underline decoration-dotted underline-offset-2 transition-colors group-hover:text-stone-700">
						Read more →
					</span>
				)}
				<div className="relative mt-3 flex items-baseline justify-between gap-2">
					<span className="font-hand text-lg font-semibold text-stone-700">
						— {note.name}
					</span>
					<span className="font-hand text-sm text-stone-500">
						{formatDate(note.createdAt)}
					</span>
				</div>
			</div>
		</motion.div>
	);
}

function NoteModal({ note, onClose }: { note: Note; onClose: () => void }) {
	const style =
		NOTE_COLOR_STYLES[note.color] ?? NOTE_COLOR_STYLES[DEFAULT_NOTE_COLOR];

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [onClose]);

	return (
		<motion.div
			className="fixed inset-0 z-[60] flex items-center justify-center p-4"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
		>
			<div
				className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
				aria-hidden
				onClick={onClose}
			/>
			<motion.div
				role="dialog"
				aria-modal="true"
				initial={{ opacity: 0, scale: 0.94, y: 12 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 8 }}
				transition={{ duration: 0.25, ease: 'easeOut' }}
				className={`relative w-full max-w-lg ${style.paper} px-7 pb-7 pt-9 text-stone-800 shadow-2xl`}
			>
				<WavyBorder
					filterId="wavy-frame-sm"
					className="border border-stone-900/20"
				/>
				<span
					aria-hidden
					className={`absolute -top-2.5 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-2 ${style.tape} shadow-sm`}
				/>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close note"
					className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-900/10 hover:text-stone-800"
				>
					<X className="h-5 w-5" />
				</button>
				<p className="relative max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-hand text-2xl leading-relaxed text-stone-800">
					{note.message}
				</p>
				<div className="relative mt-5 flex items-baseline justify-between gap-2 border-t border-stone-900/10 pt-3">
					<span className="font-hand text-xl font-semibold text-stone-700">
						— {note.name}
					</span>
					<span className="font-hand text-base text-stone-500">
						{formatDate(note.createdAt)}
					</span>
				</div>
			</motion.div>
		</motion.div>
	);
}

function NoteSkeleton({ index }: { index: number }) {
	return (
		<div
			style={{ rotate: rotationFor(index) }}
			className="mb-4 break-inside-avoid bg-foreground/5 px-5 pb-5 pt-7"
		>
			<div className="h-4 w-full rounded bg-foreground/10" />
			<div className="mt-2 h-4 w-2/3 rounded bg-foreground/10" />
			<div className="mt-4 h-3 w-1/3 rounded bg-foreground/10" />
		</div>
	);
}

export function Guestbook() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [loading, setLoading] = useState(true);
	const [color, setColor] = useState<NoteColor>(DEFAULT_NOTE_COLOR);
	const [submitting, setSubmitting] = useState(false);
	// Client-only: /meet-jack renders null until mounted, so localStorage exists here.
	const [hasSigned, setHasSigned] = useState(
		() => localStorage.getItem(SIGNED_KEY) === '1'
	);
	const [openNote, setOpenNote] = useState<Note | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: '', message: '', website: '' },
	});

	useEffect(() => {
		let active = true;
		fetch('/api/guestbook')
			.then(r => r.json())
			.then(data => {
				if (active && Array.isArray(data.notes)) setNotes(data.notes);
			})
			.catch(() => {})
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, []);

	async function onSubmit(values: FormValues) {
		if (values.website) return; // honeypot
		setSubmitting(true);
		try {
			const res = await fetch('/api/guestbook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...values, color }),
			});
			const data = await res.json();

			if (res.status === 409) {
				localStorage.setItem(SIGNED_KEY, '1');
				setHasSigned(true);
				toast({ title: data.error ?? "You've already signed 💛" });
				return;
			}
			if (!res.ok) {
				toast({
					title: data.error ?? 'Something went wrong.',
					variant: 'destructive',
				});
				return;
			}

			if (data.note) setNotes(prev => [data.note as Note, ...prev]);
			localStorage.setItem(SIGNED_KEY, '1');
			setHasSigned(true);
			form.reset();
			setColor(DEFAULT_NOTE_COLOR);
			toast({ title: 'Thanks for signing the guestbook! 🌟' });
		} catch {
			toast({
				title: 'Could not reach the guestbook. Try again later.',
				variant: 'destructive',
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section id="contact" className="relative scroll-mt-24 py-16 md:py-24">
			<PageHeading page="05" label="guestbook" title="Sign the book.">
				<p className="mt-6 max-w-md font-hand text-2xl text-muted-foreground">
					Leave a note before you go — it stays pinned in these pages for
					everyone to see.
				</p>
			</PageHeading>

			<div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
				{/* Note-writing sheet */}
				<div className="group relative">
					<WavyBorder className="rounded-2xl border border-foreground/20" />
					<div
						className={`relative rounded-2xl p-6 text-stone-800 shadow-sm transition-colors duration-300 md:p-8 ${NOTE_COLOR_STYLES[color].paper}`}
						style={{
							backgroundImage:
								'repeating-linear-gradient(transparent, transparent 31px, rgba(120,110,90,0.18) 31px, rgba(120,110,90,0.18) 32px)',
						}}
					>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-5"
							>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-hand text-lg text-stone-500">
												Your name
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Jane Doe"
													className="border-0 border-b border-stone-300 bg-transparent px-0 font-hand text-2xl text-stone-800 placeholder:text-stone-400 focus-visible:ring-0 rounded-none"
													{...field}
												/>
											</FormControl>
											<FormMessage className="font-hand text-base text-rose-500" />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="message"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-hand text-lg text-stone-500">
												Your note
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Write something kind, funny, or memorable…"
													className="min-h-[110px] resize-none border-0 bg-transparent px-0 font-hand text-2xl leading-8 text-stone-800 placeholder:text-stone-400 focus-visible:ring-0"
													{...field}
												/>
											</FormControl>
											<FormMessage className="font-hand text-base text-rose-500" />
										</FormItem>
									)}
								/>

								{/* Honeypot — visually hidden, off-screen, ignored by humans. */}
								<div
									aria-hidden
									className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden"
								>
									<label htmlFor="website">Website</label>
									<input
										id="website"
										type="text"
										tabIndex={-1}
										autoComplete="off"
										{...form.register('website')}
									/>
								</div>

								{/* Paper color picker */}
								<div className="flex items-center gap-3">
									<span className="font-hand text-lg text-stone-500">
										Paper
									</span>
									<div className="flex gap-2">
										{NOTE_COLORS.map(c => (
											<button
												key={c}
												type="button"
												onClick={() => setColor(c)}
												aria-label={`${c} paper`}
												aria-pressed={color === c}
												className={`h-7 w-7 rounded-full border border-stone-400/60 transition-transform hover:scale-110 ${NOTE_COLOR_STYLES[c].swatch} ${
													color === c
														? 'scale-110 ring-2 ring-stone-700 ring-offset-2 ring-offset-background'
														: ''
												}`}
											/>
										))}
									</div>
								</div>

								{hasSigned ? (
									<p className="flex items-center gap-2 font-hand text-xl text-stone-600">
										<Check className="h-5 w-5" /> You&apos;ve signed the
										guestbook — thank you!
									</p>
								) : (
									<Button
										type="submit"
										disabled={submitting}
										className="group/btn relative bg-transparent px-6 py-2 font-hand text-xl text-stone-800 shadow-none hover:bg-transparent hover:text-stone-900"
									>
										<WavyButtonBorder />
										<span className="relative flex items-center gap-2">
											<Send className="h-4 w-4" />
											{submitting ? 'Signing…' : 'Sign the book'}
										</span>
									</Button>
								)}
							</form>
						</Form>
					</div>
				</div>

				{/* Contact card */}
				<aside className="group relative self-start">
					<WavyBorder className="rounded-2xl border border-foreground/20" />
					<div className="relative rounded-2xl bg-background p-6 md:p-8">
						<h3 className="font-title text-3xl text-foreground">
							Reach me directly
						</h3>
						<p className="mt-1 font-hand text-xl text-muted-foreground">
							Prefer a proper hello? I&apos;m around here:
						</p>
						<ul className="mt-5 space-y-3">
							{socialLinks.map(({ name, icon: Icon, href, label }) => (
								<li key={name}>
									<a
										href={href}
										target={href.startsWith('http') ? '_blank' : undefined}
										rel="noreferrer"
										className="flex items-center gap-3 text-foreground/80 transition-colors hover:text-foreground"
									>
										<span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5">
											<Icon className="h-4 w-4" />
										</span>
										<span className="font-hand text-xl">{label}</span>
									</a>
								</li>
							))}
						</ul>
					</div>
				</aside>
			</div>

			<div className="my-12">
				<WavyDivider />
			</div>

			{/* The wall of notes */}
			<div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
				{loading ? (
					Array.from({ length: 6 }).map((_, i) => (
						<NoteSkeleton key={i} index={i} />
					))
				) : notes.length === 0 ? (
					<p className="col-span-full text-center font-hand text-2xl text-muted-foreground">
						No notes yet — be the first to sign! ✍️
					</p>
				) : (
					<AnimatePresence initial={false}>
						{notes.map((note, i) => (
							<NoteCard
								key={`${note.createdAt}-${i}`}
								note={note}
								index={i}
								onOpen={() => setOpenNote(note)}
							/>
						))}
					</AnimatePresence>
				)}
			</div>

			<AnimatePresence>
				{openNote && (
					<NoteModal note={openNote} onClose={() => setOpenNote(null)} />
				)}
			</AnimatePresence>

			{/* Dog-eared corner — the way into the hidden p. 06 */}
			<Link
				href="/scribbles"
				aria-label="Turn to a hidden page"
				title="p. 06?"
				className="group absolute bottom-0 right-0 block h-10 w-10 transition-all duration-300 hover:h-16 hover:w-16"
			>
				<span
					aria-hidden
					className="absolute inset-0 bg-[linear-gradient(135deg,transparent_50%,hsl(var(--muted))_50%)] shadow-[-2px_-2px_6px_rgba(0,0,0,0.08)]"
				/>
				<span
					aria-hidden
					className="absolute bottom-1 right-1.5 font-type text-[0.6rem] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
				>
					p.06
				</span>
			</Link>
		</section>
	);
}
