<script lang="ts">
	import { browser } from '$app/environment';
	import Bar from '$lib/components/custom/Bar.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import Input from '$lib/components/ui/input/input.svelte';

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
	<div class="flex flex-col flex-wrap justify-center max-md:h-screen">
		<div>
			<div
				class="flex w-full flex-row flex-wrap items-center justify-center gap-1 py-10 text-8xl font-bold"
			>
				<div>Bib</div>
				<div>
					<svg
						width="100px"
						height="100px"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M4 8C4 5.17157 4 3.75736 4.87868 2.87868C5.75736 2 7.17157 2 10 2H14C16.8284 2 18.2426 2 19.1213 2.87868C20 3.75736 20 5.17157 20 8V16C20 18.8284 20 20.2426 19.1213 21.1213C18.2426 22 16.8284 22 14 22H10C7.17157 22 5.75736 22 4.87868 21.1213C4 20.2426 4 18.8284 4 16V8Z"
							stroke="currentColor"
							stroke-width="1.5"
						/>
						<path
							d="M19.8978 16H7.89778C6.96781 16 6.50282 16 6.12132 16.1022C5.08604 16.3796 4.2774 17.1883 4 18.2235"
							stroke="currentColor"
							stroke-width="1.5"
						/>
						<path d="M7 16V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
						<path
							d="M13 16V19.5309C13 19.8065 13 19.9443 12.9051 20C12.8103 20.0557 12.6806 19.9941 12.4211 19.8708L11.1789 19.2808C11.0911 19.2391 11.0472 19.2182 11 19.2182C10.9528 19.2182 10.9089 19.2391 10.8211 19.2808L9.57889 19.8708C9.31943 19.9941 9.18971 20.0557 9.09485 20C9 19.9443 9 19.8065 9 19.5309V16.45"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
				</div>
				<div>Radar</div>
			</div>
			<!--	Centerd text under the logo-->
			<div class="text-center">... find the nearest free library spot!</div>
			{#if data.libs.length > 0}
				<div class="flex w-full flex-col flex-wrap justify-center gap-4 py-8">
					<Input bind:ref={searchInput} placeholder="Where are you right now?" class="flex-grow" />
					<Button
						class="flex-grow"
						disabled={!selectedPosition}
						href={`/predict-with-position?user-position=${selectedPosition}`}
					>Let's study!
					</Button>
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
			{:else}
				<div class="flex flex-grow items-center justify-center p-10">
					<div class="text-2xl text-center font-bold">
						We are currently experiencing technical difficulties. <br>
						The website should soon be back up and running.
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if data.libs.length > 0}
		<div class="flex flex-row flex-wrap items-start justify-between gap-4">
			{#each data.libs as lib}
				<Card.Root class="h-[550px] min-h-[550px] w-[370px] min-w-[370px] flex-grow">
					<Card.Header class="flex flex-row items-center justify-start gap-2 pb-2">
						<div
							class="mt-2 h-10 min-h-10 w-2 min-w-2 rounded {(lib.occupations.find((o) => o > 0.8) &&
							'bg-red-500') ||
							'bg-[#688e26]'}"
						></div>
						<div class="flex flex-col">
							<Card.Title>{lib.bib}</Card.Title>
							<Card.Description>{lib.location}</Card.Description>
						</div>
					</Card.Header>
					<Card.Content>
						<Bar
							data={lib.occupations.map((o, i) => ({
							name: (i + 8) % 3 === 0 ? i + 5 : '',
							avg: lib.averages[i] * 100,
							actual: o * 100
						}))}
							cutoff={new Date().getHours() + 4}
						/>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
