const { Application, Internship, Notice, Notification, LetterRequest } = require('../models');
const supabase = require('../config/supabase');

const DASHBOARD_APPLICATIONS_LIMIT = 25;
const DASHBOARD_NOTICES_LIMIT = 40;
const DASHBOARD_NOTIFICATIONS_LIMIT = 80;
const DASHBOARD_LETTER_REQUESTS_LIMIT = 50;
const DASHBOARD_INTERNSHIP_REQUESTS_LIMIT = 20;

function mapInternshipRequestRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        studentId: row.student_id,
        companyName: row.company_name,
        companyContact: row.company_contact,
        internshipPeriod: row.internship_period,
        purpose: row.purpose,
        status: row.status,
        createdAt: row.created_at,
    };
}

async function getStudentDashboard(req, res) {
    try {
        const studentId = req.user.id; // Use the primary key (UUID) for database lookups

        const applicationStatuses = ['pending', 'under_review', 'approved', 'rejected'];
        const companyLettersEmailedPromise = supabase
            .from('letter_requests')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('request_type', 'company')
            .eq('email_sent', true);
        const companyLettersApprovedPromise = supabase
            .from('letter_requests')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('request_type', 'company')
            .eq('status', 'approved');
        const letterRequestsPendingPromise = supabase
            .from('letter_requests')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('status', 'pending');

        const internshipRequestsListPromise = supabase
            .from('internship_requests')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(DASHBOARD_INTERNSHIP_REQUESTS_LIMIT);

        const internshipRequestTotalPromise = supabase
            .from('internship_requests')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId);

        const internshipRequestPendingPromise = supabase
            .from('internship_requests')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('status', 'pending');

        // Use Promise.all to fetch all pieces of dashboard data concurrently in the backend
        const [
            applicationsResult,
            applicationTotal,
            statusCountResults,
            companyLettersEmailedResult,
            companyLettersApprovedResult,
            letterRequestsPendingResult,
            internshipRequestsListResult,
            internshipRequestTotalResult,
            internshipRequestPendingResult,
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
            companyLettersEmailedPromise,
            companyLettersApprovedPromise,
            letterRequestsPendingPromise,
            internshipRequestsListPromise,
            internshipRequestTotalPromise,
            internshipRequestPendingPromise,
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
        const companyLettersEmailedCount =
            !companyLettersEmailedResult.error && typeof companyLettersEmailedResult.count === 'number'
                ? companyLettersEmailedResult.count
                : 0;
        const companyLettersApprovedCount =
            !companyLettersApprovedResult.error && typeof companyLettersApprovedResult.count === 'number'
                ? companyLettersApprovedResult.count
                : 0;
        const letterRequestsPendingCount =
            !letterRequestsPendingResult.error && typeof letterRequestsPendingResult.count === 'number'
                ? letterRequestsPendingResult.count
                : 0;

        let internshipRequests = [];
        if (!internshipRequestsListResult.error && Array.isArray(internshipRequestsListResult.data)) {
            internshipRequests = internshipRequestsListResult.data.map(mapInternshipRequestRow).filter(Boolean);
        }

        const internshipRequestTotal =
            !internshipRequestTotalResult.error && typeof internshipRequestTotalResult.count === 'number'
                ? internshipRequestTotalResult.count
                : internshipRequests.length;
        const internshipRequestPending =
            !internshipRequestPendingResult.error && typeof internshipRequestPendingResult.count === 'number'
                ? internshipRequestPendingResult.count
                : internshipRequests.filter((r) => r.status === 'pending').length;

        const now = Date.now();
        const noticesRaw = noticesResult.rows || noticesResult || [];
        const notices = noticesRaw.filter((n) => {
            if (n.homepageOnly) return false;
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

        const applicationRows = applicationsResult.rows || applicationsResult || [];
        const applications = applicationRows.map((app) => {
            const internship = app.internship || app.Internship;
            if (internship && !app.Internship) {
                return { ...app, Internship: internship };
            }
            return app;
        });

        return res.json({
            data: {
                applications,
                applicationStats: {
                    total: applicationTotal,
                    pending,
                    underReview,
                    approved,
                    rejected,
                    /** Emailed to organisation (company-type letters). */
                    companyLettersCount: companyLettersEmailedCount,
                    companyLettersEmailedCount,
                    companyLettersApprovedCount,
                    letterRequestsPendingCount,
                    internshipRequestTotal,
                    internshipRequestPending,
                },
                internships: internshipsResult.rows || internshipsResult || [],
                notices,
                notifications,
                letterRequests: letterRequestsResult.rows || letterRequestsResult || [],
                internshipRequests,
            }
        });
    } catch (error) {
        console.error('Final Dashboard Error:', error);
        return res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
}

module.exports = { getStudentDashboard };
