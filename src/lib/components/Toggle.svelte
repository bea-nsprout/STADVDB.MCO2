<script>
	export let checked = false;
	export let disabled = false;
</script>

<style>
	.toggle-container {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
	}

	.toggle-container.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.toggle-switch {
		position: relative;
		width: 2.5rem;
		height: 1.4rem;
		background-color: var(--color-outline);
		border-radius: 1rem;
		transition: background-color 0.3s ease;
		border: 1px solid var(--color-outline);
	}

	.toggle-switch.checked {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.toggle-switch.disabled {
		background-color: var(--color-bg);
		border-color: var(--color-outline);
	}

	.toggle-knob {
		position: absolute;
		top: 0.1rem;
		left: 0.1rem;
		width: 1rem;
		height: 1rem;
		background-color: var(--color-primary);
		border-radius: 50%;
		transition: transform 0.3s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.toggle-knob.checked {
		transform: translateX(1.1rem);
	}

	input[type="checkbox"] {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}
</style>

<label class="toggle-container" class:disabled>
	<input
		type="checkbox"
		bind:checked
		{disabled}
		on:change
	/>
	<div class="toggle-switch" class:checked class:disabled>
		<div class="toggle-knob" class:checked></div>
	</div>
</label>
