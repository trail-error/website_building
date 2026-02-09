// Excel column mapping configuration for Autofill Excel
export type AutofillExcelFieldType = 'string' | 'number' | 'boolean'

export interface AutofillExcelColumnMapping {
  excelColumn: string;
  fieldName: string;
  type?: AutofillExcelFieldType;
  required?: boolean;
}

export const AUTOFILL_EXCEL_COLUMN_MAPPINGS: AutofillExcelColumnMapping[] = [
  { excelColumn: "POD", fieldName: "pod", type: 'string', required: true },
  { excelColumn: "Internal POD ID", fieldName: "internalPodId", type: 'string', required: false },
  { excelColumn: "POD Type", fieldName: "podTypeOriginal", type: 'string', required: false },
  { excelColumn: "POD Program Type", fieldName: "podProgramType", type: 'string', required: false },
  { excelColumn: "Project Managers", fieldName: "projectManagers", type: 'string', required: false },
  { excelColumn: "CLLI", fieldName: "clli", type: 'string', required: false },
  { excelColumn: "City", fieldName: "city", type: 'string', required: false },
  { excelColumn: "State", fieldName: "state", type: 'string', required: false },
  { excelColumn: "Router Type", fieldName: "routerType", type: 'string', required: false },
  { excelColumn: "Router 1", fieldName: "router1", type: 'string', required: false },
  { excelColumn: "Router 2", fieldName: "router2", type: 'string', required: false },
  { excelColumn: "Tenant Name", fieldName: "tenantName", type: 'string', required: false },
];

// Helper function to get field name from Excel column
export function getAutofillFieldNameFromExcelColumn(excelColumn: string): string | undefined {
  const mapping = AUTOFILL_EXCEL_COLUMN_MAPPINGS.find(m => m.excelColumn === excelColumn);
  return mapping?.fieldName;
}

// Helper function to get all available field names
export function getAllAutofillFieldNames(): string[] {
  return AUTOFILL_EXCEL_COLUMN_MAPPINGS.map(m => m.fieldName);
}

// Helper function to get display name for a field
export function getDisplayNameForField(fieldName: string): string {
  const mapping = AUTOFILL_EXCEL_COLUMN_MAPPINGS.find(m => m.fieldName === fieldName);
  return mapping?.excelColumn || fieldName;
}

// Helper function to get field type for autofill field
export function getFieldTypeForAutofillField(fieldName: string): AutofillExcelFieldType {
  const mapping = AUTOFILL_EXCEL_COLUMN_MAPPINGS.find(m => m.fieldName === fieldName);
  return mapping?.type || 'string';
} 