<link rel="stylesheet" href="/styles/login.css">
<script lang="ts">
import { browser } from "$app/environment";
import { enhance } from "$app/forms";  
import { fly } from "svelte/transition";

export let form;

let showRegisterForm = false;
let formSectionOffset = 440;
if(browser){
    formSectionOffset = window.innerWidth > 440 ? window.innerWidth*0.35 : 440;
}

let registerPasswordInput:HTMLInputElement;

function pwCheckCases(){
    hasLength = registerPasswordInput.value.length >= 12;
    hasCases = /[A-Z]/.test(registerPasswordInput.value) && /[a-z]/.test(registerPasswordInput.value);
    hasNumber = /\d/.test(registerPasswordInput.value);
}

let hasLength = false;
let hasCases = false;
let hasNumber = false;

</script>

<div class="content">
    <h2>The most epic, engaging, gambling endorsing Tic-Tac-Toe game that there has ever been! Login in or register now to play it in the furute!</h2>
</div>

<div class="formSection login">
    <div class="formContainer">
        <div class="banner">
            <p>LOG IN</p>
        </div>

        <form method="post" action="?/login" use:enhance>
            <label for="username">Username</label>
            <input required type="text" name="username">
            <label for="password">Password</label>
            <input required autocomplete="current-password" type="password" name="password">    
            <button class="submit">Log In</button>
            {#if form?.username}
                <span class="warning">{form.username}</span>
            {/if}
            <div class="formFooter">
                <p>Or <a href="#" on:click={()=>{showRegisterForm=true}} aria-hidden='true'>create</a> a new account</p>
            </div>
        </form>
    </div> 
</div>

{#if showRegisterForm}
    <div class="formSection register" in:fly={{x:formSectionOffset, duration: 350 }} out:fly={{x:formSectionOffset, duration: 350}}>
        <div class="formContainer">
            <div class="banner">
                <p>REGISTER</p>
            </div>

            <form method="post" action="?/register" use:enhance>
                <label for="username">Username</label>
                <input required type="text" name="username">
                <label for="password">Password</label>
                <input type="password" pattern='^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).&#123;12,&#125;$' name="password" on:keyup={()=>{pwCheckCases()}} bind:this={registerPasswordInput}> 
                <div class="pwRequirements">
                    <p class="requirement">
                        <span class="crossed" class:checked={hasLength}></span>
                        <span>12 Characters long</span>
                    </p>
                    <p class="requirement">
                        <span class="crossed" class:checked={hasCases}></span>
                        <span>Upper & lower case</span>
                    </p>
                    <p class="requirement">
                        <span class="crossed" class:checked={hasNumber}></span>
                        <span>Atleast 1 number</span>
                    </p>
                </div>
                <button class="submit mainColor">Register</button>
                <div class="formFooter">
                    <p>Or <a href="#" on:click={()=>{showRegisterForm=false}} aria-hidden='true'>log in</a> to an account</p>
                </div>
            </form>
        </div> 
    </div>
{/if}