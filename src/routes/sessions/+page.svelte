<link rel="stylesheet" href="/styles/sessions.css">
<script lang="ts">
import { browser } from '$app/environment';
import { enhance } from '$app/forms';
import { invalidateAll } from '$app/navigation';
    
export let data;
export let form;

browser ? setInterval(invalidateAll, 1000) : null;

$: sessions = data.sessions;
$: onlineUserData = data.onlineUserData;
let showSearchbar = false;
let searchShown = false;
let searchbar:HTMLInputElement;
let newSessionInput:HTMLInputElement;
let showNewSessionButton = false;
let shownNewSessionButton = false;
</script>

<h1>Hello {data?.username}! You are now logged in</h1>

<form method="post" action="/?/logout" use:enhance>
    <button>Log out</button>
</form>

<div class="sessionManager">
    <div class="sessionContainer">
        <div class="listContainer">
            <div class="banner" class:shadow={!showSearchbar}>
                <p>SESSIONS</p>
                <span on:click={()=>{showSearchbar=!showSearchbar;searchShown=true}} 
                    on:keydown={()=>{showSearchbar=!showSearchbar;searchShown=true}} 
                    aria-hidden='true' title={showSearchbar ? 'Hide searchbar' : 'Show searchbar'}>
                    {showSearchbar ? 'HIDE' : 'SEARCH'}
                </span>
            </div>
            
            {#if searchShown}
                <div class="searchbar" class:fadeIn={showSearchbar} class:fadeOut={!showSearchbar}>
                    <input type="text" bind:this={searchbar} maxlength="14" spellcheck="false">
                </div>
            {/if}

            <div class="sessions" class:shorten={showSearchbar} class:lengthen={(!showSearchbar)&&searchShown}>
                {#each sessions as session}
                    {#if session.name.includes(searchbar?.value.toLowerCase() || '')}
                        <article>
                            <a data-sveltekit-preload-data="tap" class="sessionName" href="/sessions/{session.name}">{session.name}</a>
                            <span class="onlineUsers">{onlineUserData.get(session.name)}</span>
                        </article>
                    {/if}
                {/each}
            </div>

            <div class="addSession">
                <button class="addButton" class:clicked={showNewSessionButton} on:click={()=>{
                    showNewSessionButton=!showNewSessionButton;
                    shownNewSessionButton=true;
                    if(!showNewSessionButton)
                        newSessionInput.value = '';
                }} title="Create new session"></button>
                
                <form action="?/create" method="post" use:enhance>
                    <input class="formInput" bind:this={newSessionInput} class:slideIn={showNewSessionButton} class:slideOut={shownNewSessionButton&&!showNewSessionButton} type="text" name="sessionName">
                    {#if form?.sessionName}
                        <p class="inputError">{form.sessionName}</p>
                    {/if}
                </form>
            </div>
        </div>
    </div>
</div>
