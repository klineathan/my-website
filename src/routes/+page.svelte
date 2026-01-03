<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	const images = [
		{ src: '/pic_1.JPEG', thought: 'Wow, who knew there were medieval castle ruins in Missouri?' },
		{ src: '/pic_2.JPEG', thought: "How the f*ck did I let you convince me to do this, Peter?" },
		{ src: '/pic_3.JPEG', thought: 'Flow state' },
		{ src: '/pic_4.PNG', thought: "I'll have what I'm having" }
	];

	let currentIndex = $state(0);
	let intervalId: ReturnType<typeof setInterval>;

	onMount(() => {
		intervalId = setInterval(() => {
			currentIndex = (currentIndex + 1) % images.length;
		}, 4000);
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});
</script>

<main>
	<section class="inter-dimensional-tavern-front">
		<div class="dialogue">
			<h1>Welcome, traveler!</h1>
			<p class="intro-dialogue">
				It seems our wavepackets have collided and somehow you've made it into my... library? Well,
				the name's Jonathan, but everyone calls me Jon. Have a look around and let me know if you
				need anything.
			</p>
			<span>-> </span><a href="mailto:jon.kline@hey.com">jon.kline@hey.com</a>
		</div>
		<div class="avatar-container">
			{#key currentIndex}
				<div class="thought-bubble">
					<span class="thought-text">{images[currentIndex].thought}</span>
				</div>
			{/key}
			{#each images as image, i}
				<img
					src={image.src}
					alt="Jon Kline"
					class="avatar"
					class:active={i === currentIndex}
				/>
			{/each}
		</div>
	</section>

	<section>
		<h2><a href="#">What have I been up to?</a></h2>
		<p>See <a href="#">my timeline</a> to get personal with Jon</p>

		<h2>Artifacts of making and experimenting</h2>
		<ul>
			<li><a href="#">Dumpling, the JDM camper van</a></li>
			<li><a href="#">Experiences of daily driving a Linux smartphone</a></li>
			<li><a href="#">Declaring war against algorithmic content recommendation</a></li>
		</ul>

		<h2>Articles</h2>
		<ul>
			<li><a href="#">2026: The year of the Linux smartphone</a></li>
		</ul>

		<h2>Other fun stuff</h2>
		<ul>
			<li><a href="#">A list of my favorite things in life</a></li>
			<li><a href="#">People, organizations, and places that inspire me</a></li>
			<li><a href="#">Gift ideas for mom</a></li>
		</ul>
	</section>
</main>

