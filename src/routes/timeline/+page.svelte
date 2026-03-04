<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import MediaLightbox from '$lib/components/MediaLightbox.svelte';

	let { data, form } = $props();

	interface MediaItem {
		id: string;
		url: string;
		mediaType: 'image' | 'video';
		altText: string | null;
		caption: string | null;
		width: number | null;
		height: number | null;
	}

	interface Comment {
		id: string;
		postId: string;
		parentId: string | null;
		authorName: string;
		content: string;
		isOwner: boolean;
		createdAt: string;
	}

	interface Post {
		id: string;
		title: string;
		content: string;
		excerpt: string | null;
		publishedAt: string;
		createdAt: string;
		updatedAt: string;
		media: MediaItem[];
		comments?: Comment[];
	}

	let copiedId = $state<string | null>(null);
	let submitting = $state(false);
	let formTimestamp = $state(Date.now().toString());

	let commentFormOpen = $state<string | null>(null);
	let commentName = $state('');
	let commentEmail = $state('');
	let commentText = $state('');
	let commentSubmitting = $state(false);
	let commentError = $state<string | null>(null);
	let commentSuccess = $state<string | null>(null);
	let commentOverrides = $state<Record<string, Comment[]>>({});

	let lightboxMedia = $state<MediaItem[]>([]);
	let lightboxIndex = $state(0);
	let lightboxOpen = $state(false);

	function openLightbox(media: MediaItem[], index: number) {
		lightboxMedia = media;
		lightboxIndex = index;
		lightboxOpen = true;
	}

	let extraPosts = $state<Post[]>([]);
	let moreHasMore = $state<boolean | undefined>(undefined);
	let nextPage = $state(2);
	let loadingMore = $state(false);
	let loadMoreError = $state(false);
	let sentinelEl = $state<HTMLElement | null>(null);

	$effect(() => {
		void data.postsData;
		extraPosts = [];
		moreHasMore = undefined;
		nextPage = 2;
		loadMoreError = false;
	});

	$effect(() => {
		const el = sentinelEl;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !loadMoreError) {
					loadMore();
				}
			},
			{ rootMargin: '400px' }
		);

		observer.observe(el);
		return () => observer.disconnect();
	});

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

	async function loadMore() {
		if (loadingMore) return;
		loadingMore = true;
		loadMoreError = false;
		try {
			const response = await fetch(`/api/posts?page=${nextPage}&limit=10`);
			if (!response.ok) throw new Error();
			const result = await response.json();
			extraPosts = [...extraPosts, ...result.data];
			moreHasMore = result.pagination.hasMore;
			nextPage++;
		} catch {
			loadMoreError = true;
		} finally {
			loadingMore = false;
		}
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

	function getPostComments(post: Post): Comment[] {
		const base = post.comments || [];
		const overrides = commentOverrides[post.id];
		if (!overrides) return base;
		const baseIds = new Set(base.map((c) => c.id));
		return [...base, ...overrides.filter((c) => !baseIds.has(c.id))];
	}

	function topLevelComments(allComments: Comment[]): Comment[] {
		return allComments.filter((c) => !c.parentId);
	}

	function getReplies(allComments: Comment[], parentId: string): Comment[] {
		return allComments.filter((c) => c.parentId === parentId);
	}

	function formatCommentDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function toggleCommentForm(postId: string) {
		if (commentFormOpen === postId) {
			commentFormOpen = null;
		} else {
			commentFormOpen = postId;
			commentError = null;
			commentSuccess = null;
		}
	}

	async function submitComment(postId: string) {
		if (!commentName.trim() || !commentEmail.trim() || !commentText.trim()) {
			commentError = 'All fields are required.';
			return;
		}

		commentSubmitting = true;
		commentError = null;

		try {
			const response = await fetch(`/api/posts/${postId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					authorName: commentName.trim(),
					authorEmail: commentEmail.trim(),
					content: commentText.trim()
				})
			});

			if (!response.ok) {
				const result = await response.json();
				commentError = result.message || 'Something went wrong.';
				return;
			}

			const result = await response.json();
			const newComment: Comment = result.data;

			const addCommentToPost = (post: Post): Post => {
				if (post.id === postId) {
					return { ...post, comments: [...(post.comments || []), newComment] };
				}
				return post;
			};

			extraPosts = extraPosts.map(addCommentToPost);

			commentText = '';
			commentSuccess = postId;
			commentFormOpen = null;
			setTimeout(() => {
				if (commentSuccess === postId) commentSuccess = null;
			}, 3000);
		} catch {
			commentError = 'Something went wrong. Please try again.';
		} finally {
			commentSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Timeline | Jon Kline</title>
</svelte:head>

{#snippet postSkeleton(delay: number)}
	<article class="post skeleton-post" style="animation-delay: {delay}ms">
		<div class="post-timestamp">
			<span class="skeleton-line" style="width: 110px"></span>
			<span class="skeleton-line" style="width: 55px"></span>
		</div>
		<div class="post-content">
			<div class="post-header-row">
				<div class="skeleton-line" style="width: 65%; height: 1.15rem"></div>
			</div>
			<div class="skeleton-media-block"></div>
			<div class="post-body skeleton-body">
				<div class="skeleton-line"></div>
				<div class="skeleton-line" style="width: 85%"></div>
				<div class="skeleton-line" style="width: 55%"></div>
			</div>
		</div>
	</article>
{/snippet}

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

		{#if data.subscribed}
			<div class="subscribe-success">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
				<span>You're subscribed! You'll receive monthly updates.</span>
			</div>
		{:else if form?.success}
			<div class="subscribe-success">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
					<polyline points="22,6 12,13 2,6"></polyline>
				</svg>
				<span>Check your email for a confirmation link.</span>
			</div>
		{:else}
			<form
				method="POST"
				action="?/subscribe"
				class="subscribe-form"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
			>
				<div class="subscribe-input-row">
					<input
						type="email"
						name="email"
						placeholder="your@email.com"
						required
						autocomplete="email"
						class="subscribe-input"
						disabled={submitting}
					/>
					<button type="submit" class="subscribe-button" disabled={submitting}>
						{#if submitting}
							Sending...
						{:else}
							Subscribe
						{/if}
					</button>
				</div>
				<input type="text" name="website" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;" tabindex="-1" autocomplete="off" />
				<input type="hidden" name="timestamp" value={formTimestamp} />
				{#if form?.error}
					<p class="subscribe-error">{form.error}</p>
				{/if}
				<p class="subscribe-note">Get a monthly digest of new posts. No spam, unsubscribe anytime.</p>
			</form>
		{/if}
	</header>

	{#await data.postsData}
		<div class="timeline">
			{@render postSkeleton(0)}
			{@render postSkeleton(80)}
			{@render postSkeleton(160)}
		</div>
	{:then result}
		{@const allPosts = [...result.data, ...extraPosts]}
		{@const effectiveHasMore = moreHasMore !== undefined ? moreHasMore : result.pagination.hasMore}

		{#if allPosts.length === 0}
			<div class="empty-state">
				<p>No tales to tell... yet.</p>
			</div>
		{:else}
			<div class="timeline">
				{#each allPosts as post, i (post.id)}
					<article class="post" style="animation-delay: {Math.min(i, 9) * 80}ms">
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
								{#each post.media as mediaItem, mediaIndex}
									{#if mediaItem.mediaType === 'image'}
										<div
											class="media-wrapper media-clickable"
											style="aspect-ratio: {mediaAspectRatio(mediaItem)}"
											onclick={() => openLightbox(post.media, mediaIndex)}
											onkeydown={(e) => e.key === 'Enter' && openLightbox(post.media, mediaIndex)}
											role="button"
											tabindex="0"
											aria-label="View image fullscreen"
										>
											<div class="media-placeholder"></div>
											<img 
												src={mediaItem.url} 
												alt={mediaItem.altText || post.title}
												loading="lazy"
												use:handleImageLoad
											/>
										</div>
									{:else if mediaItem.mediaType === 'video'}
										<div class="media-wrapper" style="aspect-ratio: {mediaAspectRatio(mediaItem)}">
											<div class="media-placeholder"></div>
											<video controls preload="metadata" use:handleVideoLoad>
												<source src={mediaItem.url} />
												<track kind="captions" />
											</video>
											<button
												class="media-expand-btn"
												onclick={() => openLightbox(post.media, mediaIndex)}
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
							
							<div class="post-body">
								{@html post.content}
							</div>

							{#if getPostComments(post).length > 0}
								<div class="comments-section">
									<div class="comments-header">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
										</svg>
										<span>{getPostComments(post).length} comment{getPostComments(post).length !== 1 ? 's' : ''}</span>
									</div>
									<div class="comments-preview">
										{#each topLevelComments(getPostComments(post)) as comment (comment.id)}
											<div class="comment">
												<div class="comment-meta">
													<span class="comment-author">{comment.authorName}</span>
													<span class="comment-time">{formatCommentDate(comment.createdAt)}</span>
												</div>
												<p class="comment-text">{comment.content}</p>
												{#each getReplies(getPostComments(post), comment.id) as reply (reply.id)}
													<div class="comment-reply">
														<div class="comment-meta">
															<span class="comment-author" class:owner-reply={reply.isOwner}>{reply.authorName}</span>
															{#if reply.isOwner}<span class="owner-badge">author</span>{/if}
															<span class="comment-time">{formatCommentDate(reply.createdAt)}</span>
														</div>
														<p class="comment-text">{reply.content}</p>
													</div>
												{/each}
											</div>
										{/each}
									</div>
									<a href="/timeline/{post.id}" class="view-all-comments">View full post</a>
								</div>
							{/if}

							<div class="comment-actions">
								{#if commentSuccess === post.id}
									<span class="comment-success-msg">Comment posted!</span>
								{/if}
								<button class="add-comment-btn" onclick={() => toggleCommentForm(post.id)}>
									{#if commentFormOpen === post.id}
										Cancel
									{:else}
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
										</svg>
										Add a comment
									{/if}
								</button>
							</div>

							{#if commentFormOpen === post.id}
								<div class="comment-form">
									<div class="comment-form-row">
										<input
											type="text"
											placeholder="Your name"
											class="comment-input"
											bind:value={commentName}
											disabled={commentSubmitting}
										/>
										<input
											type="email"
											placeholder="Your email"
											class="comment-input"
											bind:value={commentEmail}
											disabled={commentSubmitting}
										/>
									</div>
									<textarea
										placeholder="Write a comment..."
										class="comment-textarea"
										rows="3"
										bind:value={commentText}
										disabled={commentSubmitting}
									></textarea>
									{#if commentError}
										<p class="comment-error">{commentError}</p>
									{/if}
									<button
										class="comment-submit-btn"
										onclick={() => submitComment(post.id)}
										disabled={commentSubmitting}
									>
										{#if commentSubmitting}
											Posting...
										{:else}
											Post Comment
										{/if}
									</button>
								</div>
							{/if}
						</div>
					</article>
				{/each}
			</div>

			{#if effectiveHasMore || loadingMore || loadMoreError}
				<div class="load-more-area">
					{#if loadMoreError}
						<button class="retry-button" onclick={() => loadMore()}>
							Something went wrong. Tap to retry.
						</button>
					{:else if loadingMore}
						<div class="timeline loading-more">
							{@render postSkeleton(0)}
							{@render postSkeleton(80)}
						</div>
					{:else}
						<div bind:this={sentinelEl} class="load-more-sentinel"></div>
					{/if}
				</div>
			{/if}
		{/if}
	{:catch}
		<div class="error-state">
			<p>The messenger pigeon got lost. Try again later.</p>
		</div>
	{/await}
</main>

<MediaLightbox media={lightboxMedia} startIndex={lightboxIndex} bind:open={lightboxOpen} />

<style>
	.timeline-page {
		max-width: 800px;
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
		margin-bottom: 1.5rem;
	}

	.subscribe-form {
		position: relative;
		max-width: 380px;
		margin: 0 auto;
	}

	.subscribe-input-row {
		display: flex;
		gap: 0.5rem;
	}

	.subscribe-input {
		flex: 1;
		padding: 0.6rem 0.9rem;
		background: rgba(237, 234, 224, 0.1);
		border: 1px solid rgba(237, 234, 224, 0.25);
		border-radius: 0.4rem;
		color: #EDEAE0;
		font-family: "Spectral", serif;
		font-size: 0.95rem;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.subscribe-input::placeholder {
		color: rgba(237, 234, 224, 0.45);
	}

	.subscribe-input:focus {
		border-color: rgba(237, 234, 224, 0.5);
	}

	.subscribe-button {
		padding: 0.6rem 1.2rem;
		background: #EDEAE0;
		color: #893F45;
		border: none;
		border-radius: 0.4rem;
		font-family: "Spectral", serif;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s ease;
		white-space: nowrap;
	}

	.subscribe-button:hover {
		opacity: 0.9;
	}

	.subscribe-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.subscribe-note {
		font-size: 0.78rem;
		opacity: 0.5;
		margin-top: 0.5rem;
	}

	.subscribe-error {
		font-size: 0.85rem;
		color: #ffb4b4;
		margin-top: 0.5rem;
	}

	.subscribe-success {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.1rem;
		background: rgba(237, 234, 224, 0.1);
		border: 1px solid rgba(237, 234, 224, 0.2);
		border-radius: 0.5rem;
		font-size: 0.92rem;
		opacity: 0.9;
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

	.media-wrapper {
		position: relative;
		border-radius: 0.5rem;
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

	.media-wrapper img {
		position: relative;
		width: 100%;
		height: auto;
		display: block;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.media-wrapper :global(img.loaded) {
		opacity: 1;
	}

	.media-wrapper video {
		position: relative;
		width: 100%;
		height: auto;
		display: block;
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

	.media-wrapper:hover .media-expand-btn {
		opacity: 1;
	}

	.media-expand-btn:hover {
		background: rgba(0, 0, 0, 0.75);
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

	/* Skeleton loading styles */

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	.skeleton-post::before {
		background: rgba(237, 234, 224, 0.15);
		box-shadow: 0 0 0 3px #893F45;
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
		border-radius: 0.5rem;
		margin: 1rem 0;
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
		gap: 0.5rem;
	}

	/* Infinite scroll */

	.load-more-area {
		margin-top: 2.5rem;
	}

	.load-more-sentinel {
		min-height: 1px;
	}

	.loading-more {
		opacity: 0.7;
	}

	.retry-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background: rgba(237, 234, 224, 0.08);
		border: 1px dashed rgba(237, 234, 224, 0.3);
		border-radius: 0.75rem;
		color: inherit;
		font-family: "Spectral", serif;
		font-size: 0.95rem;
		font-style: italic;
		cursor: pointer;
		opacity: 0.75;
		transition: opacity 0.2s ease;
		text-align: center;
	}

	.retry-button:hover {
		opacity: 1;
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

	/* Comments */

	.comments-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(237, 234, 224, 0.1);
	}

	.comments-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		opacity: 0.6;
		margin-bottom: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.comments-preview {
		max-height: 200px;
		overflow: hidden;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.comment {
		padding-left: 0.75rem;
		border-left: 2px solid rgba(237, 234, 224, 0.15);
	}

	.comment-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.15rem;
	}

	.comment-author {
		font-size: 0.82rem;
		font-weight: 600;
		opacity: 0.9;
	}

	.owner-reply {
		color: #d4a76a;
	}

	.owner-badge {
		font-size: 0.65rem;
		padding: 0.05rem 0.35rem;
		border-radius: 0.25rem;
		background: rgba(212, 167, 106, 0.15);
		color: #d4a76a;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: lowercase;
	}

	.comment-time {
		font-size: 0.72rem;
		opacity: 0.45;
		font-style: italic;
	}

	.comment-text {
		font-size: 0.88rem;
		line-height: 1.5;
		opacity: 0.85;
		white-space: pre-wrap;
	}

	.comment-reply {
		margin-top: 0.5rem;
		margin-left: 1rem;
		padding-left: 0.75rem;
		border-left: 2px solid rgba(212, 167, 106, 0.25);
	}

	.view-all-comments {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.82rem;
		opacity: 0.65;
		text-decoration: none;
		font-style: italic;
		transition: opacity 0.2s ease;
	}

	.view-all-comments:hover {
		opacity: 1;
	}

	.comment-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.75rem;
		padding-top: 0.5rem;
	}

	.comment-success-msg {
		font-size: 0.82rem;
		color: #8bc68b;
		font-style: italic;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.add-comment-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		padding: 0.35rem 0.75rem;
		background: rgba(237, 234, 224, 0.08);
		border: 1px solid rgba(237, 234, 224, 0.15);
		border-radius: 0.4rem;
		color: inherit;
		cursor: pointer;
		opacity: 0.65;
		font-family: "Spectral", serif;
		transition: all 0.2s ease;
	}

	.add-comment-btn:hover {
		opacity: 1;
		background: rgba(237, 234, 224, 0.12);
	}

	.comment-form {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.comment-form-row {
		display: flex;
		gap: 0.5rem;
	}

	.comment-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: rgba(237, 234, 224, 0.06);
		border: 1px solid rgba(237, 234, 224, 0.15);
		border-radius: 0.4rem;
		color: #EDEAE0;
		font-family: "Spectral", serif;
		font-size: 0.88rem;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.comment-input::placeholder,
	.comment-textarea::placeholder {
		color: rgba(237, 234, 224, 0.35);
	}

	.comment-input:focus,
	.comment-textarea:focus {
		border-color: rgba(237, 234, 224, 0.35);
	}

	.comment-textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: rgba(237, 234, 224, 0.06);
		border: 1px solid rgba(237, 234, 224, 0.15);
		border-radius: 0.4rem;
		color: #EDEAE0;
		font-family: "Spectral", serif;
		font-size: 0.88rem;
		outline: none;
		resize: vertical;
		min-height: 60px;
		transition: border-color 0.2s ease;
	}

	.comment-error {
		font-size: 0.82rem;
		color: #ffb4b4;
	}

	.comment-submit-btn {
		align-self: flex-end;
		padding: 0.45rem 1rem;
		background: #EDEAE0;
		color: #893F45;
		border: none;
		border-radius: 0.4rem;
		font-family: "Spectral", serif;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.comment-submit-btn:hover {
		opacity: 0.9;
	}

	.comment-submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

		.comment-form-row {
			flex-direction: column;
		}
	}
</style>
