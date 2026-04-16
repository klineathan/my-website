import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
	const response = await fetch(`${env.CMS_URL}/api/v1/my-projects`, {
		headers: {
			Authorization: `Bearer ${env.CMS_KEY}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		return json({ data: [] }, { status: response.status });
	}

	return json(await response.json());
};
