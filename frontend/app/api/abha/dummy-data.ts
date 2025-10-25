// Dummy ABHA data for simulation
export interface AbhaUser {
  abhaId: string
  fullName: string
  dob: string
  gender: "Male" | "Female" | "Other"
  bloodGroup: string
  address: {
    state: string
    district: string
    pincode: string
    address: string
  }
  phone: string
  email: string
  allergies: string[]
  medicalHistory: {
    condition: string
    diagnosedDate: string
    treatment: string
    medications: string[]
    status: "Active" | "Resolved" | "Chronic"
  }[]
  existingInsurance: {
    provider: string
    policyNumber: string
    coverage: string
    expiryDate: string
  }[]
  emergencyContact: {
    name: string
    relation: string
    phone: string
  }
  hasConsent: boolean
  consentDate?: string
}

export const dummyAbhaUsers: AbhaUser[] = [
  {
    abhaId: "12-3456-7890-1234",
    fullName: "Priya Sharma",
    dob: "1990-05-15",
    gender: "Female",
    bloodGroup: "B+",
    address: {
      state: "Maharashtra",
      district: "Mumbai",
      pincode: "400001",
      address: "123 Colaba Street, Fort, Mumbai"
    },
    phone: "+91-9876543210",
    email: "priya.sharma@email.com",
    allergies: ["Peanuts", "Shellfish"],
    medicalHistory: [
      {
        condition: "Hypertension",
        diagnosedDate: "2022-03-10",
        treatment: "Medication and lifestyle changes",
        medications: ["Amlodipine 5mg", "Lisinopril 10mg"],
        status: "Active"
      },
      {
        condition: "Type 2 Diabetes",
        diagnosedDate: "2021-11-20",
        treatment: "Diet control and medication",
        medications: ["Metformin 500mg"],
        status: "Active"
      }
    ],
    existingInsurance: [
      {
        provider: "Star Health Insurance",
        policyNumber: "SH-2023-001234",
        coverage: "₹5,00,000",
        expiryDate: "2024-12-31"
      }
    ],
    emergencyContact: {
      name: "Raj Sharma",
      relation: "Husband",
      phone: "+91-9876543211"
    },
    hasConsent: false
  },
  {
    abhaId: "98-7654-3210-9876",
    fullName: "Arjun Kumar",
    dob: "1985-12-08",
    gender: "Male",
    bloodGroup: "O+",
    address: {
      state: "Karnataka",
      district: "Bangalore",
      pincode: "560001",
      address: "456 MG Road, Bangalore"
    },
    phone: "+91-8765432109",
    email: "arjun.kumar@email.com",
    allergies: ["Dust", "Pollen"],
    medicalHistory: [
      {
        condition: "Asthma",
        diagnosedDate: "2015-06-12",
        treatment: "Inhaler therapy",
        medications: ["Salbutamol inhaler", "Budesonide inhaler"],
        status: "Chronic"
      },
      {
        condition: "Fractured leg",
        diagnosedDate: "2020-08-15",
        treatment: "Surgery and physiotherapy",
        medications: ["Pain medication"],
        status: "Resolved"
      }
    ],
    existingInsurance: [],
    emergencyContact: {
      name: "Sunita Kumar",
      relation: "Mother",
      phone: "+91-8765432108"
    },
    hasConsent: false
  },
  {
    abhaId: "11-2233-4455-6677",
    fullName: "Meera Patel",
    dob: "1992-09-22",
    gender: "Female",
    bloodGroup: "A+",
    address: {
      state: "Gujarat",
      district: "Ahmedabad",
      pincode: "380001",
      address: "789 CG Road, Ahmedabad"
    },
    phone: "+91-7654321098",
    email: "meera.patel@email.com",
    allergies: [],
    medicalHistory: [
      {
        condition: "Pregnancy checkup",
        diagnosedDate: "2023-01-10",
        treatment: "Regular monitoring",
        medications: ["Folic acid", "Iron supplements"],
        status: "Resolved"
      }
    ],
    existingInsurance: [
      {
        provider: "HDFC ERGO",
        policyNumber: "HE-2023-567890",
        coverage: "₹3,00,000",
        expiryDate: "2024-06-30"
      }
    ],
    emergencyContact: {
      name: "Kiran Patel",
      relation: "Husband",
      phone: "+91-7654321099"
    },
    hasConsent: false
  },
  {
    abhaId: "55-6677-8899-0011",
    fullName: "Rahul Singh",
    dob: "1988-03-18",
    gender: "Male",
    bloodGroup: "AB+",
    address: {
      state: "Delhi",
      district: "New Delhi",
      pincode: "110001",
      address: "321 Connaught Place, New Delhi"
    },
    phone: "+91-6543210987",
    email: "rahul.singh@email.com",
    allergies: ["Milk products"],
    medicalHistory: [
      {
        condition: "High Cholesterol",
        diagnosedDate: "2023-05-20",
        treatment: "Medication and diet changes",
        medications: ["Atorvastatin 20mg"],
        status: "Active"
      }
    ],
    existingInsurance: [
      {
        provider: "New India Assurance",
        policyNumber: "NI-2023-112233",
        coverage: "₹2,00,000",
        expiryDate: "2024-03-31"
      }
    ],
    emergencyContact: {
      name: "Priya Singh",
      relation: "Wife",
      phone: "+91-6543210988"
    },
    hasConsent: false
  },
  {
    abhaId: "33-4455-6677-8899",
    fullName: "Anita Reddy",
    dob: "1995-07-30",
    gender: "Female",
    bloodGroup: "O-",
    address: {
      state: "Telangana",
      district: "Hyderabad",
      pincode: "500001",
      address: "654 Banjara Hills, Hyderabad"
    },
    phone: "+91-5432109876",
    email: "anita.reddy@email.com",
    allergies: ["Sulpha drugs"],
    medicalHistory: [
      {
        condition: "Migraine",
        diagnosedDate: "2019-11-05",
        treatment: "Medication as needed",
        medications: ["Sumatriptan"],
        status: "Chronic"
      }
    ],
    existingInsurance: [],
    emergencyContact: {
      name: "Suresh Reddy",
      relation: "Father",
      phone: "+91-5432109877"
    },
    hasConsent: false
  }
]

export function findUserByAbhaId(abhaId: string): AbhaUser | null {
  return dummyAbhaUsers.find(user => user.abhaId === abhaId) || null
}

export function updateUserConsent(abhaId: string, consent: boolean): boolean {
  const userIndex = dummyAbhaUsers.findIndex(user => user.abhaId === abhaId)
  if (userIndex !== -1) {
    dummyAbhaUsers[userIndex].hasConsent = consent
    if (consent) {
      dummyAbhaUsers[userIndex].consentDate = new Date().toISOString()
    }
    return true
  }
  return false
}
