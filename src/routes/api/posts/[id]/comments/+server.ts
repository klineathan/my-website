import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, params }) => {
	const response = await fetch(`${env.CMS_URL}/api/v1/posts/${params.id}/comments`, {
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

export const POST: RequestHandler = async ({ fetch, params, request }) => {
	const body = await request.json();

	const response = await fetch(`${env.CMS_URL}/api/v1/posts/${params.id}/comments`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.CMS_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	const result = await response.json();
	return json(result, { status: response.status });
};
