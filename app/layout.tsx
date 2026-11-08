// app/layout.tsx
import type { Metadata } from 'next';
import {
	Newsreader,
	Fraunces,
	Dancing_Script,
	Caveat,
	Special_Elite,
} from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { LoadingProvider } from '@/context/loading-context';
import { CursorProvider } from '@/components/cursor/cursor-provider';
import ClientAppContent from '@/components/client-app-content';

// Body: a literary serif designed for on-screen reading.
const newsreader = Newsreader({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600'],
	style: ['normal', 'italic'],
	variable: '--font-body',
	display: 'swap',
	// next/font lacks fallback-metric overrides for Newsreader (Next 14.2.x),
	// which throws "Failed to find font override values" at build. Provide an
	// explicit fallback and skip the automatic metric adjustment.
	adjustFontFallback: false,
	fallback: ['Georgia', 'Cambria', 'serif'],
});
// Display: an old-style soft serif with bookish character for headings.
const fraunces = Fraunces({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	style: ['normal', 'italic'],
	variable: '--font-display',
	display: 'swap',
});

// Section titles — a flowing script (Tiffanka-style). To try another, swap the
// import + this call. Note the others are single-weight, so use weight ['400']:
//   Parisienne · Kaushan_Script · Great_Vibes   (all from next/font/google)
const titleFont = Dancing_Script({
	subsets: ['latin'],
	weight: ['500', '600', '700'],
	variable: '--font-title',
	display: 'swap',
});

// Casual handwriting for guestbook notes — looks like ballpoint on paper.
const handFont = Caveat({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	variable: '--font-hand',
	display: 'swap',
});

// Typewriter for labels, dates and margin notes — the sketchbook's "typed" voice.
// dev-note: labels only; too rough for paragraphs, body stays Newsreader.
const typeFont = Special_Elite({
	subsets: ['latin'],
	weight: ['400'],
	variable: '--font-type',
	display: 'swap',
});

export const metadata: Metadata = {
	metadataBase: new URL('https://jackvd.com'),
	title: {
		default: 'Jack Vo | Software Engineer',
		template: '%s | Jack Vo',
	},
	description:
		'Jack Vo is a Software Engineer passionate about solving real-world problems and building community-driven applications.',
	keywords: [
		'Jack Vo',
		'Software Engineer',
		'Full Stack Developer',
		'Computer Science',
		'Next.js',
		'React',
		'TypeScript',
	],
	authors: [{ name: 'Jack Vo', url: 'https://github.com/jacklvd' }],
	creator: 'Jack Vo',
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: 'https://jackvd.com',
		title: 'Jack Vo | Software Engineer',
		description:
			'Jack Vo is a Software Engineer passionate about solving real-world problems and building community-driven applications.',
		siteName: 'Jack Vo',
		images: [
			{
				url: '/images/hero.jpeg',
				width: 1200,
				height: 630,
				alt: 'Jack Vo — Software Engineer',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Jack Vo | Software Engineer',
		description:
			'Jack Vo is a Software Engineer passionate about solving real-world problems and building community-driven applications.',
		images: ['/images/hero.jpeg'],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: { index: true, follow: true },
	},
	formatDetection: {
		email: false,
		telephone: false,
		address: false,
	},
};

const personJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	name: 'Jack Vo',
	alternateName: 'Long Vo',
	url: 'https://jackvd.com',
	image: 'https://jackvd.com/images/hero.jpeg',
	jobTitle: 'Software Engineer',
	description:
		'Jack Vo is a Software Engineer passionate about solving real-world problems and building community-driven applications.',
	alumniOf: {
		'@type': 'CollegeOrUniversity',
		name: 'Northeastern University',
	},
	knowsAbout: [
		'Software Engineering',
		'Full Stack Development',
		'Next.js',
		'React',
		'TypeScript',
		'Python',
		'Machine Learning',
	],
	sameAs: [
		'https://github.com/jacklvd',
		'https://www.linkedin.com/in/itsmejack/',
		'https://scholar.google.com/citations?user=Ls-8CAoAAAAJ&hl=en',
		'https://blog.jackvd.com/',
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
			<body
				className={`${newsreader.variable} ${fraunces.variable} ${titleFont.variable} ${handFont.variable} ${typeFont.variable} font-sans`}
			>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
				/>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<LoadingProvider>
						<CursorProvider>
							<ClientAppContent>{children}</ClientAppContent>
						</CursorProvider>
					</LoadingProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
