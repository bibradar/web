<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const { data } = $props();

	let distances = $state(new Promise(() => {}));

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
		for (let i = 0; i < 10; i++) {
			promises.push(
				new Promise<google.maps.DirectionsLeg>((resolve, reject) => {
					directionsService.route(
						{
							origin: userCoordinates,
							destination: 'Phillologicum, Ludwigstraße 25, 80539 München',
							travelMode: google.maps.TravelMode.TRANSIT
						},
						(response, status) => {
							if (!response || status !== 'OK') {
								console.error('Directions request failed due to ' + status);
								reject();
								return;
							}
							resolve(response.routes[0].legs[0]);
						}
					);
				})
			);
		}

		distances = Promise.all(promises);
	};

	onMount(loadDistances);
</script>

{#await distances}
	Please wait...
{:then distances}
	{#each distances as distance}
		<p>{distance.end_address}: {distance.arrival_time.text}</p>
	{/each}
{:catch error}
	<p>{error.message}</p>
{/await}
