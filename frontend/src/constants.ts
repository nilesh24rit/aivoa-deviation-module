// Form vocabulary — mirrors backend/app/constants.py
export const SITE_OPTIONS = [
  'API Manufacturing Unit',
  'Formulation Unit - Block A',
  'Formulation Unit - Block B',
  'Warehouse',
  'QC Laboratory',
  'Packaging Unit',
]

export const SOURCE_OPTIONS = [
  'Production',
  'QC Laboratory',
  'Warehouse',
  'Maintenance',
  'Packaging',
  'Audits/Inspection',
  'Customer Complaint',
  'Self Inspection',
  'Environmental Monitoring',
  'Engineering',
  'Other',
]

export const IMPACT_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
export const SEVERITY_OPTIONS = ['Minor', 'Major', 'Critical']

export const MAX_DESCRIPTION_LENGTH = 2000
export const SUPPORTED_FORMATS = 'PDF, DOCX, TXT, XLS, JPG, PNG'
export const ACCEPTED_FILE_TYPES =
  '.pdf,.docx,.txt,.md,.xls,.xlsx,.csv,.jpg,.jpeg,.png'
