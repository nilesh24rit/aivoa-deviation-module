"""Shared vocabulary for the Log Deviation form (mirrored in the frontend)."""

SITE_OPTIONS = [
    "API Manufacturing Unit",
    "Formulation Unit - Block A",
    "Formulation Unit - Block B",
    "Warehouse",
    "QC Laboratory",
    "Packaging Unit",
]

SOURCE_OPTIONS = [
    "Production",
    "QC Laboratory",
    "Warehouse",
    "Maintenance",
    "Packaging",
    "Audits/Inspection",
    "Customer Complaint",
    "Self Inspection",
    "Environmental Monitoring",
    "Engineering",
    "Other",
]

IMPACT_OPTIONS = ["Low", "Medium", "High", "Critical"]
SEVERITY_OPTIONS = ["Minor", "Major", "Critical"]

MAX_DESCRIPTION_LENGTH = 2000
MAX_TITLE_LENGTH = 160
