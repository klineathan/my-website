import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

interface MediaItem {
	id: string;
	url: string;
	mediaType: 'image' | 'video';
	altText: string | null;
	caption: string | null;
	width: number | null;
	height: number | null;
}

interface Project {
	id: string;
	title: string;
	description: string | null;
	content: string | null;
	url: string | null;
	createdAt: string;
	updatedAt: string;
	thumbnailUrl: string;
	thumbnailAlt: string;
	media: MediaItem[];
}

async function fetchProject(fetchFn: typeof fetch, id: string): Promise<Project> {
	const response = await fetchFn(`${env.CMS_URL}/api/v1/my-projects/${id}`, {
		headers: {
			Authorization: `Bearer ${env.CMS_KEY}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		if (response.status === 404) {
			throw error(404, 'Project not found');
		}
		throw error(500, 'Failed to fetch project');
	}

	const result = await response.json();
	return result.data ?? result;
}

export function load({ fetch, params }) {
	return {
		projectData: fetchProject(fetch, params.id)
	};
}
