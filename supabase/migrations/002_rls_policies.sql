-- RLS Policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for internships
-- Everyone can view open internships
CREATE POLICY "Anyone can view open internships"
  ON public.internships
  FOR SELECT
  USING (status = 'open' OR status = 'closed');

-- Admins can view all internships
CREATE POLICY "Admins can view all internships"
  ON public.internships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create internships
CREATE POLICY "Admins can create internships"
  ON public.internships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update internships
CREATE POLICY "Admins can update internships"
  ON public.internships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete internships
CREATE POLICY "Admins can delete internships"
  ON public.internships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for applications
-- Students can view their own applications
CREATE POLICY "Students can view own applications"
  ON public.applications
  FOR SELECT
  USING (student_id = auth.uid());

-- Students can create their own applications
CREATE POLICY "Students can create own applications"
  ON public.applications
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can update their own applications (withdraw)
CREATE POLICY "Students can update own applications"
  ON public.applications
  FOR UPDATE
  USING (student_id = auth.uid());

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all applications
CREATE POLICY "Admins can update all applications"
  ON public.applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notices
-- Everyone can view active notices
CREATE POLICY "Anyone can view active notices"
  ON public.notices
  FOR SELECT
  USING (is_active = true);

-- Admins can view all notices
CREATE POLICY "Admins can view all notices"
  ON public.notices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create notices
CREATE POLICY "Admins can create notices"
  ON public.notices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update notices
CREATE POLICY "Admins can update notices"
  ON public.notices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete notices
CREATE POLICY "Admins can delete notices"
  ON public.notices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- System can create notifications (via service role or function)
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

