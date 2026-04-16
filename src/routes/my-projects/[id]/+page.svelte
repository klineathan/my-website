<script lang="ts">
	import MediaLightbox from '$lib/components/MediaLightbox.svelte';

	let { data } = $props();
	let lightboxIndex = $state(0);
	let lightboxOpen = $state(false);

	interface MediaItem {
		id: string;
		url: string;
		mediaType: 'image' | 'video';
		altText: string | null;
		caption: string | null;
		width: number | null;
		height: number | null;
	}

	function openLightbox(index: number) {
		lightboxIndex = index;
		lightboxOpen = true;
	}

	function handleImageLoad(node: HTMLImageElement) {
		if (node.complete && node.naturalWidth > 0) {
			node.classList.add('loaded');
		} else {
			node.addEventListener('load', () => node.classList.add('loaded'));
		}
	}

	function handleVideoLoad(node: HTMLVideoElement) {
		const placeholder = node.previousElementSibling;
		if (!placeholder) return;

		function hidePlaceholder() {
			(placeholder as HTMLElement).style.display = 'none';
		}

		if (node.readyState >= 1) {
			hidePlaceholder();
		} else {
			node.addEventListener('loadedmetadata', hidePlaceholder, { once: true });
		}
	}

	function mediaAspectRatio(m: MediaItem): string {
		if (m.width && m.height) return `${m.width} / ${m.height}`;
		return '4 / 3';
	}
</script>

