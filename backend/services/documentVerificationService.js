const { supabase } = require('../models');
const crypto = require('crypto');

/**
 * Generate SHA-256 hash of document content
 */
function generateDocumentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Create document verification record
 */
async function createDocumentVerification({
  documentType,
  documentId,
  referenceNumber,
  verificationCode,
  content,
  generatedBy,
  metadata = {},
}) {
  try {
    const hashValue = generateDocumentHash(content);

    const { data, error } = await supabase.rpc('create_document_verification', {
      p_document_type: documentType,
      p_document_id: documentId,
      p_reference_number: referenceNumber,
      p_verification_code: verificationCode,
      p_hash_value: hashValue,
      p_generated_by: generatedBy,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Error creating document verification:', error);
      return null;
    }

    return {
      id: data,
      hashValue,
      referenceNumber,
      verificationCode,
    };
  } catch (error) {
    console.error('Error creating document verification:', error);
    return null;
  }
}

/**
 * Verify document using reference number and verification code
 */
async function verifyDocument(referenceNumber, verificationCode) {
  try {
    const { data, error } = await supabase.rpc('verify_document', {
      p_reference_number: referenceNumber,
      p_verification_code: verificationCode,
    });

    if (error) {
      console.error('Error verifying document:', error);
      return {
        isValid: false,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        isValid: false,
        error: 'Document not found or invalid verification code',
      };
    }

    return {
      isValid: data[0].is_valid,
      documentType: data[0].document_type,
      documentId: data[0].document_id,
      generatedAt: data[0].generated_at,
      verificationCount: data[0].verification_count,
    };
  } catch (error) {
    console.error('Error verifying document:', error);
    return {
      isValid: false,
      error: error.message,
    };
  }
}

/**
 * Verify document integrity by comparing hash
 */
async function verifyDocumentIntegrity(documentId, documentType, content) {
  try {
    const { data, error } = await supabase
      .from('document_verification')
      .select('hash_value')
      .eq('document_type', documentType)
      .eq('document_id', documentId)
      .eq('is_valid', true)
      .single();

    if (error || !data) {
      return {
        isValid: false,
        error: 'Verification record not found',
      };
    }

    const currentHash = generateDocumentHash(content);
    const isValid = currentHash === data.hash_value;

    return {
      isValid,
      hashMatch: isValid,
      storedHash: data.hash_value,
      currentHash,
    };
  } catch (error) {
    console.error('Error verifying document integrity:', error);
    return {
      isValid: false,
      error: error.message,
    };
  }
}

/**
 * Get document verification record
 */
async function getDocumentVerification(documentType, documentId) {
  try {
    const { data, error } = await supabase
      .from('document_verification')
      .select('*')
      .eq('document_type', documentType)
      .eq('document_id', documentId)
      .eq('is_valid', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching document verification:', error);
    throw error;
  }
}

module.exports = {
  generateDocumentHash,
  createDocumentVerification,
  verifyDocument,
  verifyDocumentIntegrity,
  getDocumentVerification,
};


