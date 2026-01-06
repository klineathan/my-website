<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Jon Kline</title>
</svelte:head>

{@render children()}
