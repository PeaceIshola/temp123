// Utility to parse school names from CSV
export const parseSchoolNames = (csvContent: string): string[] => {
  const lines = csvContent.split('\n');
  const schools = new Set<string>();
  
  // Skip header (first line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV line - school name is in the 4th column
    const match = line.match(/^[^,]*,[^,]*,[^,]*,"([^"]*)"/);
    if (match && match[1]) {
      const schoolName = match[1].trim();
      if (schoolName) {
        schools.add(schoolName);
      }
    }
  }
  
  return Array.from(schools).sort();
};

// Load and parse schools from CSV
let cachedSchools: string[] | null = null;

export const loadSchools = async (): Promise<string[]> => {
  if (cachedSchools) return cachedSchools;
  
  try {
    const response = await fetch('/schools.csv');
    const csvContent = await response.text();
    cachedSchools = parseSchoolNames(csvContent);
    return cachedSchools;
  } catch (error) {
    console.error('Error loading schools:', error);
    return [];
  }
};
