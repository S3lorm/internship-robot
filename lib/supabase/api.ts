import { supabase } from './client';
import type { User } from '@/types';

// Helper to handle Supabase errors
function handleError(error: any): string {
  if (error?.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

// Auth API
export const authApi = {
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Login failed' };
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        return { error: 'Failed to fetch user profile' };
      }

      return {
        data: {
          user: {
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            studentId: profile.student_id,
            phone: profile.phone,
            role: profile.role,
            department: profile.department,
            program: profile.program,
            yearOfStudy: profile.year_of_study,
            avatar: profile.avatar,
            bio: profile.bio,
            skills: profile.skills || [],
            isActive: profile.is_active,
            isEmailVerified: data.user.email_confirmed_at !== null,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          } as User,
          session: data.session,
        },
      };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    studentId?: string;
    phone?: string;
    department?: string;
    program?: string;
    yearOfStudy?: number;
  }) {
    try {
      // Get the redirect URL for email confirmation
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback?next=/verify-email`
        : '/auth/callback?next=/verify-email';

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: 'student',
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Registration failed' };
      }

      // Update user profile with additional data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          student_id: userData.studentId,
          phone: userData.phone,
          department: userData.department,
          program: userData.program,
          year_of_study: userData.yearOfStudy,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail registration if profile update fails
      }

      return {
        data: {
          message: 'Registration successful. Please check your email to verify your account.',
          user: authData.user,
        },
      };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async verifyEmail(token: string) {
    try {
      // Supabase handles email verification through callback URLs
      // If a token is provided directly, try to verify it
      // Otherwise, verification happens automatically when user clicks the link
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        return { error: error.message || 'Invalid verification token' };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async resendVerification(email: string) {
    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback?next=/verify-email`
        : '/auth/callback?next=/verify-email';

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async forgotPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async resetPassword(token: string, password: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async getProfile() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return { error: 'Profile not found' };
      }

      return {
        data: {
          user: {
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            studentId: profile.student_id,
            phone: profile.phone,
            role: profile.role,
            department: profile.department,
            program: profile.program,
            yearOfStudy: profile.year_of_study,
            avatar: profile.avatar,
            bio: profile.bio,
            skills: profile.skills || [],
            isActive: profile.is_active,
            isEmailVerified: user.email_confirmed_at !== null,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          } as User,
        },
      };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async updateProfile(data: Partial<User>) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const updateData: any = {};
      if (data.firstName !== undefined) updateData.first_name = data.firstName;
      if (data.lastName !== undefined) updateData.last_name = data.lastName;
      if (data.studentId !== undefined) updateData.student_id = data.studentId;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.department !== undefined) updateData.department = data.department;
      if (data.program !== undefined) updateData.program = data.program;
      if (data.yearOfStudy !== undefined) updateData.year_of_study = data.yearOfStudy;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.skills !== undefined) updateData.skills = data.skills;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        data: {
          user: {
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            studentId: profile.student_id,
            phone: profile.phone,
            role: profile.role,
            department: profile.department,
            program: profile.program,
            yearOfStudy: profile.year_of_study,
            avatar: profile.avatar,
            bio: profile.bio,
            skills: profile.skills || [],
            isActive: profile.is_active,
            isEmailVerified: user.email_confirmed_at !== null,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          } as User,
        },
      };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async uploadAvatar(file: File) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        return { error: uploadError.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        return { error: updateError.message };
      }

      return { data: { url: publicUrl } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { data: { success: true } };
  },
};

// Internships API
export const internshipsApi = {
  async getAll(params?: Record<string, string>) {
    try {
      let query = supabase
        .from('internships')
        .select('*, posted_by:user_profiles!internships_posted_by_fkey(id, first_name, last_name)')
        .order('posted_at', { ascending: false });

      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.type) {
        query = query.eq('type', params.type);
      }
      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,company.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('*, posted_by:user_profiles!internships_posted_by_fkey(id, first_name, last_name)')
        .eq('id', id)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async create(data: Record<string, unknown>) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { data: internship, error } = await supabase
        .from('internships')
        .insert({
          title: data.title,
          company: data.company,
          location: data.location,
          type: data.type,
          duration: data.duration,
          description: data.description,
          requirements: data.requirements || [],
          responsibilities: data.responsibilities || [],
          stipend: data.stipend,
          deadline: data.deadline,
          slots: data.slots || 1,
          status: data.status || 'open',
          posted_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: internship };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async update(id: string, data: Record<string, unknown>) {
    try {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.company !== undefined) updateData.company = data.company;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.requirements !== undefined) updateData.requirements = data.requirements;
      if (data.responsibilities !== undefined) updateData.responsibilities = data.responsibilities;
      if (data.stipend !== undefined) updateData.stipend = data.stipend;
      if (data.deadline !== undefined) updateData.deadline = data.deadline;
      if (data.slots !== undefined) updateData.slots = data.slots;
      if (data.status !== undefined) updateData.status = data.status;

      const { data: internship, error } = await supabase
        .from('internships')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: internship };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },
};

