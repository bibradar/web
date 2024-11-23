<script lang="ts">
	import { page } from '$app/stores';

	const { data } = $props();
</script>

{#await data.distances}
	Please wait...
{:then distances}
	{#each distances as distance}
		<p>{distance.end_address}: {distance.arrival_time.text}</p>
	{/each}
{:catch error}
	<p>{error.message}</p>
{/await}
