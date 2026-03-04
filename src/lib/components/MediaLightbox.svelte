<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		media: {
			id: string;
			url: string;
			mediaType: 'image' | 'video';
			altText: string | null;
			caption: string | null;
			width: number | null;
			height: number | null;
		}[];
		startIndex?: number;
		open: boolean;
	}

	let { media = [], startIndex = 0, open = $bindable(false) }: Props = $props();

	let currentIndex = $state(0);
	let overlayEl: HTMLElement | undefined = $state();
	let touchStartX = 0;
	let touchStartY = 0;

	$effect(() => {
		if (open) {
			currentIndex = untrack(() => startIndex);
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});

	function close() {
		open = false;
	}

	function goPrev(e?: Event) {
		e?.stopPropagation();
		if (media.length <= 1) return;
		currentIndex = (currentIndex - 1 + media.length) % media.length;
	}

	function goNext(e?: Event) {
		e?.stopPropagation();
		if (media.length <= 1) return;
		currentIndex = (currentIndex + 1) % media.length;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') close();
		else if (e.key === 'ArrowLeft') goPrev();
		else if (e.key === 'ArrowRight') goNext();
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === overlayEl) close();
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (media.length <= 1) return;
		const dx = e.changedTouches[0].clientX - touchStartX;
		const dy = e.changedTouches[0].clientY - touchStartY;
		if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
			if (dx > 0) goPrev();
			else goNext();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && media.length > 0}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="lightbox-overlay"
		bind:this={overlayEl}
		onclick={handleOverlayClick}
		onkeydown={handleKeydown}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		aria-label="Media viewer"
	>
		<button class="lightbox-close" onclick={close} aria-label="Close">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>

		{#if media.length > 1}
			<button class="lightbox-nav lightbox-prev" onclick={(e) => goPrev(e)} aria-label="Previous">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</button>
			<button class="lightbox-nav lightbox-next" onclick={(e) => goNext(e)} aria-label="Next">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 6 15 12 9 18"></polyline>
				</svg>
			</button>
		{/if}

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="lightbox-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
		>
			{#key currentIndex}
				{@const item = media[currentIndex]}
				{#if item}
					<div class="lightbox-media">
						{#if item.mediaType === 'image'}
							<img src={item.url} alt={item.altText || ''} />
						{:else if item.mediaType === 'video'}
							<video controls autoplay>
								<source src={item.url} />
								<track kind="captions" />
							</video>
						{/if}
					</div>
				{/if}
			{/key}
		</div>

		{#if media.length > 1}
			<div class="lightbox-counter">
				{currentIndex + 1} / {media.length}
			</div>
		{/if}
	</div>
{/if}

<style>
	.lightbox-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.92);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: lightbox-fade-in 0.2s ease-out;
	}

	@keyframes lightbox-fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.lightbox-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 50%;
		color: #fff;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.lightbox-close:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.lightbox-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 50%;
		color: #fff;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.lightbox-nav:hover {
		background: rgba(255, 255, 255, 0.18);
	}

	.lightbox-prev {
		left: 1rem;
	}

	.lightbox-next {
		right: 1rem;
	}

	.lightbox-content {
		position: relative;
		z-index: 2;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox-media {
		animation: lightbox-zoom-in 0.2s ease-out;
	}

	@keyframes lightbox-zoom-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.lightbox-media img {
		max-width: 90vw;
		max-height: 90vh;
		object-fit: contain;
		border-radius: 0.5rem;
		display: block;
	}

	.lightbox-media video {
		max-width: 90vw;
		max-height: 90vh;
		border-radius: 0.5rem;
		display: block;
		background: #000;
	}

	.lightbox-counter {
		position: absolute;
		bottom: 1.25rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
		font-family: "Spectral", serif;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		padding: 0.35rem 0.9rem;
		border-radius: 1rem;
		pointer-events: none;
		letter-spacing: 0.1em;
	}

	@media (max-width: 600px) {
		.lightbox-nav {
			width: 40px;
			height: 40px;
		}

		.lightbox-prev {
			left: 0.5rem;
		}

		.lightbox-next {
			right: 0.5rem;
		}

		.lightbox-close {
			top: 0.75rem;
			right: 0.75rem;
			width: 40px;
			height: 40px;
		}
	}
</style>
