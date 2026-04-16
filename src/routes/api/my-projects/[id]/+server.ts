import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, params }) => {
	const response = await fetch(`${env.CMS_URL}/api/v1/my-projects/${params.id}`, {
		headers: {
			Authorization: `Bearer ${env.CMS_KEY}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		return json({ data: null }, { status: response.status });
	}

	return json(await response.json());
};
