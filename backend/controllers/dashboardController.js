const { Application, Internship, Notice, Notification, LetterRequest } = require('../models');
const supabase = require('../config/supabase'); // Directly importing supabase client if we need raw SQL joining

async function getStudentDashboard(req, res) {
    try {
        const studentId = req.user.id; // Use the primary key (UUID) for database lookups

        // Use Promise.all to fetch all pieces of dashboard data concurrently in the backend
        const [
            applicationsResult,
            internshipsResult,
            noticesResult,
            notificationsResult,
            letterRequestsResult
        ] = await Promise.all([
            Application.findAndCountAll({
                where: { studentId },
                include: [{ model: Internship }],
                order: [['appliedAt', 'DESC']]
            }),
            Internship.findAndCountAll({ where: { status: 'published' }, limit: 10, order: [['updatedAt', 'DESC']] }),
            Notice.findAndCountAll({ where: { isActive: true }, order: [['createdAt', 'DESC']] }),
            Notification.findAndCountAll({ where: { userId: studentId }, order: [['createdAt', 'DESC']] }),
            LetterRequest.findAndCountAll({ where: { studentId }, order: [['createdAt', 'DESC']] })
        ]);

        return res.json({
            data: {
                applications: applicationsResult.rows || applicationsResult || [],
                internships: internshipsResult.rows || internshipsResult || [],
                notices: noticesResult.rows || noticesResult || [],
                notifications: notificationsResult.rows || notificationsResult || [],
                letterRequests: letterRequestsResult.rows || letterRequestsResult || []
            }
        });
    } catch (error) {
        console.error('Final Dashboard Error:', error);
        return res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
}

module.exports = { getStudentDashboard };
