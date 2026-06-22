import type { Material, MaterialCategory, Paginated, Unit } from '@pcf/shared';
import api from '../http-client';

export interface ListMaterialsQuery {
  category?: MaterialCategory;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateMaterialBody {
  name: string;
  category: MaterialCategory;
  defaultUnit: Unit;
  description?: string;
}

export const materialsApi = {
  list: (query: ListMaterialsQuery = {}) =>
    api
      .get<Paginated<Material>>('/api/v1/materials', { params: query })
      .then((r) => r.data),
  get: (id: string) => api.get<Material>(`/api/v1/materials/${id}`).then((r) => r.data),
  create: (body: CreateMaterialBody) =>
    api.post<Material>('/api/v1/materials', body).then((r) => r.data),
  update: (id: string, body: Partial<CreateMaterialBody>) =>
    api.patch<Material>(`/api/v1/materials/${id}`, body).then((r) => r.data),
  remove: (id: string) =>
    api.delete<void>(`/api/v1/materials/${id}`).then((r) => r.data),
};
