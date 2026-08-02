/**
 * Reusable RBAC utility functions.
 */

export const isCitizen = (user) => {
  return user?.role?.role_name === 'citizen' || user?.role === 'citizen';
};

export const isOfficer = (user) => {
  return user?.role?.role_name === 'officer' || user?.role === 'officer';
};

export const isAdmin = (user) => {
  return user?.role?.role_name === 'admin' || user?.role === 'admin';
};

export const hasRole = (user, roleName) => {
  const currentRole = user?.role?.role_name || user?.role;
  return currentRole === roleName;
};

export const canAccess = (user, allowedRoles = []) => {
  if (!user) return false;
  if (allowedRoles.length === 0) return true;
  const currentRole = user?.role?.role_name || user?.role;
  return allowedRoles.includes(currentRole);
};
