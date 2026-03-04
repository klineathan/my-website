<script lang="ts">
	import { page } from '$app/stores';
	import MediaLightbox from '$lib/components/MediaLightbox.svelte';

	let { data } = $props();
	let copied = $state(false);
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

	interface Comment {
		id: string;
		postId: string;
		parentId: string | null;
		authorName: string;
		content: string;
		isOwner: boolean;
		createdAt: string;
	}

	let commentName = $state('');
	let commentEmail = $state('');
	let commentText = $state('');
	let commentSubmitting = $state(false);
	let commentError = $state<string | null>(null);
	let commentSuccess = $state(false);
	let commentFormOpen = $state(false);
	let extraComments = $state<Comment[]>([]);

	function openLightbox(index: number) {
		lightboxIndex = index;
		lightboxOpen = true;
	}

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

	function formatCommentDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}) + ' at ' + date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function topLevelComments(allComments: Comment[]): Comment[] {
		return allComments.filter((c) => !c.parentId);
	}

	function getReplies(allComments: Comment[], parentId: string): Comment[] {
		return allComments.filter((c) => c.parentId === parentId);
	}

	function getAllComments(post: { comments?: Comment[] }): Comment[] {
		const base = post.comments || [];
		const baseIds = new Set(base.map((c) => c.id));
		return [...base, ...extraComments.filter((c) => !baseIds.has(c.id))];
	}

	async function copyLink() {
		const url = $page.url.href;
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
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
			extraComments = [...extraComments, result.data];
			commentText = '';
			commentSuccess = true;
			commentFormOpen = false;
			setTimeout(() => { commentSuccess = false; }, 3000);
		} catch {
			commentError = 'Something went wrong. Please try again.';
		} finally {
			commentSubmitting = false;
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
</script>

<svelte:head>
	{#await data.postData}
		<title>Loading... | Timeline | Jon Kline</title>
	{:then post}
		<title>{post.title} | Timeline | Jon Kline</title>
		<meta name="description" content={post.excerpt || post.title} />
	{/await}
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

	{#await data.postData}
		<article class="post skeleton-post">
			<header class="post-header">
				<div class="post-timestamp">
					<span class="skeleton-line" style="width: 110px"></span>
					<span class="skeleton-line" style="width: 55px"></span>
				</div>
				<div class="post-header-row">
					<div class="skeleton-line" style="width: 70%; height: 1.5rem"></div>
				</div>
			</header>
			<div class="skeleton-media-block"></div>
			<div class="skeleton-body">
				<div class="skeleton-line"></div>
				<div class="skeleton-line" style="width: 92%"></div>
				<div class="skeleton-line" style="width: 78%"></div>
				<div class="skeleton-line" style="width: 85%"></div>
				<div class="skeleton-line" style="width: 60%"></div>
				<div class="skeleton-line" style="width: 0; height: 0.5rem"></div>
				<div class="skeleton-line" style="width: 95%"></div>
				<div class="skeleton-line" style="width: 80%"></div>
				<div class="skeleton-line" style="width: 70%"></div>
			</div>
		</article>
	{:then post}
		<article class="post">
			<header class="post-header">
				<div class="post-timestamp">
					<span class="date">{formatDate(post.createdAt)}</span>
					<span class="time">{formatTime(post.createdAt)}</span>
				</div>
				<div class="post-header-row">
					<h1 class="post-title">{post.title}</h1>
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
			
		{#if post.media?.length > 0}
			<div class="post-media" class:multiple={post.media.length > 1}>
				{#each post.media as mediaItem, mediaIndex}
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
								alt={mediaItem.altText || post.title}
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
			
		<div class="post-body">
			{@html post.content}
		</div>

		<section class="comments-full-section">
			<div class="comments-full-header">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
				<h2>Comments ({getAllComments(post).length})</h2>
			</div>

			{#if getAllComments(post).length === 0}
				<p class="no-comments">No comments yet. Be the first to share your thoughts.</p>
			{:else}
				<div class="comments-list">
					{#each topLevelComments(getAllComments(post)) as comment (comment.id)}
						<div class="comment-item">
							<div class="comment-meta">
								<span class="comment-author">{comment.authorName}</span>
								<span class="comment-time">{formatCommentDate(comment.createdAt)}</span>
							</div>
							<p class="comment-text">{comment.content}</p>

							{#each getReplies(getAllComments(post), comment.id) as reply (reply.id)}
								<div class="comment-reply-item">
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
			{/if}

			<div class="comment-form-area">
				{#if commentSuccess}
					<p class="comment-success-msg">Comment posted!</p>
				{/if}

				{#if !commentFormOpen}
					<button class="add-comment-btn" onclick={() => { commentFormOpen = true; commentError = null; }}>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
						</svg>
						Add a comment
					</button>
				{:else}
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
							rows="4"
							bind:value={commentText}
							disabled={commentSubmitting}
						></textarea>
						{#if commentError}
							<p class="comment-error">{commentError}</p>
						{/if}
						<div class="comment-form-actions">
							<button class="comment-cancel-btn" onclick={() => { commentFormOpen = false; }} disabled={commentSubmitting}>
								Cancel
							</button>
							<button
								class="comment-submit-btn"
								onclick={() => submitComment(post.id)}
								disabled={commentSubmitting}
							>
								{commentSubmitting ? 'Posting...' : 'Post Comment'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</section>
	</article>

	<MediaLightbox media={post.media ?? []} startIndex={lightboxIndex} bind:open={lightboxOpen} />
	{:catch}
		<div class="error-state">
			<p>Something went wrong loading this post. Try again later.</p>
		</div>
	{/await}
</main>

<style>
	.post-page {
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

	/* Skeleton loading styles */

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	.skeleton-post {
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

	/* Comments */

	.comments-full-section {
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(237, 234, 224, 0.15);
	}

	.comments-full-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		opacity: 0.85;
	}

	.comments-full-header h2 {
		font-family: "Rye", serif;
		font-size: 1.2rem;
		font-weight: 400;
		letter-spacing: 0.02em;
		margin: 0;
	}

	.no-comments {
		font-style: italic;
		opacity: 0.5;
		font-size: 0.95rem;
		padding: 1rem 0;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.comment-item {
		padding-left: 1rem;
		border-left: 2px solid rgba(237, 234, 224, 0.2);
	}

	.comment-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
		flex-wrap: wrap;
	}

	.comment-author {
		font-size: 0.9rem;
		font-weight: 600;
		opacity: 0.9;
	}

	.owner-reply {
		color: #d4a76a;
	}

	.owner-badge {
		font-size: 0.68rem;
		padding: 0.1rem 0.4rem;
		border-radius: 0.25rem;
		background: rgba(212, 167, 106, 0.15);
		color: #d4a76a;
		font-weight: 600;
		letter-spacing: 0.03em;
	}

	.comment-time {
		font-size: 0.78rem;
		opacity: 0.45;
		font-style: italic;
	}

	.comment-text {
		font-size: 0.95rem;
		line-height: 1.6;
		opacity: 0.85;
		white-space: pre-wrap;
	}

	.comment-reply-item {
		margin-top: 0.75rem;
		margin-left: 1.25rem;
		padding-left: 1rem;
		border-left: 2px solid rgba(212, 167, 106, 0.3);
	}

	.comment-form-area {
		margin-top: 1.5rem;
		padding-top: 1rem;
	}

	.comment-success-msg {
		font-size: 0.88rem;
		color: #8bc68b;
		font-style: italic;
		margin-bottom: 0.75rem;
	}

	.add-comment-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.88rem;
		padding: 0.5rem 1rem;
		background: rgba(237, 234, 224, 0.08);
		border: 1px solid rgba(237, 234, 224, 0.18);
		border-radius: 0.5rem;
		color: inherit;
		cursor: pointer;
		opacity: 0.7;
		font-family: "Spectral", serif;
		transition: all 0.2s ease;
	}

	.add-comment-btn:hover {
		opacity: 1;
		background: rgba(237, 234, 224, 0.12);
	}

	.comment-form {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		animation: formSlide 0.25s ease-out;
	}

	@keyframes formSlide {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.comment-form-row {
		display: flex;
		gap: 0.6rem;
	}

	.comment-input {
		flex: 1;
		padding: 0.55rem 0.85rem;
		background: rgba(237, 234, 224, 0.06);
		border: 1px solid rgba(237, 234, 224, 0.18);
		border-radius: 0.5rem;
		color: #EDEAE0;
		font-family: "Spectral", serif;
		font-size: 0.92rem;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.comment-input::placeholder,
	.comment-textarea::placeholder {
		color: rgba(237, 234, 224, 0.35);
	}

	.comment-input:focus,
	.comment-textarea:focus {
		border-color: rgba(237, 234, 224, 0.4);
	}

	.comment-textarea {
		width: 100%;
		padding: 0.55rem 0.85rem;
		background: rgba(237, 234, 224, 0.06);
		border: 1px solid rgba(237, 234, 224, 0.18);
		border-radius: 0.5rem;
		color: #EDEAE0;
		font-family: "Spectral", serif;
		font-size: 0.92rem;
		outline: none;
		resize: vertical;
		min-height: 80px;
		transition: border-color 0.2s ease;
	}

	.comment-error {
		font-size: 0.85rem;
		color: #ffb4b4;
	}

	.comment-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.comment-cancel-btn {
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid rgba(237, 234, 224, 0.15);
		border-radius: 0.5rem;
		color: inherit;
		cursor: pointer;
		font-family: "Spectral", serif;
		font-size: 0.88rem;
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.comment-cancel-btn:hover {
		opacity: 1;
	}

	.comment-submit-btn {
		padding: 0.5rem 1.2rem;
		background: #EDEAE0;
		color: #893F45;
		border: none;
		border-radius: 0.5rem;
		font-family: "Spectral", serif;
		font-size: 0.92rem;
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
		.post-page {
			padding: 2rem 1.25rem 3rem;
		}

		.post-title {
			font-size: 1.5rem;
		}

		.post-media.multiple {
			grid-template-columns: 1fr;
		}

		.comment-form-row {
			flex-direction: column;
		}
	}
</style>

