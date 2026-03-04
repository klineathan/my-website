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

interface Comment {
	id: string;
	postId: string;
	parentId: string | null;
	authorName: string;
	content: string;
	isOwner: boolean;
	createdAt: string;
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
	comments?: Comment[];
}

async function fetchPost(fetchFn: typeof fetch, id: string): Promise<Post> {
	const response = await fetchFn(`${env.CMS_URL}/api/v1/posts/${id}`, {
		headers: {
			Authorization: `Bearer ${env.CMS_KEY}`,
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
	return result.data ?? result;
}

export function load({ fetch, params }) {
	return {
		postData: fetchPost(fetch, params.id)
	};
}

