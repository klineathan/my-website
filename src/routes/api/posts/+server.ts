import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, url }) => {
	const page = url.searchParams.get('page') || '1';
	const limit = url.searchParams.get('limit') || '10';

	const response = await fetch(
		`${env.CMS_URL}/api/v1/posts?page=${page}&limit=${limit}`,
		{
			headers: {
				Authorization: `Bearer ${env.CMS_KEY}`,
				'Content-Type': 'application/json'
			}
		}
	);

	if (!response.ok) {
		return json(
			{ data: [], pagination: { page: parseInt(page), limit: parseInt(limit), hasMore: false } },
			{ status: response.status }
		);
	}

	return json(await response.json());
};