// Applications API
export const applicationsApi = {
  async getAll(params?: Record<string, string>) {
    try {
      let query = supabase
        .from('applications')
        .select(`
          *,
          student:user_profiles!applications_student_id_fkey(id, first_name, last_name, email, student_id),
          internship:internships(*),
          reviewer:user_profiles!applications_reviewed_by_fkey(id, first_name, last_name)
        `)
        .order('applied_at', { ascending: false });

      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.internshipId) {
        query = query.eq('internship_id', params.internshipId);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          student:user_profiles!applications_student_id_fkey(*),
          internship:internships(*),
          reviewer:user_profiles!applications_reviewed_by_fkey(id, first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async getMyApplications() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          internship:internships(*)
        `)
        .eq('student_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async create(data: FormData) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const internshipId = data.get('internshipId') as string;
      const coverLetter = data.get('coverLetter') as string;
      const cvFile = data.get('cv') as File;

      let cvUrl = null;

      if (cvFile && cvFile.size > 0) {
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `${user.id}-${internshipId}-${Date.now()}.${fileExt}`;
        const filePath = `cvs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(filePath, cvFile);

        if (uploadError) {
          return { error: uploadError.message };
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(filePath);

        cvUrl = publicUrl;
      }

      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          student_id: user.id,
          internship_id: internshipId,
          cover_letter: coverLetter,
          cv_url: cvUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: application };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async updateStatus(id: string, status: string, notes?: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { data: application, error } = await supabase
        .from('applications')
        .update({
          status,
          feedback: notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: application };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async bulkUpdateStatus(ids: string[], status: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('applications')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async withdraw(id: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', id)
        .eq('student_id', user.id);

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },
};

// Notices API
export const noticesApi = {
  async getAll(params?: Record<string, string>) {
    try {
      let query = supabase
        .from('notices')
        .select('*, created_by:user_profiles!notices_created_by_fkey(id, first_name, last_name)')
        .order('created_at', { ascending: false });

      if (params?.isActive !== undefined) {
        query = query.eq('is_active', params.isActive === 'true');
      }
      if (params?.priority) {
        query = query.eq('priority', params.priority);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*, created_by:user_profiles!notices_created_by_fkey(id, first_name, last_name)')
        .eq('id', id)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async create(data: Record<string, unknown>) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { data: notice, error } = await supabase
        .from('notices')
        .insert({
          title: data.title,
          content: data.content,
          priority: data.priority || 'medium',
          target_audience: data.targetAudience || 'all',
          is_active: data.isActive !== undefined ? data.isActive : true,
          expires_at: data.expiresAt,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: notice };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async update(id: string, data: Record<string, unknown>) {
    try {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.targetAudience !== undefined) updateData.target_audience = data.targetAudience;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;

      const { data: notice, error } = await supabase
        .from('notices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: notice };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },
};

// Notifications API
export const notificationsApi = {
  async getAll() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async markAsRead(id: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async markAllAsRead() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },
};

// Letters API (simplified - you may want to implement this with Edge Functions)
export const lettersApi = {
  async generate(internshipId?: string) {
    // This would typically call a Supabase Edge Function
    // For now, return a placeholder
    return { data: '<p>Letter generation not yet implemented</p>' };
  },

  async download(internshipId?: string, format: string = 'html') {
    // This would typically call a Supabase Edge Function
    return { data: { success: true } };
  },
};

// Analytics API (Admin only)
export const analyticsApi = {
  async getDashboardStats() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return { error: 'Unauthorized' };
      }

      // Get counts
      const [usersCount, internshipsCount, applicationsCount] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('internships').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
      ]);

      return {
        data: {
          totalUsers: usersCount.count || 0,
          totalInternships: internshipsCount.count || 0,
          totalApplications: applicationsCount.count || 0,
        },
      };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async getApplicationsByMonth() {
    // Implement aggregation query
    return { data: [] };
  },

  async getInternshipsByCategory() {
    // Implement aggregation query
    return { data: [] };
  },
};

// Users API (Admin only)
export const usersApi = {
  async getAll(params?: Record<string, string>) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: 'Not authenticated' };
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return { error: 'Unauthorized' };
      }

      let query = supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (params?.role) {
        query = query.eq('role', params.role);
      }
      if (params?.search) {
        query = query.or(`email.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async updateStatus(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },

  async delete(id: string) {
    try {
      // Delete user from auth (requires admin client)
      // For now, just deactivate
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return { data: { success: true } };
    } catch (error) {
      return { error: handleError(error) };
    }
  },
};

