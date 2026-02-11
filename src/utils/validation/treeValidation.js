
export function validateTreeData(treeData) {
  if (!treeData.familyName) throw new Error("Family name is required");
  if (!treeData.rootPersonName) throw new Error("Root person name is required");
  if (!treeData.rootPersonGender) throw new Error("Root person gender is required");
  // ill add more later
}


export function validateMarriageData(marriageData) {
  if (!marriageData.spouses || marriageData.spouses.length < 2) {
    throw new Error("Marriage must have at least two spouses.");
  }
  // Add more latter
}
