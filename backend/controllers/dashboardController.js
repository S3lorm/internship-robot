const { Application, Internship, Notice, Notification, LetterRequest } = require('../models');
const supabase = require('../config/supabase'); // Directly importing supabase client if we need raw SQL joining

async function getStudentDashboard(req, res) {
    try {
        const userId = req.user.id;
        const studentId = req.user.studentId;

        // Use Promise.all to fetch all pieces of dashboard data concurrently in the backend
        // This avoids 5 round-trips from the frontend
        const [
            applicationsResult,
            internshipsResult,
            noticesResult,
            notificationsResult,
            letterRequestsResult
        ] = await Promise.all([
            Application.findAndCountAll({ where: { studentId } }),
            Internship.findAndCountAll({ where: { status: 'published' }, limit: 10, order: [['created_at', 'DESC']] }),
            Notice.findAndCountAll({ where: { isActive: true } }),
            Notification.findAndCountAll({ where: { userId }, order: [['created_at', 'DESC']] }),
            LetterRequest.findAndCountAll({ where: { studentId }, order: [['created_at', 'DESC']] })
        ]);

        // Send a single assembled response payload equivalent to what the frontend used to fetch in 5 calls
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
        console.error('Error fetching dashboard data:', error);
        return res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
}

module.exports = { getStudentDashboard };
