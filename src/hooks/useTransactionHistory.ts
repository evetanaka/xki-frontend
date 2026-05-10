import { useState, useEffect, useCallback } from 'react';
import { type Address, formatUnits } from 'viem';
import { XKI_TOKEN, XKI_STAKING, XKI_REWARD_DISTRIBUTOR } from '../config/contracts';

const ETHERSCAN_API = 'https://api.etherscan.io/v2/api?chainid=1';
const API_KEY = 'CI87M6KVQTIQSS96MESKDET1J2SKJADHDB';
const PAGE_SIZE = 10;

// Event signatures (keccak256)
const TOPICS = {
  Staked: '0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38c08ba9e91f5c', // Staked(address,uint256,uint256,uint8,uint256)
  UnstakeRequested: '0x5765e9e35bb817152e9fa6d9a498e89e9a5e01ea00d63a1c570e3480a8ad3e93', // UnstakeRequested(address,uint256,uint256)
  UnstakeCompleted: '0x21e3a47d67bdfe8f4fda5cec9e7b4692ee80e0e4aa84e4ef45e834a238652b50', // UnstakeCompleted(address,uint256,uint256)
  HardUnstaked: '0x0903c24e73673aabc498e4bdd32e4ea773feb232e0e3309e5b5e0b70e1ccef68', // HardUnstaked(address,uint256,uint256,uint256)
  RewardClaimed: '0x9e6a3c3a9a6c6e3e8c1e7a2b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c', // placeholder
  Transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
};

export type TxEvent = {
  type: 'stake' | 'unstake_request' | 'unstake_complete' | 'hard_unstake' | 'reward_claimed' | 'transfer_in' | 'transfer_out' | 'vesting_release';
  timestamp: number;
  txHash: string;
  amount: bigint;
  extra?: string; // tier name, penalty, counterparty etc
};

async function fetchLogs(address: string, contract: string, topic0: string): Promise<any[]> {
  const paddedAddr = '0x000000000000000000000000' + address.slice(2).toLowerCase();
  const url = `${ETHERSCAN_API}&module=logs&action=getLogs&address=${contract}&topic0=${topic0}&topic1=${paddedAddr}&topic1_0_opr=and&fromBlock=0&toBlock=latest&sort=desc&apikey=${API_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return json.status === '1' && Array.isArray(json.result) ? json.result : [];
  } catch {
    return [];
  }
}

async function fetchTransfers(address: string, direction: 'in' | 'out'): Promise<any[]> {
  const paddedAddr = '0x000000000000000000000000' + address.slice(2).toLowerCase();
  const topicParam = direction === 'in' ? 'topic2' : 'topic1';
  const url = `${ETHERSCAN_API}&module=logs&action=getLogs&address=${XKI_TOKEN}&topic0=${TOPICS.Transfer}&${topicParam}=${paddedAddr}&topic0_${direction === 'in' ? '2' : '1'}_opr=and&fromBlock=0&toBlock=latest&sort=desc&apikey=${API_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return json.status === '1' && Array.isArray(json.result) ? json.result : [];
  } catch {
    return [];
  }
}

const TIER_NAME: Record<number, string> = { 0: 'Explorer', 1: 'Builder', 2: 'Architect', 3: 'Founder', 4: 'Visionary' };
const TIER_MULT: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 };
const TIER_DUR: Record<number, string> = { 0: '3m', 1: '6m', 2: '12m', 3: '24m', 4: '36m' };

function parseStakingLogs(logs: any[]): TxEvent[] {
  return logs.map((log) => {
    const data = log.data.slice(2); // remove 0x
    const amount = BigInt('0x' + data.slice(0, 64));
    const tierRaw = parseInt(data.slice(64, 128), 16);
    const tier = tierRaw < 5 ? tierRaw : 0;
    return {
      type: 'stake' as const,
      timestamp: parseInt(log.timeStamp, 16),
      txHash: log.transactionHash,
      amount,
      extra: `${TIER_NAME[tier]} (${TIER_DUR[tier]}, ${TIER_MULT[tier]}x)`,
    };
  });
}

