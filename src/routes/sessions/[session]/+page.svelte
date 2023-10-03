<script lang="ts">
import { browser } from '$app/environment';
import { enhance } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import { onDestroy } from 'svelte';

export let data;
export let form;

$: messages = [...data.messages].reverse();
</script>

<h1>Welcome to {data.session}</h1>

<form action="?/message" method="post" use:enhance>
    <input type="text" name="message">
    <button>Send</button>
    {#if form?.message}
        <span>{form.message}</span>
    {/if}
</form>

{#each messages as messageData}
    <div>
        <p>
            <span class="username">{messageData['authorName']}:</span>
            <span class="message">{messageData['text']}</span>
        </p>
    </div>
{/each}
