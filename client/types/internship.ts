export type InternshipRequestStatus = 'pending' | 'approved' | 'rejected';

export interface InternshipRequest {
    id: string;
    student_id: string;
    company_name: string;
    company_contact: string;
    internship_period: string;
    purpose: string;
    status: InternshipRequestStatus;
    created_at: string;
}

export interface InternshipRequestInput {
    companyName: string;
    companyContact: string;
    internshipPeriod: string;
    purpose: string;
}
