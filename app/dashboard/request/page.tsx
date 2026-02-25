import InternshipRequestForm from '@/components/internshipRequestForm';

export default function RequestPage() {
    const studentId = 'REPLACE_WITH_AUTH_ID'; // Normally from Supabase Auth

    return (
        <div>
            <h1>Internship Letter Request</h1>
            <InternshipRequestForm studentId={studentId} />
        </div>
    );
}
