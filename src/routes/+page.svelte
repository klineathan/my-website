<script lang="ts">
	const images = [
		{ src: '/pic_1.JPEG', thought: 'Who knew there were medieval castle ruins in Missouri?' },
		{ src: '/pic_2.JPEG', thought: "How did Peter convince me to do this?" },
		{ src: '/pic_3.PNG', thought: "I'll have what I'm having" }
	];

	let currentIndex = $state(0);

	function prev() {
		currentIndex = (currentIndex - 1 + images.length) % images.length;
	}

	function next() {
		currentIndex = (currentIndex + 1) % images.length;
	}
</script>

<main>
	<section class="inter-dimensional-tavern-front">
		<div class="dialogue">
			<h1>Welcome, traveler!</h1>
			<p class="intro-dialogue">
				It seems our wavepackets have collided and somehow you've made it into my... library? Well,
				my name's Jonathan, but everyone calls me Jon. Have a look around and let me know if you
				need anything.
			</p>
			<span>-> <a href="mailto:jon.kline@hey.com">jon.kline@hey.com</a></span>
      <!--<p>What's your favorite food?</p>-->
      <p class="flavor-text">Come back when you've found that soundrel, Brodigan!</p>
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
			<div class="carousel-nav">
				<button class="nav-arrow" onclick={prev} aria-label="Previous image">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="15 18 9 12 15 6"></polyline>
					</svg>
				</button>
				<button class="nav-arrow" onclick={next} aria-label="Next image">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="9 18 15 12 9 6"></polyline>
					</svg>
				</button>
			</div>
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
			<li><a href="#">Rejecting hyper-convenience: The start of a character-driven path through consumer technology</a></li>
		</ul>

		<h2>Other fun stuff</h2>
		<ul>
			<li><a href="#">A list of my favorite things in life</a></li>
			<li><a href="#">People, organizations, and places that inspire me</a></li>
			<li><a href="#">Gift ideas for mom</a></li>
		</ul>
	</section>
</main>

