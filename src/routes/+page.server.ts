import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [profilesRes, projectsRes] = await Promise.all([
		fetch('/api/homepage-profiles'),
		fetch('/api/my-projects')
	]);

	const profilesJson = profilesRes.ok ? await profilesRes.json() : { data: [] };
	const profiles = Array.isArray(profilesJson.data) ? profilesJson.data : [];

	const projectsJson = projectsRes.ok ? await projectsRes.json() : { data: [] };
	const projects = Array.isArray(projectsJson.data) ? projectsJson.data : [];

	return {
		profiles: profiles.map((p: { imageUrl: string; quote: string; altText?: string }) => ({
			src: p.imageUrl,
			thought: p.quote,
			alt: p.altText ?? 'Jon Kline'
		})),
		projects: projects as Array<{
			id: string;
			title: string;
			description: string | null;
			content: string | null;
			url: string | null;
			imageUrl: string;
			altText: string;
		}>
	};
};
