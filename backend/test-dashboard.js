const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const { Application, Internship, Notice, Notification, LetterRequest, User } = require('./models');

async function test() {
    console.log("Testing queries...");
    const studentId = 'test-id';
    const userId = 'test-id';

    try {
        await Application.findAndCountAll({ where: { studentId } });
        console.log('Application ok');
    } catch (e) { console.error('Application failed:', e.message); }

    try {
        await Internship.findAndCountAll({ where: { status: 'published' }, limit: 10, order: [['created_at', 'DESC']] });
        console.log('Internship ok');
    } catch (e) { console.error('Internship failed:', e.message); }

    try {
        await Notice.findAndCountAll({ where: { isActive: true } });
        console.log('Notice ok');
    } catch (e) { console.error('Notice failed:', e.message); }

    try {
        await Notification.findAndCountAll({ where: { userId }, order: [['created_at', 'DESC']] });
        console.log('Notification ok');
    } catch (e) { console.error('Notification failed:', e.stack); }

    try {
        await LetterRequest.findAndCountAll({ where: { studentId }, order: [['created_at', 'DESC']] });
        console.log('LetterRequest ok');
    } catch (e) { console.error('LetterRequest failed:', e.message); }
}

test();
