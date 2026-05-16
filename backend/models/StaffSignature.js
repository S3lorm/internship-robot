const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./supabase');
const { resolveCatalogDepartment } = require('../constants/departmentCatalog');

function mapSignature(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    department: row.department,
    role: row.role,
    signerName: row.signer_name,
    title: row.title,
    signatureDataUrl: row.signature_data_url,
    isActive: row.is_active,
    uploadedAt: row.uploaded_at,
    deactivatedAt: row.deactivated_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function roleTitle(role) {
  return role === 'secutuary' ? 'Secutuary' : 'Head of Department';
}

const StaffSignature = {
  async findActiveByDepartment(department) {
    const normalizedDepartment = String(department || '').trim();
    if (!normalizedDepartment) return null;

    const { data, error } = await supabase
      .from('staff_signatures')
      .select('*')
      .eq('department', normalizedDepartment)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return mapSignature(data);
  },

  /** Match student/HOD department strings against catalog names and aliases. */
  async findActiveByDepartmentFlexible(departmentInput) {
    const names = new Set();
    const raw = String(departmentInput || '').trim();
    if (raw) names.add(raw);

    const catalog = resolveCatalogDepartment(raw);
    if (catalog) {
      names.add(catalog.name);
      for (const alias of catalog.aliases || []) {
        if (alias) names.add(alias);
      }
    }

    for (const name of names) {
      const sig = await this.findActiveByDepartment(name);
      if (sig) return sig;
    }

    const { data: rows, error } = await supabase
      .from('staff_signatures')
      .select('*')
      .eq('is_active', true)
      .eq('role', 'hod')
      .order('updated_at', { ascending: false });

    if (error && error.code !== 'PGRST116') throw error;
    if (!rows?.length) return null;

    const norm = (s) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const targets = [...names].map(norm).filter(Boolean);
    for (const row of rows) {
      const rowNorm = norm(row.department);
      if (targets.includes(rowNorm)) return mapSignature(row);
      for (const t of targets) {
        if (rowNorm.includes(t) || t.includes(rowNorm)) return mapSignature(row);
      }
    }

    return null;
  },

  async findMine(userId) {
    const { data, error } = await supabase
      .from('staff_signatures')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return mapSignature(data);
  },

  async upsertMine(user, payload) {
    const department = String(user.department || payload.department || '').trim();
    if (!department) {
      const error = new Error('Department is required before setting up a signature.');
      error.status = 400;
      throw error;
    }

    const signerName = String(payload.signerName || `${user.firstName || ''} ${user.lastName || ''}`).trim();
    if (!signerName) {
      const error = new Error('Signer name is required.');
      error.status = 400;
      throw error;
    }

    const role = user.originalRole === 'secutuary' ? 'secutuary' : user.role === 'secutuary' ? 'secutuary' : 'hod';
    const now = new Date().toISOString();

    await supabase
      .from('staff_signatures')
      .update({ is_active: false, deactivated_at: now, updated_at: now })
      .eq('department', department)
      .eq('role', role)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('staff_signatures')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        department,
        role,
        signer_name: signerName,
        title: String(payload.title || roleTitle(role)).trim(),
        signature_data_url: payload.signatureDataUrl || null,
        is_active: true,
        uploaded_at: now,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return mapSignature(data);
  },
};

module.exports = StaffSignature;
