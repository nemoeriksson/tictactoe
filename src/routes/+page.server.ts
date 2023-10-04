import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as crypto from 'crypto';
import { prisma } from '$lib';

function hash(original:string, ){
    const salt = crypto.randomBytes(16).toString('base64');
    const hash = crypto.pbkdf2Sync(original, salt, 1000, 64, 'sha256').toString('base64');
    return {salt,hash};
}

function validate(original:string, salt:string, storedHash:string){
    const hash = crypto.pbkdf2Sync(original, salt, 1000, 64, 'sha256').toString('base64');
    return hash == storedHash;
}

export const load = (async ({ cookies }) => {
    let username = cookies.get('username');

    if(typeof username !== 'undefined'){
        let existingUser = await prisma.user.findUnique({
            where: {name: username}
        });
        
        if(existingUser)
            throw redirect(302, '/sessions');

        else if(!existingUser)
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
            let validated = validate(password, existingUser.salt, existingUser.password);

            if(validated){
                let expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate()+14);
                cookies.set('username', username, {secure: false, expires: expirationDate});
                throw redirect(307, '/sessions');
            }
            else if(!validated){
                return fail(401, {username: "Incorrect username or password"})
            }
        }
    },

    logout: async({cookies})=>{
        let username = cookies.get('username');
        if(typeof username === 'undefined'){
            return fail(400, {username: "User not detected"})
        }
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
        if(password.length<12){
            return fail(409)}

        let hashData = hash(password);
        let encrypted = hashData.hash;
        let salt = hashData.salt;
        await prisma.user.create({
            data: {
                name: username,
                password: encrypted,
                salt: salt
            }
        });
        
        let expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate()+14);
        cookies.set('username', username, {secure: false, expires: expirationDate});
        throw redirect(307, '/sessions');
    }
};
