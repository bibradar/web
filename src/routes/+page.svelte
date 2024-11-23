<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Bar from '$lib/components/custom/Bar.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	let { data } = $props();

	let searchInput: HTMLInputElement | undefined = $state();
	let selectedPosition = $state('');

	if (browser) {
		async function initMap(): Promise<void> {
			if (!searchInput) return;

			const { SearchBox } = (await google.maps.importLibrary(
				'places'
			)) as google.maps.PlacesLibrary;

			const center = { lat: 48.1487681, lng: 11.5633055 };
			// Create a bounding box with sides ~10km away from the center point
			const defaultBounds = {
				north: center.lat + 0.1,
				south: center.lat - 0.1,
				east: center.lng + 0.1,
				west: center.lng - 0.1
			};
			const options = {
				bounds: defaultBounds,
				componentRestrictions: { country: 'us' },
				fields: ['address_components', 'geometry', 'icon', 'name'],
				strictBounds: false
			};

			let searchBox = new SearchBox(searchInput, options);
			searchBox.addListener('places_changed', () => {
				const places = searchBox.getPlaces();
				if (!places || places.length === 0) {
					return;
				}
				const place = places[0];
				console.log(place.geometry?.location?.lat(), place.geometry?.location?.lng());
				selectedPosition = `${place.geometry?.location?.lat()},${place.geometry?.location?.lng()}`;
			});
		}

		$effect(() => {
			if (!searchInput) return;
			initMap();
		});
	}
</script>

<div class="container">
	<div class="flex w-full flex-col items-center justify-center gap-4 py-10 text-4xl font-bold">
		BibRadar.de
	</div>

	<div class="flex flex-col items-start justify-center gap-3 py-8">
		... tell us where you are right now so we can find the best lib for you to go to considering
		travel time and occupation!

		<div class="flex w-full flex-row">
			<Input bind:ref={searchInput} placeholder="Enter your location" class="flex-grow" />

			<Button
				disabled={!selectedPosition}
				href={`/predict-with-position?user-position=${selectedPosition}`}>Click me</Button
			>
		</div>
	</div>

	<div class="flex flex-row flex-wrap items-start justify-between gap-4">
		{#each data.libs as lib}
			<Card.Root class="w-1/4">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<div class="flex flex-col space-y-1.5">
						<Card.Title>{lib.name}</Card.Title>
						<Card.Description>{lib.location}</Card.Description>
					</div>
					<div class="h-10 w-2 rounded bg-red-500"></div>
				</Card.Header>
				<Card.Content>
					{#await lib.occupations}
						loading
					{:then occupation}
						<Bar data={occupation.map((o) => ({ name: '', total: o * 100 }))} />
					{/await}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>
