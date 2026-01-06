<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();
	let copiedId = $state<string | null>(null);

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

	async function copyLink(postId: string) {
		const url = `${$page.url.origin}/timeline/${postId}`;
		await navigator.clipboard.writeText(url);
		copiedId = postId;
		setTimeout(() => {
			copiedId = null;
		}, 2000);
	}
</script>

<svelte:head>
	<title>Timeline | Jon Kline</title>
</svelte:head>

<main class="timeline-page">
	<header class="timeline-header">
		<a href="/" class="back-link">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
			Back to the library
		</a>
		<h1>The Timeline</h1>
		<p class="subtitle">Dispatches from Jon's timeline</p>
	</header>

	{#if data.error}
		<div class="error-state">
			<p>The messenger pigeon got lost. Try again later.</p>
		</div>
	{:else if data.posts.length === 0}
		<div class="empty-state">
			<p>No tales to tell... yet.</p>
		</div>
	{:else}
		<div class="timeline">
			{#each data.posts as post, i}
				<article class="post" style="animation-delay: {i * 80}ms">
					<div class="post-timestamp">
						<span class="date">{formatDate(post.createdAt)}</span>
						<span class="time">{formatTime(post.createdAt)}</span>
					</div>
					
					<div class="post-content">
						<div class="post-header-row">
							<h2 class="post-title">
								<a href="/timeline/{post.id}">{post.title}</a>
							</h2>
							<button 
								class="share-button" 
								onclick={() => copyLink(post.id)}
								title={copiedId === post.id ? 'Copied!' : 'Copy link'}
								aria-label="Copy link to clipboard"
							>
								{#if copiedId === post.id}
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								{:else}
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
										<polyline points="16 6 12 2 8 6"></polyline>
										<line x1="12" y1="2" x2="12" y2="15"></line>
									</svg>
								{/if}
							</button>
						</div>
						
						{#if post.media.length > 0}
							<div class="post-media" class:multiple={post.media.length > 1}>
								{#each post.media as media}
									{#if media.mediaType === 'image'}
										<img 
											src={media.url} 
											alt={media.altText || post.title}
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
							{@html post.content}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</main>

<style>
	.timeline-page {
		max-width: 640px;
		margin: 0 auto;
		padding: 3rem 2rem 4rem;
	}

	.timeline-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.back-link:hover {
		opacity: 1;
	}

	.timeline-header h1 {
		font-family: "Rye", serif;
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		letter-spacing: 0.04em;
	}

	.subtitle {
		font-style: italic;
		opacity: 0.75;
		font-size: 1.05rem;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.post {
		position: relative;
		padding-left: 1rem;
		border-left: 2px solid rgba(237, 234, 224, 0.25);
		animation: slideIn 0.5s ease-out backwards;
	}

	.post::before {
		content: '';
		position: absolute;
		left: -6px;
		top: 0.35rem;
		width: 10px;
		height: 10px;
		background: #EDEAE0;
		border-radius: 50%;
		box-shadow: 0 0 0 3px #893F45;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.post-timestamp {
		display: flex;
		gap: 0.75rem;
		font-size: 0.85rem;
		opacity: 0.7;
		margin-bottom: 0.5rem;
		font-variant-numeric: tabular-nums;
	}

	.date {
		font-weight: 500;
	}

	.time {
		font-style: italic;
	}

	.post-content {
		background: rgba(237, 234, 224, 0.08);
		border-radius: 0.75rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid rgba(237, 234, 224, 0.12);
	}

	.post-header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.post-title {
		font-family: "Rye", serif;
		font-size: 1.15rem;
		font-weight: 400;
		letter-spacing: 0.02em;
		line-height: 1.3;
	}

	.post-title a {
		color: inherit;
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	.post-title a:hover {
		opacity: 0.8;
	}

	.share-button {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		background: rgba(237, 234, 224, 0.08);
		border: 1px solid rgba(237, 234, 224, 0.15);
		border-radius: 0.4rem;
		color: inherit;
		cursor: pointer;
		opacity: 0.5;
		transition: all 0.2s ease;
	}

	.share-button:hover {
		opacity: 1;
		background: rgba(237, 234, 224, 0.12);
	}

	.post-media {
		margin: 1rem 0;
		border-radius: 0.5rem;
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
		border-radius: 0.5rem;
	}

	.post-body {
		font-size: 1rem;
		line-height: 1.7;
	}

	.post-body :global(p) {
		margin-bottom: 0.75rem;
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

	.empty-state,
	.error-state {
		text-align: center;
		padding: 3rem 2rem;
		font-style: italic;
		opacity: 0.75;
		border: 1px dashed rgba(237, 234, 224, 0.3);
		border-radius: 0.75rem;
	}

	@media (max-width: 500px) {
		.timeline-page {
			padding: 2rem 1.25rem 3rem;
		}

		.timeline-header h1 {
			font-size: 2rem;
		}

		.post-content {
			padding: 1rem 1.25rem;
		}

		.post-media.multiple {
			grid-template-columns: 1fr;
		}
	}
</style>

