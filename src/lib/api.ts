import { API_BASE } from './constants';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Stats
  getStats: () => request<any>('/stats'),

  // Claims
  checkEligibility: (address: string) => request<any>(`/eligibility/${address}`),
  prepareClaim: (data: { kiAddress: string; ethAddress: string }) =>
    request<any>('/claim/prepare', { method: 'POST', body: JSON.stringify(data) }),
  submitClaim: (data: { kiAddress: string; ethAddress: string; signature: string; pubKey: string; nonce: string }) =>
    request<any>('/claim/submit', { method: 'POST', body: JSON.stringify(data) }),
  getClaimStatus: (address: string) => request<any>(`/claim/status/${address}`),

  // Governance
  getProposals: (limit = 5) => request<any>(`/governance/proposals/latest?limit=${limit}`),
  getVoteStatus: (proposalId: number, kiAddress: string) =>
    request<any>(`/governance/proposals/${proposalId}/vote-status/${kiAddress}`),
  submitVote: (proposalId: number, data: { kiAddress: string; voteChoice: string; signature: string; pubKey: string }) =>
    request<any>(`/governance/proposals/${proposalId}/vote`, { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getAdminClaims: () => request<any[]>('/admin/claims'),
  approveClaim: (id: string) => request<any>(`/admin/claims/${id}/approve`, { method: 'POST' }),
  rejectClaim: (id: string) => request<any>(`/admin/claims/${id}/reject`, { method: 'POST' }),
};
