import fetch from 'node-fetch';
import wait from "wait"
const USER_TOKEN = ''; 
const MAX_MEMBERS_PER_GROUP = 9;
const messageContent = "";
const groupName = "";

async function getFriends() {
    const res = await fetch('https://discord.com/api/v9/users/@me/relationships', {
        headers: {
            Authorization: USER_TOKEN
        }
    });

    const data = await res.json();
    console.log(data.length)
    return data.filter(friend => friend.type === 1); 
}

function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function createGroupDM(userIds, i) {

    const body = {
        recipients: userIds
    };
    
    const res = await fetch('https://discord.com/api/v9/users/@me/channels', {
        method: 'POST',
        headers: {
            Authorization: USER_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    const data = await res.json();
    if (res.status === 200) {
        console.log(`✅ (${i}) Groupe créé avec : ${userIds.join(', ')}`);
        
        const channelId = data.id;
        
        try {
            const nameRes = await fetch(`https://discord.com/api/v9/channels/${channelId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: USER_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: groupName
                })
            });
            
            if (nameRes.ok) {
                console.log(`✅ Nom du groupe changé en: "${groupName}"`);
            } else {
                console.error(`❌ Erreur lors du changement de nom:`, await nameRes.json());
            }
        } catch (error) {
            console.error(`❌ Erreur lors du changement de nom:`, error);
        }

        try {
            
            const messageRes = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: USER_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: messageContent
                })
            });
            
            if (messageRes.ok) {
                console.log(`✅ Message envoyé: "${messageContent}"`);
            } else {
                console.error(`❌ Erreur lors de l'envoi du message:`, await messageRes.json());
            }
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi du message:`, error);
        }
        
        return true;
    } else {
        if (data.message === 'You are being rate limited.') {
            const waitTime = (data.retry_after || 60) * 1000;
            console.log(`⏳ Rate limit détecté pour l'envoi du message. Attente de ${waitTime/1000} secondes...`);
            await wait(waitTime + 1000);
        }
        console.error(`❌ Erreur lors de la création du groupe:`, data);
        return false;
    }
}

async function main() {
    console.log('📥 Récupération des amis...');
    const friends = await getFriends();
    const ids = friends.map(f => f.id);

    const groups = chunkArray(ids, MAX_MEMBERS_PER_GROUP);
    console.log(`🔧 Création de ${groups.length} groupes...`);
    let i = 0;

    for (const group of groups) {
        i++;
        if(group)
        await createGroupDM(group, i);
        await new Promise(r => setTimeout(r, 1000)); 
    }

    console.log('✅ Fini !');
}

main();
