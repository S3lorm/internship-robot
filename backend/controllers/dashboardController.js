const { Application, Internship, Notice, Notification, LetterRequest } = require('../models');
const supabase = require('../config/supabase');

const DASHBOARD_APPLICATIONS_LIMIT = 25;
const DASHBOARD_NOTICES_LIMIT = 40;
const DASHBOARD_NOTIFICATIONS_LIMIT = 40;
const DASHBOARD_LETTER_REQUESTS_LIMIT = 50;

async function getStudentDashboard(req, res) {
    try {
        const studentId = req.user.id; // Use the primary key (UUID) for database lookups

        const applicationStatuses = ['pending', 'under_review', 'approved', 'rejected'];
        const companyLettersCountPromise = supabase
            .from('letter_requests')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('request_type', 'company');

        // Use Promise.all to fetch all pieces of dashboard data concurrently in the backend
        const [
            applicationsResult,
            applicationTotal,
            statusCountResults,
            companyLettersResult,
            internshipsResult,
            noticesResult,
            notificationsResult,
            letterRequestsResult
        ] = await Promise.all([
            Application.findAndCountAll({
                where: { studentId },
                include: [{ model: Internship }],
                order: [['appliedAt', 'DESC']],
                limit: DASHBOARD_APPLICATIONS_LIMIT
            }),
            Application.count({ where: { studentId } }),
            Promise.all(
                applicationStatuses.map((status) =>
                    Application.count({ where: { studentId, status } })
                )
            ),
            companyLettersCountPromise,
            Internship.findAndCountAll({ where: { status: 'published' }, limit: 10, order: [['updatedAt', 'DESC']] }),
            Notice.findAndCountAll({
                where: { isActive: true },
                order: [['createdAt', 'DESC']],
                limit: DASHBOARD_NOTICES_LIMIT
            }),
            Notification.findAndCountAll({
                where: { userId: studentId },
                order: [['createdAt', 'DESC']],
                limit: DASHBOARD_NOTIFICATIONS_LIMIT
            }),
            LetterRequest.findAndCountAll({
                where: { studentId },
                order: [['createdAt', 'DESC']],
                limit: DASHBOARD_LETTER_REQUESTS_LIMIT
            })
        ]);

        const [pending, underReview, approved, rejected] = statusCountResults;
        const companyLettersCount =
            !companyLettersResult.error && typeof companyLettersResult.count === 'number'
                ? companyLettersResult.count
                : 0;

        const now = Date.now();
        const noticesRaw = noticesResult.rows || noticesResult || [];
        const notices = noticesRaw.filter((n) => {
            if (n.expiresAt && new Date(n.expiresAt).getTime() <= now) return false;
            if (n.targetDepartment && n.targetDepartment !== req.user.department) return false;
            return true;
        });

        const notificationsRaw = notificationsResult.rows || notificationsResult || [];
        const notifications = notificationsRaw.filter((n) => {
            if (!n.expiresAt) return true;
            const t = new Date(n.expiresAt).getTime();
            return !Number.isNaN(t) && t > now;
        });

        return res.json({
            data: {
                applications: applicationsResult.rows || applicationsResult || [],
                applicationStats: {
                    total: applicationTotal,
                    pending,
                    underReview,
                    approved,
                    rejected,
                    companyLettersCount
                },
                internships: internshipsResult.rows || internshipsResult || [],
                notices,
                notifications,
                letterRequests: letterRequestsResult.rows || letterRequestsResult || []
            }
        });
    } catch (error) {
        console.error('Final Dashboard Error:', error);
        return res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
}

module.exports = { getStudentDashboard };
