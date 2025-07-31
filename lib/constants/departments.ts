// Department Constants
export const DEPARTMENTS = {
  COMPUTER_SCIENCE: "Computer Science",
  MATHEMATICS: "Mathematics", 
  PHYSICS: "Physics",
  CHEMISTRY: "Chemistry",
  BIOLOGY: "Biology",
  ENGINEERING: "Engineering",
  BUSINESS: "Business",
  ECONOMICS: "Economics",
  PSYCHOLOGY: "Psychology",
  SOCIOLOGY: "Sociology",
  HISTORY: "History",
  LITERATURE: "Literature",
  LANGUAGES: "Languages",
  ART: "Art",
  MUSIC: "Music",
  MEDICINE: "Medicine",
  LAW: "Law",
  EDUCATION: "Education",
  AGRICULTURE: "Agriculture",
  ENVIRONMENTAL_SCIENCE: "Environmental Science",
  ADMINISTRATION: "Administration"
} as const

export const DEPARTMENT_OPTIONS = [
  { 
    value: DEPARTMENTS.COMPUTER_SCIENCE, 
    label: "Computer Science", 
    description: "Computer Science and Information Technology",
    icon: "Code"
  },
  { 
    value: DEPARTMENTS.MATHEMATICS, 
    label: "Mathematics", 
    description: "Mathematics and Statistics",
    icon: "Calculator"
  },
  { 
    value: DEPARTMENTS.PHYSICS, 
    label: "Physics", 
    description: "Physics and Physical Sciences",
    icon: "Atom"
  },
  { 
    value: DEPARTMENTS.CHEMISTRY, 
    label: "Chemistry", 
    description: "Chemistry and Chemical Sciences",
    icon: "Flask"
  },
  { 
    value: DEPARTMENTS.BIOLOGY, 
    label: "Biology", 
    description: "Biological Sciences",
    icon: "Leaf"
  },
  { 
    value: DEPARTMENTS.ENGINEERING, 
    label: "Engineering", 
    description: "Engineering and Technology",
    icon: "Wrench"
  },
  { 
    value: DEPARTMENTS.BUSINESS, 
    label: "Business", 
    description: "Business Administration and Management",
    icon: "Briefcase"
  },
  { 
    value: DEPARTMENTS.ECONOMICS, 
    label: "Economics", 
    description: "Economics and Economic Sciences",
    icon: "TrendingUp"
  },
  { 
    value: DEPARTMENTS.PSYCHOLOGY, 
    label: "Psychology", 
    description: "Psychology and Behavioral Sciences",
    icon: "Brain"
  },
  { 
    value: DEPARTMENTS.SOCIOLOGY, 
    label: "Sociology", 
    description: "Sociology and Social Sciences",
    icon: "Users"
  },
  { 
    value: DEPARTMENTS.HISTORY, 
    label: "History", 
    description: "History and Historical Studies",
    icon: "BookOpen"
  },
  { 
    value: DEPARTMENTS.LITERATURE, 
    label: "Literature", 
    description: "Literature and Language Arts",
    icon: "Book"
  },
  { 
    value: DEPARTMENTS.LANGUAGES, 
    label: "Languages", 
    description: "Languages and Linguistics",
    icon: "Globe"
  },
  { 
    value: DEPARTMENTS.ART, 
    label: "Art", 
    description: "Art and Creative Arts",
    icon: "Palette"
  },
  { 
    value: DEPARTMENTS.MUSIC, 
    label: "Music", 
    description: "Music and Performing Arts",
    icon: "Music"
  },
  { 
    value: DEPARTMENTS.MEDICINE, 
    label: "Medicine", 
    description: "Medicine and Health Sciences",
    icon: "Heart"
  },
  { 
    value: DEPARTMENTS.LAW, 
    label: "Law", 
    description: "Law and Legal Studies",
    icon: "Scale"
  },
  { 
    value: DEPARTMENTS.EDUCATION, 
    label: "Education", 
    description: "Education and Teaching",
    icon: "GraduationCap"
  },
  { 
    value: DEPARTMENTS.AGRICULTURE, 
    label: "Agriculture", 
    description: "Agriculture and Agricultural Sciences",
    icon: "Tree"
  },
  { 
    value: DEPARTMENTS.ENVIRONMENTAL_SCIENCE, 
    label: "Environmental Science", 
    description: "Environmental Science and Sustainability",
    icon: "Leaf"
  },
  { 
    value: DEPARTMENTS.ADMINISTRATION, 
    label: "Administration", 
    description: "University Administration",
    icon: "Shield"
  }
] as const

// Type exports
export type Department = typeof DEPARTMENTS[keyof typeof DEPARTMENTS]

// Helper functions
export const getDepartmentLabel = (department: Department): string => {
  const departmentOption = DEPARTMENT_OPTIONS.find(option => option.value === department)
  return departmentOption?.label || department
}

export const getDepartmentDescription = (department: Department): string => {
  const departmentOption = DEPARTMENT_OPTIONS.find(option => option.value === department)
  return departmentOption?.description || ""
}

export const isValidDepartment = (department: string): department is Department => {
  return Object.values(DEPARTMENTS).includes(department as Department)
}

export const getAllDepartments = (): Department[] => {
  return Object.values(DEPARTMENTS)
} 