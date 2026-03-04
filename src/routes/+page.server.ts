import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/homepage-profiles');
	const json = res.ok ? await res.json() : { data: [] };
	const profiles = Array.isArray(json.data) ? json.data : [];

	return {
		profiles: profiles.map((p: { imageUrl: string; quote: string; altText?: string }) => ({
			src: p.imageUrl,
			thought: p.quote,
			alt: p.altText ?? 'Jon Kline'
		}))
	};
};
