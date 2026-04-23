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
  searchClaims: (q: string) => request<any[]>(`/admin/claims/search?q=${encodeURIComponent(q)}`),
  validateAll: () => request<any>('/admin/validate-all', { method: 'POST' }),
  markTeam: (wallets: { kiAddress: string; initialAmountDistributed: number }[]) =>
    request<any>('/admin/claims/mark-team', { method: 'POST', body: JSON.stringify({ wallets }) }),
  verifyClaim: (id: number) => request<any>(`/admin/claims/${id}/verify`, { method: 'POST' }),
  deleteClaim: (id: number) => request<any>(`/admin/claims/${id}`, { method: 'DELETE' }),

  // NFT Claim
  getNftConfig: () => request<any>('/nft/config'),
  getNftPortfolio: (kiAddress: string) => request<any>(`/nft/portfolio/${kiAddress}`),
  getNftClaimStatus: (kiAddress: string) => request<any>(`/nft/claim/${kiAddress}`),
  getNftNonce: (kiAddress: string) => request<any>(`/nft/nonce/${kiAddress}`),
  submitNftClaim: (data: {
    ki_address: string;
    eth_address: string;
    signature: string;
    pub_key: string;
    nonce: string;
    signed_message: string;
  }) => request<any>('/nft/claims', { method: 'POST', body: JSON.stringify(data) }),
};
