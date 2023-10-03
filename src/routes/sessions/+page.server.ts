import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib';
export let _sessionUserList = new Map<string, number>();

export const load = (async ({cookies}) => {
    let username = cookies.get('username');
    if(typeof username === 'undefined'){
        throw redirect(303, '/');
    }
    let sessions = await prisma.session.findMany();
    let onlineUserData = new Map<string, number>();
    for(let session of sessions){
        const userCount = (await prisma.user.findMany({where: {sessionName: session.name}})).length;
        onlineUserData.set(session.name, userCount);
    }
    return { sessions, username, onlineUserData: onlineUserData};
}) satisfies PageServerLoad;

export const actions: Actions = {
    create: async({request})=>{
        let data = await request.formData();
        let sessionName = data.get('sessionName')?.toString().replaceAll(' ', '');
        
        const existingSession = await prisma.session.findUnique({
            where: {name: sessionName}
        });
        
        if(existingSession){
            return fail(409, {sessionName: 'Session already exists'});
        }
        else if(!sessionName)
            return fail(422, {sessionName: 'Session name cannot be empty'});
        else if(sessionName.length > 14)
            return fail(422, {sessionName: 'Session name to long'})
        else if(sessionName.length < 6)
            return fail(422, {sessionName: 'Session name too short'})
        
        await prisma.session.create({
            data: {
                name: sessionName,
            }
        });

        throw redirect(301, `/sessions/${sessionName}`);
    }
};

