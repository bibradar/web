<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Lib } from '$lib/types.js';
	import { onMount } from 'svelte';

	const { data } = $props();

	let orderedLibs = $state(data.libs);

	let mapContainer: HTMLElement | undefined = $state();

	const initMap = async () => {
		if (!mapContainer) return;

		const { Geocoder } = (await google.maps.importLibrary(
			'geocoding'
		)) as google.maps.GeocodingLibrary;

		let validationPromise = new Promise<google.maps.LatLng>((resolve, reject) => {
			new Geocoder().geocode(
				{
					address: orderedLibs[0].location ?? undefined
				},
				(response, status) => {
					if (!response || status !== 'OK') {
						console.error('invalid lib location');
						reject();
						return;
					}

					resolve(response[0].geometry.location);
				}
			);
		});

		let libCoordinates;
		try {
			libCoordinates = await validationPromise;
		} catch (error) {
			console.error('invalid lib location');
			goto('/');
			return;
		}

		const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
		let map = new Map(mapContainer, {
			center: libCoordinates,
			zoom: 15
		});

		const { Marker } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;

		new Marker({
			position: libCoordinates,
			map: map,
			title: 'Hello World!'
		});
	};

	const loadDistances = async () => {
		const { Geocoder } = (await google.maps.importLibrary(
			'geocoding'
		)) as google.maps.GeocodingLibrary;

		let validationPromise = new Promise<google.maps.LatLng>((resolve, reject) => {
			new Geocoder().geocode(
				{
					address: data.userPosition ?? undefined
				},
				(response, status) => {
					if (!response || status !== 'OK') {
						console.error('invalid user position');
						reject();
						return;
					}

					console.log('user position', response[0]);
					resolve(response[0].geometry.location);
				}
			);
		});

		let userCoordinates;
		try {
			userCoordinates = await validationPromise;
		} catch (error) {
			console.error('invalid user position');
			goto('/');
			return;
		}

		var directionsService = new google.maps.DirectionsService();
		let promises = [];
		for (let lib of data.libs) {
			promises.push(
				new Promise<{ distance: google.maps.DirectionsLeg; lib: Lib }>((resolve, reject) => {
					directionsService.route(
						{
							origin: userCoordinates,
							destination: lib.location,
							travelMode: google.maps.TravelMode.TRANSIT
						},
						(response, status) => {
							if (!response || status !== 'OK') {
								console.error('Directions request failed due to ' + status);
								reject();
								return;
							}
							resolve({
								lib,
								distance: response.routes[0].legs[0]
							});
						}
					);
				})
			);
		}

		let distances: { distance: google.maps.DirectionsLeg; lib: Lib }[] =
			await Promise.all(promises);
		let request = distances.map((distance) => {
			return {
				library_id: distance.lib.id,
				arrival_time: distance.distance.arrival_time?.value.getTime()
			};
		});
		console.log(request);

		let resp = fetch('https://ml-backend-1060597826530.europe-west3.run.app/predict', {
			method: 'POST',
			body: JSON.stringify(request)
		}).then((response) => response.json());

		console.log(resp);
	};

	onMount(loadDistances);

	$effect(() => {
		if (!mapContainer) return;
		initMap();
	});
</script>

{#await orderedLibs}
	Please wait...
{:then libs}
	<div class="container">
		<div class="flex flex-col flex-wrap max-md:h-screen">
			<div>
				Your best choice is:
				<div
					class="flex w-full flex-row flex-wrap items-center justify-center gap-1 py-10 text-8xl font-bold"
				>
					<div>
						{libs[0].bib}
					</div>
				</div>
			</div>
		</div>

		<div bind:this={mapContainer} class="h-96 w-full"></div>
	</div>

	{#each libs.slice(1, libs.length) as lib}
		<p>{lib.bib}</p>
	{/each}
{:catch error}
	<p>{error.message}</p>
{/await}