<svelte:head>
	{#await data.projectData}
		<title>Loading... | Jon Kline</title>
	{:then project}
		<title>{project.title} | Jon Kline</title>
		<meta name="description" content={project.description || project.title} />
	{/await}
</svelte:head>

<main class="project-page">
	<header class="page-header">
		<a href="/" class="back-link">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
			Back to the library
		</a>
	</header>

	{#await data.projectData}
		<article class="project skeleton-project">
			<header class="project-header">
				<div class="skeleton-line" style="width: 70%; height: 1.5rem"></div>
			</header>
			<div class="skeleton-media-block"></div>
			<div class="skeleton-body">
				<div class="skeleton-line"></div>
				<div class="skeleton-line" style="width: 92%"></div>
				<div class="skeleton-line" style="width: 78%"></div>
				<div class="skeleton-line" style="width: 85%"></div>
				<div class="skeleton-line" style="width: 60%"></div>
			</div>
		</article>
	{:then project}
		<article class="project">
			<header class="project-header">
				<h1 class="project-title">{project.title}</h1>
			</header>

			{#if project.url}
				<div class="site-preview">
					<iframe
						src={project.url}
						title="Live preview of {project.title}"
						sandbox="allow-scripts allow-same-origin"
						loading="lazy"
					></iframe>
					<a
						href={project.url}
						target="_blank"
						rel="noopener noreferrer"
						class="site-preview-overlay"
					>
						<div class="site-preview-cta">
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
								<polyline points="15 3 21 3 21 9"></polyline>
								<line x1="10" y1="14" x2="21" y2="3"></line>
							</svg>
							<span>Open site</span>
						</div>
					</a>
				</div>
			{/if}

			{#if project.media?.length > 0}
				<div class="project-media" class:multiple={project.media.length > 1}>
					{#each project.media as mediaItem, mediaIndex}
						{#if mediaItem.mediaType === 'image'}
							<div
								class="media-item media-clickable"
								style="aspect-ratio: {mediaAspectRatio(mediaItem)}"
								onclick={() => openLightbox(mediaIndex)}
								onkeydown={(e) => e.key === 'Enter' && openLightbox(mediaIndex)}
								role="button"
								tabindex="0"
								aria-label="View image fullscreen"
							>
								<div class="media-placeholder"></div>
								<img
									src={mediaItem.url}
									alt={mediaItem.altText || project.title}
									loading="lazy"
									use:handleImageLoad
								/>
							</div>
						{:else if mediaItem.mediaType === 'video'}
							<div class="media-item" style="aspect-ratio: {mediaAspectRatio(mediaItem)}">
								<div class="media-placeholder"></div>
								<video controls preload="metadata" use:handleVideoLoad>
									<source src={mediaItem.url} />
									<track kind="captions" />
								</video>
								<button
									class="media-expand-btn"
									onclick={() => openLightbox(mediaIndex)}
									aria-label="View video fullscreen"
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="15 3 21 3 21 9"></polyline>
										<polyline points="9 21 3 21 3 15"></polyline>
										<line x1="21" y1="3" x2="14" y2="10"></line>
										<line x1="3" y1="21" x2="10" y2="14"></line>
									</svg>
								</button>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			{#if project.content}
				<div class="project-body">
					{@html project.content}
				</div>
			{/if}

		</article>

		<MediaLightbox media={project.media ?? []} startIndex={lightboxIndex} bind:open={lightboxOpen} />
	{:catch}
		<div class="error-state">
			<p>Something went wrong loading this project. Try again later.</p>
		</div>
	{/await}
</main>

<style>
	.project-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 3rem 2rem 4rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.9rem;
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.back-link:hover {
		opacity: 1;
	}

	.project {
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.project-header {
		margin-bottom: 1.5rem;
	}

	.project-title {
		font-family: "Rye", serif;
		font-size: 1.75rem;
		font-weight: 400;
		letter-spacing: 0.02em;
		line-height: 1.3;
	}

	.site-preview {
		position: relative;
		aspect-ratio: 16 / 9;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid rgba(237, 234, 224, 0.15);
		margin-bottom: 1.5rem;
		background: rgba(237, 234, 224, 0.04);
	}

	.site-preview iframe {
		width: 100%;
		height: 100%;
		border: none;
		pointer-events: none;
		display: block;
	}

	.site-preview-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		text-decoration: none;
		color: #fff;
		transition: background 0.25s ease;
	}

	.site-preview-overlay:hover {
		background: rgba(0, 0, 0, 0.45);
		text-decoration: none;
	}

	.site-preview-cta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.3rem;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		font-size: 0.95rem;
		font-weight: 500;
		opacity: 0;
		transform: translateY(4px);
		transition: opacity 0.25s ease, transform 0.25s ease;
	}

	.site-preview-overlay:hover .site-preview-cta {
		opacity: 1;
		transform: translateY(0);
	}

	.project-media {
		margin: 1.5rem 0;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.project-media.multiple {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.media-item {
		position: relative;
		border-radius: 0.75rem;
		overflow: hidden;
		background: rgba(237, 234, 224, 0.06);
	}

	.media-placeholder {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			rgba(237, 234, 224, 0.05) 25%,
			rgba(237, 234, 224, 0.12) 50%,
			rgba(237, 234, 224, 0.05) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.media-item img {
		position: relative;
		width: 100%;
		height: auto;
		display: block;
		border-radius: 0.75rem;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.media-item :global(img.loaded) {
		opacity: 1;
	}

	.media-item video {
		position: relative;
		width: 100%;
		height: auto;
		display: block;
		border-radius: 0.75rem;
		background: #000;
	}

	.media-clickable {
		cursor: pointer;
	}

	.media-expand-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.35rem;
		color: #fff;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s ease, background 0.2s ease;
	}

	.media-item:hover .media-expand-btn {
		opacity: 1;
	}

	.media-expand-btn:hover {
		background: rgba(0, 0, 0, 0.75);
	}

	.project-body {
		font-size: 1.1rem;
		line-height: 1.8;
	}

	.project-body :global(p) {
		margin-bottom: 1rem;
	}

	.project-body :global(p:last-child) {
		margin-bottom: 0;
	}

	.project-body :global(a) {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: rgba(237, 234, 224, 0.5);
		text-underline-offset: 2px;
	}

	.project-body :global(a:hover) {
		text-decoration-color: currentColor;
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	.skeleton-project {
		animation: none;
	}

	.skeleton-line {
		display: block;
		height: 0.85rem;
		border-radius: 0.25rem;
		background: linear-gradient(
			90deg,
			rgba(237, 234, 224, 0.05) 25%,
			rgba(237, 234, 224, 0.12) 50%,
			rgba(237, 234, 224, 0.05) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.skeleton-media-block {
		aspect-ratio: 16 / 9;
		border-radius: 0.75rem;
		margin: 1.5rem 0;
		background: linear-gradient(
			90deg,
			rgba(237, 234, 224, 0.05) 25%,
			rgba(237, 234, 224, 0.12) 50%,
			rgba(237, 234, 224, 0.05) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.skeleton-body {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.error-state {
		text-align: center;
		padding: 3rem 2rem;
		font-style: italic;
		opacity: 0.75;
		border: 1px dashed rgba(237, 234, 224, 0.3);
		border-radius: 0.75rem;
	}

	@media (max-width: 500px) {
		.project-page {
			padding: 2rem 1.25rem 3rem;
		}

		.project-title {
			font-size: 1.5rem;
		}

		.project-media.multiple {
			grid-template-columns: 1fr;
		}
	}
</style>
