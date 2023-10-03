import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import { prisma } from '$lib';

let loggedInUsers = <string[]>[];

export const load = (async ({ cookies }) => {
    let username = cookies.get('username');
    let existingUser = await prisma.user.findUnique({
        where: {name: username}
    });

    if(!(typeof username === 'undefined') && existingUser){
        throw redirect(302, '/sessions');
    }
    else if(!existingUser){
        cookies.delete('username');
    }

    return {  };
}) satisfies PageServerLoad;

export const actions: Actions = {
    login: async({request, cookies}) => {
        let data = await request.formData();
        let username = data.get('username')?.toString().toLowerCase();
        let password = data.get('password')?.toString();

        if(username && password){
            const existingUser = await prisma.user.findUnique({
                where: {name: username}
            });

            if(!existingUser){
                return fail(403, {username: "Username not found"})
            }

            let saltData = JSON.parse(existingUser?.saltData)
            let encrypted = Base64.stringify(sha256(password.slice(0, saltData.saltStart) + saltData.salt + password.slice(saltData.saltStart)));

            if(loggedInUsers.includes(username)){
                return fail(403, {username:"User already logged in"});
            }
            else if(encrypted == existingUser?.password){
                loggedInUsers.push(username);
                let expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate()+14);
                cookies.set('username', username, {secure: false, expires: expirationDate});
                throw redirect(307, '/sessions');
            }
            else if(encrypted != existingUser?.password){
                return fail(401, {username: "Incorrect username or password"})
            }
        }
    },

    logout: async({cookies})=>{
        let username = cookies.get('username');
        if(typeof username === 'undefined'){
            return fail(400, {username: "User not detected"})
        }
        loggedInUsers = loggedInUsers.filter(user=>{user!=username});
        cookies.delete('username'); 
    },

    register: async({request, cookies}) => {
        let data = await request.formData();
        let username = data.get('username')?.toString().toLowerCase()!;
        let password = data.get('password')?.toString()!;

        const existingUser = await prisma.user.findUnique({
            where: {name: username}
        });    
        if(existingUser)
            return fail(409, {username: 'Username already taken'});
        
        let salt = (Math.random()+1).toString(36).substring(2);
        let saltStart = Math.floor(Math.random()*password.length);
        let encrypted = Base64.stringify(sha256(password.slice(0, saltStart) + salt + password.slice(saltStart)));
        await prisma.user.create({
            data: {
                name: username,
                password: encrypted,
                saltData: JSON.stringify({salt, saltStart})
            }
        })
        loggedInUsers.push(username);

        let expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate()+14);
        cookies.set('username', username, {secure: false, expires: expirationDate});
        throw redirect(307, '/sessions');
    }
};
