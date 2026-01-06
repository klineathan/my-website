<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();
	let copied = $state(false);

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	async function copyLink() {
		const url = $page.url.href;
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<svelte:head>
	<title>{data.post.title} | Timeline | Jon Kline</title>
	<meta name="description" content={data.post.excerpt || data.post.title} />
</svelte:head>

<main class="post-page">
	<header class="page-header">
		<a href="/timeline" class="back-link">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
			Back to timeline
		</a>
	</header>

	<article class="post">
		<header class="post-header">
			<div class="post-timestamp">
				<span class="date">{formatDate(data.post.createdAt)}</span>
				<span class="time">{formatTime(data.post.createdAt)}</span>
			</div>
			<div class="post-header-row">
				<h1 class="post-title">{data.post.title}</h1>
				<button 
					class="share-button" 
					onclick={copyLink}
					title={copied ? 'Copied!' : 'Copy link'}
					aria-label="Copy link to clipboard"
				>
					{#if copied}
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					{:else}
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
							<polyline points="16 6 12 2 8 6"></polyline>
							<line x1="12" y1="2" x2="12" y2="15"></line>
						</svg>
					{/if}
				</button>
			</div>
		</header>
		
		{#if data.post.media?.length > 0}
			<div class="post-media" class:multiple={data.post.media.length > 1}>
				{#each data.post.media as media}
					{#if media.mediaType === 'image'}
						<img 
							src={media.url} 
							alt={media.altText || data.post.title}
							loading="lazy"
						/>
					{:else if media.mediaType === 'video'}
						<video controls>
							<source src={media.url} />
							<track kind="captions" />
						</video>
					{/if}
				{/each}
			</div>
		{/if}
		
		<div class="post-body">
			{@html data.post.content}
		</div>
	</article>
</main>

<style>
	.post-page {
		max-width: 640px;
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

	.post {
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

	.post-header {
		margin-bottom: 1.5rem;
	}

	.post-timestamp {
		display: flex;
		gap: 0.75rem;
		font-size: 0.85rem;
		opacity: 0.7;
		margin-bottom: 0.75rem;
		font-variant-numeric: tabular-nums;
	}

	.date {
		font-weight: 500;
	}

	.time {
		font-style: italic;
	}

	.post-header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.post-title {
		font-family: "Rye", serif;
		font-size: 1.75rem;
		font-weight: 400;
		letter-spacing: 0.02em;
		line-height: 1.3;
	}

	.share-button {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: rgba(237, 234, 224, 0.1);
		border: 1px solid rgba(237, 234, 224, 0.2);
		border-radius: 0.5rem;
		color: inherit;
		cursor: pointer;
		opacity: 0.7;
		transition: all 0.2s ease;
	}

	.share-button:hover {
		opacity: 1;
		background: rgba(237, 234, 224, 0.15);
	}

	.post-media {
		margin: 1.5rem 0;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.post-media.multiple {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.post-media img,
	.post-media video {
		width: 100%;
		height: auto;
		display: block;
		border-radius: 0.75rem;
	}

	.post-body {
		font-size: 1.1rem;
		line-height: 1.8;
	}

	.post-body :global(p) {
		margin-bottom: 1rem;
	}

	.post-body :global(p:last-child) {
		margin-bottom: 0;
	}

	.post-body :global(a) {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: rgba(237, 234, 224, 0.5);
		text-underline-offset: 2px;
	}

	.post-body :global(a:hover) {
		text-decoration-color: currentColor;
	}

	@media (max-width: 500px) {
		.post-page {
			padding: 2rem 1.25rem 3rem;
		}

		.post-title {
			font-size: 1.5rem;
		}

		.post-media.multiple {
			grid-template-columns: 1fr;
		}
	}
</style>

