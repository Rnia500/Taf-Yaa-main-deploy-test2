
export function validatePersonData(personData, _context) {
  if (!personData.fullName || typeof personData.fullName !== 'string' || personData.fullName.trim().length === 0) {
    throw new Error("Full name is required and must be a non-empty string.");
  }

  if (!personData.gender || !['male', 'female'].includes(personData.gender)) {
    throw new Error("Gender is required and must be 'male' or 'female'.");
  }

  if (personData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personData.email)) {
    throw new Error("Invalid email format.");
  } 

  if (personData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(personData.phoneNumber)) {
    throw new Error("Phone number must be a valid format.");
  }
}


export function validateTreeData(formData) {
  if (!formData.familyName) throw new Error("Family name is required");
  if (!formData.rootPersonName) throw new Error("Root person name is required");
  if (!formData.rootPersonGender) throw new Error("Root person gender is required");
  // Add more 
}
