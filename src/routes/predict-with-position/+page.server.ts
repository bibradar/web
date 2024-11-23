// make google maps request in server side

import { redirect, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ params, url }) => {
	const userPosition = url.searchParams.get('user-position');
	if (!userPosition || userPosition.length === 0) {
		console.error('invalid user position');
        redirect(302, '/');
	}

	console.log('user position', userPosition);

	return {
		userPosition
	};
};
