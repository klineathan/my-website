import { CRM_URL, CRM_KEY } from '$env/dynamic/private';

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

interface PostsResponse {
	data: Post[];
	pagination: {
		page: number;
		limit: number;
		hasMore: boolean;
	};
}

export async function load({ fetch }) {
	const response = await fetch(`${CRM_URL}/api/v1/posts`, {
		headers: {
			Authorization: `Bearer ${CRM_KEY}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		return {
			posts: [],
			error: 'Failed to fetch posts'
		};
	}

	const result: PostsResponse = await response.json();

	return {
		posts: result.data,
		pagination: result.pagination
	};
}

