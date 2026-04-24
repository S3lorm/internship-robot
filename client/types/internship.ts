export type InternshipRequestStatus = 'pending' | 'approved' | 'rejected';

export interface InternshipRequest {
    id: string;
    student_id?: string;
    studentId?: string;
    company_name?: string;
    companyName?: string;
    company_contact?: string;
    companyContact?: string;
    internship_period?: string;
    internshipPeriod?: string;
    purpose: string;
    status: InternshipRequestStatus;
    created_at?: string;
    createdAt?: string;
}

export interface InternshipRequestInput {
    companyName: string;
    companyContact: string;
    internshipPeriod: string;
    purpose: string;
}
