// Geometry for the experience timeline's scroll-scrubbed rail.
//
// The rail element wraps every role, so its bottom edge is the last line of the
// last role's bullets — a long scroll past the final dot. Scrubbing the fill
// against that edge leaves the line visibly unfinished while you are still
// reading the last entry. These helpers put the track between the first and
// last dot instead, and remap scroll progress onto that shorter span.

export interface RailSpan {
	/** Track's offset from the rail's top, in px. */
	top: number;
	/** Track's length, in px. */
	height: number;
	/** Scroll progress at which the fill starts. */
	from: number;
	/** Scroll progress at which the fill is complete. */
	to: number;
	/**
	 * Each dot's position along the track, 0-1. A dot is "reached" once the
	 * fill's own 0-1 progress passes its stop, which is what keeps the lit dots
	 * and the line in agreement — they read the same number.
	 */
	stops: number[];
}

// `centres` are each dot's centre in px from the rail's top, in document order.
//
// Progress is linear in scroll distance between "rail top at viewport centre"
// (0) and "rail bottom at viewport centre" (1), so a dot at fraction f of the
// rail's height sits at the centre at exactly progress f — which is why the
// pixel offsets divide straight through into the progress range.
export function railSpan(centres: number[], railHeight: number): RailSpan {
	const h = railHeight > 0 ? railHeight : 1;
	if (centres.length === 0)
		return { top: 0, height: 0, from: 0, to: 1, stops: [] };

	const first = centres[0];
	const last = centres[centres.length - 1];

	// One role, or dots that have not been laid out yet, leave nothing to scrub.
	// Keep a non-empty progress range so the caller's interpolation never divides
	// by zero, and put every dot at the start so none of them wait on a fill that
	// will never move.
	if (last <= first)
		return {
			top: first,
			height: 0,
			from: 0,
			to: 1,
			stops: centres.map(() => 0),
		};

	const height = last - first;
	return {
		top: first,
		height,
		from: first / h,
		to: last / h,
		stops: centres.map(c => (c - first) / height),
	};
}