function parseUnstakeRequestLogs(logs: any[]): TxEvent[] {
  return logs.map((log) => {
    const data = log.data.slice(2);
    const cooldownEnd = Number(BigInt('0x' + data.slice(0, 64)));
    return {
      type: 'unstake_request' as const,
      timestamp: parseInt(log.timeStamp, 16),
      txHash: log.transactionHash,
      amount: 0n,
      extra: new Date(cooldownEnd * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  });
}

function parseUnstakeCompleteLogs(logs: any[]): TxEvent[] {
  return logs.map((log) => {
    const data = log.data.slice(2);
    const amount = BigInt('0x' + data.slice(0, 64));
    return {
      type: 'unstake_complete' as const,
      timestamp: parseInt(log.timeStamp, 16),
      txHash: log.transactionHash,
      amount,
    };
  });
}

function parseHardUnstakeLogs(logs: any[]): TxEvent[] {
  return logs.map((log) => {
    const data = log.data.slice(2);
    const returned = BigInt('0x' + data.slice(0, 64));
    const penalty = BigInt('0x' + data.slice(64, 128));
    return {
      type: 'hard_unstake' as const,
      timestamp: parseInt(log.timeStamp, 16),
      txHash: log.transactionHash,
      amount: returned,
      extra: formatUnits(penalty, 6),
    };
  });
}

function parseTransferLogs(logs: any[], address: string, direction: 'in' | 'out'): TxEvent[] {
  const stakingLower = XKI_STAKING.toLowerCase();
  const distributorLower = XKI_REWARD_DISTRIBUTOR.toLowerCase();

  return logs
    .filter((log) => {
      // Skip transfers to/from staking and distributor (those are staking/claim events)
      const from = '0x' + log.topics[1].slice(26);
      const to = '0x' + log.topics[2].slice(26);
      const counterparty = direction === 'in' ? from : to;
      return counterparty.toLowerCase() !== stakingLower && counterparty.toLowerCase() !== distributorLower;
    })
    .map((log) => {
      const amount = BigInt(log.data);
      const counterparty = direction === 'in'
        ? '0x' + log.topics[1].slice(26)
        : '0x' + log.topics[2].slice(26);
      const short = `${counterparty.slice(0, 6)}...${counterparty.slice(-4)}`;
      return {
        type: (direction === 'in' ? 'transfer_in' : 'transfer_out') as TxEvent['type'],
        timestamp: parseInt(log.timeStamp, 16),
        txHash: log.transactionHash,
        amount,
        extra: short,
      };
    });
}

export function useTransactionHistory(address: Address | undefined) {
  const [events, setEvents] = useState<TxEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const fetchAll = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const [stakeLogs, reqLogs, compLogs, hardLogs, inLogs, outLogs] = await Promise.all([
        fetchLogs(address, XKI_STAKING, TOPICS.Staked),
        fetchLogs(address, XKI_STAKING, TOPICS.UnstakeRequested),
        fetchLogs(address, XKI_STAKING, TOPICS.UnstakeCompleted),
        fetchLogs(address, XKI_STAKING, TOPICS.HardUnstaked),
        fetchTransfers(address, 'in'),
        fetchTransfers(address, 'out'),
      ]);

      const all: TxEvent[] = [
        ...parseStakingLogs(stakeLogs),
        ...parseUnstakeRequestLogs(reqLogs),
        ...parseUnstakeCompleteLogs(compLogs),
        ...parseHardUnstakeLogs(hardLogs),
        ...parseTransferLogs(inLogs, address, 'in'),
        ...parseTransferLogs(outLogs, address, 'out'),
      ].sort((a, b) => b.timestamp - a.timestamp);

      // Dedupe by txHash+type
      const seen = new Set<string>();
      const deduped = all.filter((e) => {
        const key = `${e.txHash}-${e.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setEvents(deduped);
    } catch (err) {
      console.error('[TxHistory] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const loadMore = () => setDisplayCount((c) => c + PAGE_SIZE);
  const hasMore = displayCount < events.length;

  return {
    events: events.slice(0, displayCount),
    totalCount: events.length,
    isLoading,
    loadMore,
    hasMore,
  };
}
