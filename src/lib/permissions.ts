export const isBizoomaOrganization = (organizationSlug?: string): boolean => {
  return organizationSlug === 'bizooma';
};

export const isBizoomaMember = (organizationSlug?: string): boolean => {
  return isBizoomaOrganization(organizationSlug);
};
