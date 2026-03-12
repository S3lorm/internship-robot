import { supabase } from './supabase/client';
import { InternshipRequest, InternshipRequestInput } from '@/types/internship';

export async function submitInternshipRequest(
    formData: InternshipRequestInput,
    studentId: string
): Promise<InternshipRequest[]> {
    const { companyName, companyContact, internshipPeriod, purpose } = formData;

    const { data, error } = await supabase
        .from('internship_requests')
        .insert([
            {
                student_id: studentId,
                company_name: companyName,
                company_contact: companyContact,
                internship_period: internshipPeriod,
                purpose,
                status: 'pending',
            },
        ])
        .select();

    if (error) {
        console.error('Supabase Insert Error:', error.message);
        throw new Error(error.message);
    }

    return data as InternshipRequest[];
}

export async function getStudentRequests(
    studentId: string
): Promise<InternshipRequest[]> {
    const { data, error } = await supabase
        .from('internship_requests')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase Fetch Error:', error.message);
        return [];
    }

    return data as InternshipRequest[];
}
