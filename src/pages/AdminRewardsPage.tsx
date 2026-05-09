import { useState, useMemo } from 'react'
import { formatUnits, parseUnits, type Address } from 'viem'
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Search, Download } from 'lucide-react'
import {
  useRewardTokenList,
  useTVL,
  useTotalWeight,
  useTreasuryAddress,
  useMultiRewardState,
  useMultiTreasuryBalance,
  useMultiTreasuryAllowance,
  useEarnedLookup,
} from '../hooks/useRewardsAdmin'
import {
  XKI_TOKEN,
  XKI_REWARD_DISTRIBUTOR,
  TREASURY_SAFE,
} from '../config/contracts'
import {
  encodeApprove,
  encodeNotifyReward,
  encodeAddRewardToken,
  encodeSetFeeRouter,
  generateSafeBatchJson,
  type SafeTx,
} from '../lib/calldata'

// --- Helpers ---

const MAX_UINT256 = 2n ** 256n - 1n

function fmt(value: bigint | undefined, decimals: number, dp = 2): string {
  if (value === undefined) return '—'
  if (value >= MAX_UINT256 / 2n) return 'Unlimited'
  const str = formatUnits(value, decimals)
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(Number(str))
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, key?: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key ?? text)
    setTimeout(() => setCopied(null), 2000)
  }
  return { copied, copy }
}

function CopyBtn({ text, label, copyKey }: { text: string; label?: string; copyKey?: string }) {
  const { copied, copy } = useCopy()
  const k = copyKey ?? text
  return (
    <button
      onClick={() => copy(text, k)}
      className="inline-flex items-center gap-1 border border-white/20 text-gray-400 text-[10px] uppercase tracking-widest hover:text-white hover:border-white/40 px-2 py-1 transition-all"
    >
      {copied === k ? <><Check size={10} /> Copied</> : <><Copy size={10} /> {label ?? 'Copy'}</>}
    </button>
  )
}

function Skeleton() {
  return <div className="h-6 w-24 animate-pulse bg-white/10 rounded" />
}

// --- Page ---

