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

interface Post {
	id: string;
	title: string;
	content: string;
	excerpt: string | null;
	publishedAt: string;
	createdAt: string;
	updatedAt: string;
	media: MediaItem[];
}

export async function load({ fetch, params }) {
	const response = await fetch(`${env.CRM_URL}/api/v1/posts/${params.id}`, {
		headers: {
			Authorization: `Bearer ${env.CRM_KEY}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		if (response.status === 404) {
			throw error(404, 'Post not found');
		}
		throw error(500, 'Failed to fetch post');
	}

	const result = await response.json();
	// Handle both { data: Post } and Post response formats
	const post: Post = result.data ?? result;

	return {
		post
	};
}

