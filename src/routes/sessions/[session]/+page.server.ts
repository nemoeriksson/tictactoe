import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib';

let inactivityDelay = 1000;
let inactivityTimouts = new Map<string, any>();
let deletionTimout:any;
let deletionDelay = 15*1000;

async function userLeave(username:string, session:string){
    await prisma.user.update({where: {
        name: username
    }, data: {
        sessionName: null
    }});
    inactivityTimouts.delete(username);    

    if(inactivityTimouts.entries.length == 0){
        deletionTimout = setTimeout(async() => {
            await prisma.message.deleteMany({where: {
                sessionName: session
            }})
            await prisma.session.deleteMany({where: {
                name: session
            }});
        }, deletionDelay);
    }
}

export const load = (async ({params, cookies}) => {
    let session = params.session;
    const existingSession = await prisma.session.findUnique({where: {name: session}});

    if(!existingSession)
        throw error(404, `Session ${session} not found`);

    let messages = await prisma.message.findMany({where: {sessionName: session}});

    let username = cookies.get('username');
    if(typeof username === 'undefined'){
        throw redirect(303, '/'); 
    }

    let oldTimeout = inactivityTimouts.get(username);
    if (oldTimeout){
        clearTimeout(oldTimeout);
    }
    if(deletionTimout){
        clearTimeout(deletionTimout);
    }
    inactivityTimouts.set(username, setTimeout(()=>{
        userLeave(username!, session);
    }, inactivityDelay));

    await prisma.user.update({where: {
        name: username
    }, data: {
        sessionName: session
    }});

    return { username, session, messages };
}) satisfies PageServerLoad;

export const actions: Actions = {
    message: async({request, params, cookies})=>{
        let session = params.session;
        let username = cookies.get('username')!; 

        const existingSession = await prisma.session.findUnique({where: {name: session}});

        if(!session || !existingSession){
            throw error(404, `Session "${session}" not found`);
        }

        let data = await request.formData();
        let message = data.get('message')?.toString();
        if(!message){
            return fail(400, {message: 'Message cannot be empty'});
        }
        
        await prisma.message.create({
            data: {
                text: message,
                authorName: username,
                sessionName: session
            }
        });
    }
};