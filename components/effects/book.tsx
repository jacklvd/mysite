'use client';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
	type ReactNode,
	type RefObject,
} from 'react';

// /meet-jack reads like a book on md+ screens: pages sit side by side in a
// horizontal snap scroller, and each page scrolls vertically on its own. A
// vertical wheel past the end of a page turns to the next one. Phones keep the
// plain vertical page (all the book styles below are md: prefixed).

const BOOK_QUERY = '(min-width: 768px)';

const subscribe = (cb: () => void) => {
	const mq = matchMedia(BOOK_QUERY);
	mq.addEventListener('change', cb);
	return () => mq.removeEventListener('change', cb);
};
export const useBookMode = () =>
	useSyncExternalStore(
		subscribe,
		() => matchMedia(BOOK_QUERY).matches,
		() => false
	);

const PageContext = createContext<RefObject<HTMLDivElement | null> | null>(
	null
);

// Scroll container for framer's useScroll(): the current page in book mode,
// the window otherwise.
export function usePageScroller() {
	const page = useContext(PageContext);
	return useBookMode() && page ? page : undefined;
}

export function BookPage({ children }: { children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	return (
		<PageContext.Provider value={ref}>
			<div
				ref={ref}
				data-page
				className="book-page relative md:h-full md:shrink-0 md:basis-full md:snap-start md:snap-always md:overflow-y-auto md:overflow-x-hidden"
			>
				{children}
			</div>
		</PageContext.Provider>
	);
}

const canScroll = (el: HTMLElement, dir: number) =>
	dir > 0
		? el.scrollTop + el.clientHeight < el.scrollHeight - 1
		: el.scrollTop > 0;

const isTyping = (t: EventTarget | null) =>
	t instanceof HTMLElement &&
	(t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|CANVAS)$/.test(t.tagName));

// Page index + turning for the book scroller. `ready` flips once the scroller
// is actually mounted (the page renders behind a loading gate).
export function useBook(
	bookRef: RefObject<HTMLElement | null>,
	ready: boolean
) {
	const [page, setPage] = useState(0);
	const [count, setCount] = useState(1);

	const turnTo = useCallback(
		(i: number) => {
			const b = bookRef.current;
			if (!b) return;
			const target = Math.max(0, Math.min(i, b.childElementCount - 1));
			const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
			b.scrollTo({
				left: target * b.clientWidth,
				behavior: reduce ? 'auto' : 'smooth',
			});
		},
		[bookRef]
	);

	useEffect(() => {
		const book = bookRef.current;
		if (!book) return;
		const inBook = () => book.scrollWidth > book.clientWidth;
		const current = () => Math.round(book.scrollLeft / book.clientWidth);
		setCount(book.childElementCount);

		const onScroll = () => setPage(current());

		// One page per wheel gesture, and only when the gesture *starts* at the
		// end of a page, so momentum from reading down a page never flips it.
		let gesture: 'none' | 'scroll' | 'turned' = 'none';
		let idle = 0;
		const onWheel = (e: WheelEvent) => {
			if (!inBook() || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
			clearTimeout(idle);
			idle = window.setTimeout(() => (gesture = 'none'), 220);
			const dir = Math.sign(e.deltaY);
			const pageEl = (e.target as Element).closest<HTMLElement>('[data-page]');
			// The rest of a gesture that turned the page shouldn't scroll the new one.
			if (gesture !== 'turned' && pageEl && canScroll(pageEl, dir)) {
				gesture = 'scroll';
				return;
			}
			e.preventDefault();
			if (gesture !== 'none') return;
			gesture = 'turned';
			turnTo(current() + dir);
		};

		const onKey = (e: KeyboardEvent) => {
			if (!inBook() || isTyping(e.target)) return;
			if (e.key === 'ArrowRight') turnTo(current() + 1);
			else if (e.key === 'ArrowLeft') turnTo(current() - 1);
			else return;
			e.preventDefault();
		};

		book.addEventListener('scroll', onScroll, { passive: true });
		book.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('keydown', onKey);
		return () => {
			clearTimeout(idle);
			book.removeEventListener('scroll', onScroll);
			book.removeEventListener('wheel', onWheel);
			window.removeEventListener('keydown', onKey);
		};
	}, [bookRef, turnTo, ready]);

	return { page, count, turnTo };
}

const pad = (n: number) => String(n).padStart(2, '0');

// Typed page counter with turn arrows, bottom-right corner (book mode only).
export function PageCorner({
	page,
	count,
	turnTo,
}: ReturnType<typeof useBook>) {
	const arrow =
		'px-1.5 py-1 transition-colors hover:text-ink-red disabled:pointer-events-none disabled:opacity-30';
	return (
		<nav
			aria-label="Pages"
			className="fixed bottom-7 right-6 z-30 hidden items-center gap-2 font-type text-xs text-muted-foreground md:flex"
		>
			<button
				onClick={() => turnTo(page - 1)}
				disabled={page === 0}
				aria-label="Previous page"
				className={arrow}
			>
				←
			</button>
			<span className="tabular-nums tracking-[0.15em]">
				p. {pad(page + 1)} / {pad(count)}
			</span>
			<button
				onClick={() => turnTo(page + 1)}
				disabled={page >= count - 1}
				aria-label="Next page"
				className={arrow}
			>
				→
			</button>
		</nav>
	);
}
