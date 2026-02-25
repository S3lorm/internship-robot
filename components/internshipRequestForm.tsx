'use client';

import { useState, FormEvent } from 'react';
import { submitInternshipRequest } from '@/lib/request';
import { InternshipRequestInput } from '@/types/internship';

interface Props {
    studentId: string;
}

export default function InternshipRequestForm({ studentId }: Props) {
    const [loading, setLoading] = useState<boolean>(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;

        const formData: InternshipRequestInput = {
            companyName: (form.company_name as HTMLInputElement).value,
            companyContact: (form.company_contact as HTMLInputElement).value,
            internshipPeriod: (form.internship_period as HTMLInputElement).value,
            purpose: (form.purpose as HTMLInputElement).value,
        };

        try {
            await submitInternshipRequest(formData, studentId);
            alert('Request submitted successfully');
            form.reset();
        } catch (err) {
            alert('Submission failed');
            console.error(err);
        }

        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit}>
            <input name="company_name" placeholder="Company Name" required />
            <input name="company_contact" placeholder="Company Contact" required />
            <input name="internship_period" placeholder="Internship Period" required />
            <input name="purpose" placeholder="Purpose" required />

            <button disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
            </button>
        </form>
    );
}
