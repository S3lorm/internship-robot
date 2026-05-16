/** Local homepage partner card images (files in /public). */
export const departmentPartnerImages: Record<string, string> = {
  'Marine Engineering': '/Marine Engineering Intern.webp',
  'Nautical Science': '/Shipping Operations Trainee.jpg',
  'Port & Shipping Administration': '/port shiiping.jpg',
  'Maritime Safety & Security': '/Port Safety and security intern.jpg',
  'Electrical/Electronic Engineering': '/Electrical and instrumental intern.jpg',
  'Computer Science': '/assets/companies/maritime-technology.jpg',
};

export function coverImageForDepartment(department: string): string | undefined {
  return departmentPartnerImages[department];
}

/** Cover image by internship listing title (homepage cards). */
export const internshipCoverImages: Record<string, string> = {
  'Marine Engineering Intern': departmentPartnerImages['Marine Engineering']!,
  'Shipping Operations Trainee': departmentPartnerImages['Nautical Science']!,
  'Port Safety & Security Intern': departmentPartnerImages['Maritime Safety & Security']!,
  'Electrical & Instrumentation Intern': departmentPartnerImages['Electrical/Electronic Engineering']!,
  'Port Operations & Logistics Intern': departmentPartnerImages['Port & Shipping Administration']!,
};

export function coverImageForInternshipTitle(title: string): string | undefined {
  return internshipCoverImages[title];
}

/** Encode spaces in /public filenames for next/image. */
export function publicImageSrc(path: string): string {
  if (!path.includes(' ')) return path;
  return path
    .split('/')
    .map((segment) => (segment ? encodeURIComponent(segment) : ''))
    .join('/');
}
