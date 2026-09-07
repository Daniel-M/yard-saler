import { apiClient } from "@services/api/client";
import type { ProjectedEarningsResponse } from "@features/dashboard/types/earningsProjection.types";

export const getProjectedEarnings = (): Promise<ProjectedEarningsResponse> =>
  apiClient<ProjectedEarningsResponse>("/api/metrics/projected-earnings");
