import api from './api';

export const getDepartments = async () => {
  const response = await api.get('/departments/');
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories/');
  return response.data;
};

export const getStatuses = async () => {
  const response = await api.get('/status/');
  return response.data;
};

export const getPriorities = async () => {
  const response = await api.get('/priorities/');
  return response.data;
};

export const getSeverities = async () => {
  const response = await api.get('/severity/');
  return response.data;
};

// Admin CRUD functions
export const createDepartment = async (data) => {
  const response = await api.post('/departments/', data);
  return response.data;
};

export const updateDepartment = async (id, data) => {
  const response = await api.put(`/departments/${id}/`, data);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete(`/departments/${id}/`);
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post('/categories/', data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(`/categories/${id}/`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}/`);
  return response.data;
};

export const createStatus = async (data) => {
  const response = await api.post('/status/', data);
  return response.data;
};

export const updateStatus = async (id, data) => {
  const response = await api.put(`/status/${id}/`, data);
  return response.data;
};

export const deleteStatus = async (id) => {
  const response = await api.delete(`/status/${id}/`);
  return response.data;
};

export const createPriority = async (data) => {
  const response = await api.post('/priorities/', data);
  return response.data;
};

export const updatePriority = async (id, data) => {
  const response = await api.put(`/priorities/${id}/`, data);
  return response.data;
};

export const deletePriority = async (id) => {
  const response = await api.delete(`/priorities/${id}/`);
  return response.data;
};
