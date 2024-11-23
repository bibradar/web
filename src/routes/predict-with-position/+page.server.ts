// make google maps request in server side

import type { Lib } from '$lib/types';
import { redirect, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ params, url }) => {
	const userPosition = url.searchParams.get('user-position');
	if (!userPosition || userPosition.length === 0) {
		console.error('invalid user position');
        redirect(302, '/');
	}

	let libs: Lib[] = await fetch("https://ml-backend-1060597826530.europe-west3.run.app/libraries").then(async (response) => {
        let libs: Lib[] =  await response.json();
        return libs
    })

	return {
		userPosition,
        libs
	};
};
