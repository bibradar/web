<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Lib } from '$lib/types.js';
	import { onMount } from 'svelte';

	import * as Card from '$lib/components/ui/card/index.js';
	import Bar from '$lib/components/custom/Bar.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

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
			zoom: 15,
			styles: [
				{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
				{ elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
				{ elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
				{
					featureType: 'administrative.locality',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#d59563' }]
				},
				{
					featureType: 'poi',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#d59563' }]
				},
				{
					featureType: 'poi.park',
					elementType: 'geometry',
					stylers: [{ color: '#263c3f' }]
				},
				{
					featureType: 'poi.park',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#6b9a76' }]
				},
				{
					featureType: 'road',
					elementType: 'geometry',
					stylers: [{ color: '#38414e' }]
				},
				{
					featureType: 'road',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#212a37' }]
				},
				{
					featureType: 'road',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#9ca5b3' }]
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry',
					stylers: [{ color: '#746855' }]
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#1f2835' }]
				},
				{
					featureType: 'road.highway',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#f3d19c' }]
				},
				{
					featureType: 'transit',
					elementType: 'geometry',
					stylers: [{ color: '#2f3948' }]
				},
				{
					featureType: 'transit.station',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#d59563' }]
				},
				{
					featureType: 'water',
					elementType: 'geometry',
					stylers: [{ color: '#17263c' }]
				},
				{
					featureType: 'water',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#515c6d' }]
				},
				{
					featureType: 'water',
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#17263c' }]
				}
			]
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
			body: JSON.stringify(request),
			headers: {
				'Content-Type': 'application/json'
			}
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
		<div
			class="flex flex-col flex-wrap items-center justify-center pt-10 text-center max-md:h-screen"
		>
			<div>
				<span class="text-xl"> Your best choice right now is: </span>
				<div
					class="flex w-full flex-row flex-wrap items-center justify-center gap-1 pb-10 pt-4 text-4xl font-bold"
				>
					<div>
						<svg
							width="1em"
							height="1em"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							><path
								d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,10.84 21.79,9.69 21.39,8.61L19.79,10.21C19.93,10.8 20,11.4 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.6,4 13.2,4.07 13.79,4.21L15.4,2.6C14.31,2.21 13.16,2 12,2M19,2L15,6V7.5L12.45,10.05C12.3,10 12.15,10 12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12C14,11.85 14,11.7 13.95,11.55L16.5,9H18L22,5H19V2M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12H16A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8V6Z"
							/></svg
						>
					</div>
					<div>
						{libs[0].bib}
					</div>
				</div>
				<div class="flex flex-grow items-end justify-center p-4 md:hidden">
					<!--	Arrow down icon-->
					<svg
						width="50px"
						height="50px"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12 4V20M12 20L8 16M12 20L16 16"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-4 md:flex-row">
			<Card.Root
				class="h-[550px] min-h-[550px] w-full min-w-[370px] flex-grow  overflow-clip md:w-[370px]"
			>
				<Card.Content class="h-full w-full p-0">
					<div bind:this={mapContainer} class="h-full w-full"></div>
				</Card.Content>
			</Card.Root>
			<Card.Root class="h-[550px] min-h-[550px] w-full min-w-[370px] flex-grow md:w-[370px]">
				<Card.Header>
					<CardTitle>You will arrive in 35min</CardTitle>
					<Card.Description>hurry up, so you can catch a spot!</Card.Description>
				</Card.Header>
				<Card.Content class="flex h-full items-center justify-center">
					<Bar
						data={[0.0, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.6, 0.5].map((o, i) => ({
							name: (i + 8) % 3 === 0 ? i + 8 : '',
							avg: o * 100,
							actual: Math.min(o * 100 - (5 - Math.random() * 20), 99)
						}))}
						cutoff={13}
					/>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex w-full items-center justify-center pt-10">
			<Button href="/">Go back to overview</Button>
		</div>
	</div>
{:catch error}
	<p>{error.message}</p>
{/await}