export default function AdminRewardsPage() {
  const { tokens, addresses, isLoading: tokensLoading } = useRewardTokenList()
  const { data: tvlRaw, isLoading: tvlLoading } = useTVL()
  const { data: totalWeightRaw, isLoading: twLoading } = useTotalWeight()
  const { data: treasuryAddr } = useTreasuryAddress()
  const { data: rewardStates } = useMultiRewardState(addresses)
  const { data: balances } = useMultiTreasuryBalance(addresses)
  const { data: allowances } = useMultiTreasuryAllowance(addresses)

  const { copied, copy } = useCopy()

  // --- Section D state ---
  const [selectedToken, setSelectedToken] = useState<number>(0)
  const [amount, setAmount] = useState('')
  const [durationDays, setDurationDays] = useState('7')

  // --- Section E state ---
  const [lookupAddr, setLookupAddr] = useState('')
  const [lookupSubmitted, setLookupSubmitted] = useState<Address | undefined>()
  const { data: earnedResults } = useEarnedLookup(lookupSubmitted, addresses)

  // --- Section B: Add token ---
  const [showAddToken, setShowAddToken] = useState(false)
  const [newTokenAddr, setNewTokenAddr] = useState('')

  // --- Section F state ---
  const [feeExpanded, setFeeExpanded] = useState(false)
  const [feeRouter, setFeeRouter] = useState('')
  const [feeApproved, setFeeApproved] = useState(true)

  const now = Math.floor(Date.now() / 1000)

  // Parse reward states
  const parsedStates = useMemo(() => {
    if (!rewardStates) return []
    return rewardStates.map((r) => {
      if (r.status !== 'success' || !r.result) return null
      const res = r.result as [bigint, bigint, bigint, bigint]
      return { rewardRate: res[0], periodFinish: res[1], rewardPerTokenStored: res[2], lastUpdateTime: res[3] }
    })
  }, [rewardStates])

  // Distribution calldata
  const distCalldata = useMemo(() => {
    if (!tokens.length || !amount || !durationDays) return null
    const token = tokens[selectedToken]
    if (!token) return null
    try {
      const amountWei = parseUnits(amount, token.decimals)
      const durationSec = BigInt(Math.floor(Number(durationDays) * 86400))
      const txs: SafeTx[] = [
        { to: token.address, value: '0', data: encodeApprove(XKI_REWARD_DISTRIBUTOR, amountWei), description: `Approve ${amount} ${token.symbol} to RewardDistributor` },
        { to: XKI_REWARD_DISTRIBUTOR, value: '0', data: encodeNotifyReward(token.address, amountWei, durationSec), description: `Notify ${amount} ${token.symbol} over ${durationDays} days` },
      ]
      return { txs, json: generateSafeBatchJson(txs) }
    } catch { return null }
  }, [tokens, selectedToken, amount, durationDays])

  const safeUrl = `https://app.safe.global/transactions/queue?safe=eth:${TREASURY_SAFE}`

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* Section A — Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashCard label="TVL (XKI Staked)" loading={tvlLoading}>
          {fmt(tvlRaw as bigint | undefined, 18)}
        </DashCard>
        <DashCard label="Total Weight" loading={twLoading}>
          {fmt(totalWeightRaw as bigint | undefined, 18)}
        </DashCard>
        <DashCard label="Reward Tokens" loading={tokensLoading}>
          {tokens.length.toString()}
        </DashCard>
        <DashCard label="Treasury" loading={false}>
          <div className="flex items-center gap-2">
            <span className="text-xl font-serif text-white">{shortAddr(TREASURY_SAFE)}</span>
            <button onClick={() => copy(TREASURY_SAFE, 'treasury')} className="text-gray-500 hover:text-white transition-colors">
              {copied === 'treasury' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </DashCard>
      </div>

      {/* Section B — Reward Tokens Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] uppercase tracking-widest text-gray-500">Reward Tokens</h2>
          <button onClick={() => setShowAddToken(!showAddToken)} className="bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 px-3 py-1.5 transition-colors">
            + Add Token
          </button>
        </div>

        {showAddToken && (
          <div className="glass-panel p-4 mb-4 space-y-3">
            <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600">Token Address</label>
            <div className="flex gap-2">
              <input value={newTokenAddr} onChange={(e) => setNewTokenAddr(e.target.value)} placeholder="0x..." className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white rounded focus:outline-none focus:border-white/30" />
              {newTokenAddr.length === 42 && (
                <CopyBtn text={encodeAddRewardToken(newTokenAddr as Address)} label="Calldata" />
              )}
            </div>
            {newTokenAddr.length === 42 && (
              <div className="text-[10px] text-gray-500 font-mono break-all">
                To: {XKI_REWARD_DISTRIBUTOR}
              </div>
            )}
          </div>
        )}

        {/* XKI not registered warning */}
        {!tokensLoading && !addresses.some(a => a.toLowerCase() === XKI_TOKEN.toLowerCase()) && (
          <div className="glass-panel p-4 mb-4 flex items-center gap-3 border-[#D4AF37]/30">
            <AlertTriangle size={16} className="text-[#D4AF37] shrink-0" />
            <div className="text-sm text-gray-400">
              $XKI not registered as reward token.{' '}
              <CopyBtn text={encodeAddRewardToken(XKI_TOKEN)} label="Copy addRewardToken calldata" />
            </div>
          </div>
        )}

        <div className="glass-panel overflow-hidden">
          <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.3em] text-gray-600 border-b border-white/5">
            <span>Token</span><span>Address</span><span>Safe Balance</span><span>Allowance</span><span>Rate</span><span>Period End</span><span>Status</span>
          </div>
          {tokensLoading ? (
            <div className="p-4"><Skeleton /></div>
          ) : tokens.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No reward tokens registered</div>
          ) : tokens.map((token, i) => {
            const state = parsedStates[i]
            const balance = balances?.[i]?.result as bigint | undefined
            const allowance = allowances?.[i]?.result as bigint | undefined
            const active = state && Number(state.periodFinish) > now
            const ended = state && Number(state.periodFinish) > 0 && Number(state.periodFinish) <= now
            const rate = state?.rewardRate
            const ratePerDay = rate ? (rate * 86400n) : undefined

            return (
              <div key={token.address} className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-white/5 items-center">
                <span className="text-sm text-white font-serif">{token.symbol}</span>
                <span className="text-xs font-mono text-gray-400">{shortAddr(token.address)}</span>
                <span className="text-sm font-mono text-white">{fmt(balance, token.decimals)}</span>
                <span className="text-sm font-mono text-white">{fmt(allowance, token.decimals)}</span>
                <span className="text-sm font-mono text-white">{ratePerDay !== undefined ? fmt(ratePerDay, token.decimals) + '/d' : '—'}</span>
                <span className="text-xs font-mono text-gray-400">
                  {state?.periodFinish ? new Date(Number(state.periodFinish) * 1000).toLocaleDateString() : '—'}
                </span>
                <span>
                  {active ? (
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>Active</span>
                  ) : ended ? (
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded text-gray-500 bg-white/5 border border-white/10">Ended</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 text-gray-600">None</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Section C — Active Distributions */}
      {tokens.some((_, i) => parsedStates[i] && Number(parsedStates[i]!.periodFinish) > now) && (
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Active Distributions</h2>
          <div className="space-y-3">
            {tokens.map((token, i) => {
              const state = parsedStates[i]
              if (!state || Number(state.periodFinish) <= now) return null
              const finish = Number(state.periodFinish)
              const lastUpdate = Number(state.lastUpdateTime)
              const elapsed = now - lastUpdate
              const total = finish - lastUpdate + elapsed
              const progress = total > 0 ? Math.min((elapsed / total) * 100, 100) : 0
              const remaining = finish - now
              const ratePerDay = state.rewardRate * 86400n
              const daysStr = remaining > 86400 ? `${Math.floor(remaining / 86400)}d ${Math.floor((remaining % 86400) / 3600)}h` : `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m`

              return (
                <div key={token.address} className="glass-panel p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-serif text-white">{token.symbol}</span>
                    <span className="text-xs text-gray-400">{daysStr} remaining</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#D4AF37' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>{fmt(ratePerDay, token.decimals)} {token.symbol}/day</span>
                    <span>Ends {new Date(finish * 1000).toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Section D — New Distribution */}
      <section>
        <h2 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">New Distribution</h2>
        <div className="glass-panel p-6 space-y-5">
          {tokens.length > 0 ? (
            <>
              <div>
                <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2 block">Token</label>
                <select value={selectedToken} onChange={(e) => setSelectedToken(Number(e.target.value))} className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white rounded w-full focus:outline-none focus:border-white/30">
                  {tokens.map((t, i) => <option key={t.address} value={i}>{t.symbol} ({shortAddr(t.address)})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2 block">Amount</label>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white rounded w-full focus:outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2 block">Duration (days)</label>
                  <input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="7" className="bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white rounded w-full focus:outline-none focus:border-white/30" />
                </div>
              </div>

              {amount && durationDays && Number(durationDays) > 0 && (
                <div className="text-sm text-gray-400">
                  Preview: <span className="text-white">{amount} {tokens[selectedToken]?.symbol}</span> over <span className="text-white">{durationDays} days</span> = <span className="text-white">{(Number(amount) / Number(durationDays)).toFixed(4)} {tokens[selectedToken]?.symbol}/day</span>
                </div>
              )}

              {/* Warning if active */}
              {parsedStates[selectedToken] && Number(parsedStates[selectedToken]!.periodFinish) > now && (
                <div className="flex items-center gap-2 text-sm text-[#D4AF37]">
                  <AlertTriangle size={14} />
                  Remaining tokens from current period will be added to the new distribution
                </div>
              )}

              {distCalldata && (
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600">Generated Transactions</label>
                  {distCalldata.txs.map((tx, i) => (
                    <div key={i} className="bg-white/5 rounded p-3 space-y-2">
                      <div className="text-[10px] text-gray-400">{tx.description}</div>
                      <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                        <span>To: {shortAddr(tx.to)}</span>
                        <CopyBtn text={tx.to} label="Addr" copyKey={`to-${i}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500 truncate max-w-[300px]">Data: {tx.data.slice(0, 20)}…</span>
                        <CopyBtn text={tx.data} label="Data" copyKey={`data-${i}`} />
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => {
                      const blob = new Blob([distCalldata.json], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `xki-distribution-${Date.now()}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }} className="bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 px-4 py-2 transition-colors inline-flex items-center gap-1">
                      <Download size={10} /> Download Safe Batch JSON
                    </button>
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="border border-white/20 text-gray-400 text-[10px] uppercase tracking-widest hover:text-white hover:border-white/40 px-4 py-2 transition-all inline-flex items-center gap-1">
                      Open Safe <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500">No reward tokens registered. Add a token first.</div>
          )}
        </div>
      </section>

      {/* Section E — Earnings Lookup */}
      <section>
        <h2 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Earnings Lookup</h2>
        <div className="glass-panel p-5 space-y-4">
          <div className="flex gap-2">
            <input value={lookupAddr} onChange={(e) => setLookupAddr(e.target.value)} placeholder="0x… wallet address" className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white rounded focus:outline-none focus:border-white/30" />
            <button onClick={() => setLookupSubmitted(lookupAddr as Address)} disabled={lookupAddr.length !== 42} className="bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 px-4 py-2 transition-colors disabled:opacity-30 inline-flex items-center gap-1">
              <Search size={10} /> Lookup
            </button>
          </div>
          {lookupSubmitted && earnedResults && (
            <div className="space-y-1">
              {tokens.map((token, i) => {
                const earned = earnedResults[i]?.result as bigint | undefined
                return (
                  <div key={token.address} className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-white">{token.symbol}</span>
                    <span className="text-sm font-mono text-white">{fmt(earned, token.decimals)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Section F — Fee Router Management */}
      <section>
        <button onClick={() => setFeeExpanded(!feeExpanded)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 mb-4 hover:text-white transition-colors">
          Fee Router Management {feeExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {feeExpanded && (
          <div className="glass-panel p-5 space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2 block">Router Address</label>
                <input value={feeRouter} onChange={(e) => setFeeRouter(e.target.value)} placeholder="0x..." className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white rounded focus:outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2 block">Action</label>
                <select value={feeApproved ? '1' : '0'} onChange={(e) => setFeeApproved(e.target.value === '1')} className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-white/30">
                  <option value="1">Approve</option>
                  <option value="0">Revoke</option>
                </select>
              </div>
            </div>
            {feeRouter.length === 42 && (
              <div className="space-y-2">
                <div className="text-[10px] text-gray-500 font-mono">To: {XKI_REWARD_DISTRIBUTOR}</div>
                <CopyBtn text={encodeSetFeeRouter(feeRouter as Address, feeApproved)} label="Copy Calldata" />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function DashCard({ label, loading, children }: { label: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="glass-panel p-5">
      <div className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">{label}</div>
      {loading ? <Skeleton /> : <div className="text-xl font-serif text-white">{children}</div>}
    </div>
  )
}
