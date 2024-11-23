// make google maps request in server side

import { redirect, type ServerLoad } from '@sveltejs/kit';
import type {LatLng, RouteLeg} from 'google__maps';
import { createClient } from '@google/maps';
import { goto } from '$app/navigation';

export const load: ServerLoad = async ({ params, url }) => {
	const googleMaps = createClient({
		key: 'AIzaSyAvJi7623DYk__BGXHalrfWURtRfDZZOP0'
	});

	const userPosition = url.searchParams.get('user-position');
	if (!userPosition || userPosition.length === 0) {
		console.error('invalid user position');
        redirect(302, '/');
	}

	console.log('user position', userPosition);
	// validate user position

	const validationPromise = new Promise<LatLng>((resolve, reject) => {
		googleMaps.geocode(
			{
				address: userPosition ?? undefined
			},
			(err, response) => {
				if (!response.json.results.length) {
					console.error('invalid user position');
                    reject();
					return;
				}

				console.log('user position', response.json.results[0].geometry.location);
                resolve(response.json.results[0].geometry.location);
			}
		);
	});

    let userCoordinates;
    try {
        userCoordinates = await validationPromise;
    } catch (e) {
        redirect(302, '/');
    }

	let promises = [];

	for (let i = 0; i < 10; i++) {
		promises.push(
			new Promise<RouteLeg>((resolve, reject) => {
				googleMaps.directions(
					{
						origin: userCoordinates,
						destination: 'Phillologicum, Ludwigstraße 25, 80539 München',
						mode: 'transit'
					},
					(err, response) => {
						resolve(response.json.routes[0].legs[0]);
					}
				);
			})
		);
	}

	return {
        distances: Promise.all(promises).then((values) => {
		console.log(values);
        return values;
	})};
};
