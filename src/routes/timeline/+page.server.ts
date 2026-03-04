import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

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

interface PostsResponse {
	data: Post[];
	pagination: {
		page: number;
		limit: number;
		hasMore: boolean;
	};
}

async function fetchPosts(fetchFn: typeof fetch): Promise<PostsResponse> {
	const response = await fetchFn(`${env.CMS_URL}/api/v1/posts?page=1&limit=10`, {
		headers: {
			Authorization: `Bearer ${env.CMS_KEY}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		return {
			data: [],
			pagination: { page: 1, limit: 10, hasMore: false }
		};
	}

	return response.json();
}

export function load({ fetch, url }) {
	const subscribed = url.searchParams.get('subscribed') === 'true';

	return {
		postsData: fetchPosts(fetch),
		subscribed
	};
}

export const actions: Actions = {
	subscribe: async ({ request, fetch }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const honeypot = formData.get('website')?.toString();
		const timestamp = formData.get('timestamp')?.toString();

		if (!email) {
			return fail(400, { error: 'Please enter your email address.' });
		}

		try {
			const response = await fetch(`${env.CMS_URL}/api/v1/subscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, honeypot, timestamp })
			});

			if (!response.ok) {
				const result = await response.json();
				return fail(400, { error: result.message || 'Something went wrong.' });
			}

			return { success: true };
		} catch {
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}
	}
};
