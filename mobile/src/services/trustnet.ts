import { Connection } from '@solana/web3.js';
import { createConnection } from '../utils/solana';
import * as TrustNetSdk from '@trustnet/sdk';

export type CreateJobParams = {
  client: string;
  provider: string;
  amountLamports: bigint;
  deadlineUnix: number;
  termsHash: Uint8Array;
};

export type JobSummary = {
  jobPda: string;
  client: string;
  provider: string;
  amountLamports: bigint;
  deadlineUnix: number;
  status: string;
};

export type ReputationSummary = {
  completed: number;
  failed: number;
  volumeLamports: bigint;
  averageRating: number;
};

let cachedSdk: any | null = null;

function resolveSdkClient(connection: Connection, walletPublicKey?: string | null) {
  if (cachedSdk) {
    return cachedSdk;
  }

  const sdkModule: any = TrustNetSdk;
  const ClientCtor =
    sdkModule?.TrustNetClient ??
    sdkModule?.Client ??
    sdkModule?.default ??
    null;

  if (ClientCtor) {
    try {
      cachedSdk = new ClientCtor({
        connection,
        walletPublicKey
      });
    } catch (error) {
      cachedSdk = ClientCtor;
    }
  } else {
    cachedSdk = sdkModule;
  }

  return cachedSdk;
}

function getSdk(connection: Connection, walletPublicKey?: string | null) {
  return resolveSdkClient(connection, walletPublicKey);
}

export async function createJob(
  params: CreateJobParams,
  connection: Connection = createConnection(),
  walletPublicKey?: string | null
) {
  const sdk = getSdk(connection, walletPublicKey);
  if (sdk?.createJob) {
    return sdk.createJob(params);
  }

  return {
    jobPda: `mock-job-${Date.now()}`,
    ...params
  };
}

export async function acceptJob(
  jobPda: string,
  stakeLamports: bigint,
  connection: Connection = createConnection(),
  walletPublicKey?: string | null
) {
  const sdk = getSdk(connection, walletPublicKey);
  if (sdk?.acceptJob) {
    return sdk.acceptJob(jobPda, stakeLamports);
  }

  return { jobPda, stakeLamports, status: 'accepted' };
}

export async function submitCompletion(
  jobPda: string,
  submissionHash: Uint8Array,
  connection: Connection = createConnection(),
  walletPublicKey?: string | null
) {
  const sdk = getSdk(connection, walletPublicKey);
  if (sdk?.submitCompletion) {
    return sdk.submitCompletion(jobPda, submissionHash);
  }

  return { jobPda, submissionHash, status: 'submitted' };
}

export async function approveCompletion(
  jobPda: string,
  connection: Connection = createConnection(),
  walletPublicKey?: string | null
) {
  const sdk = getSdk(connection, walletPublicKey);
  if (sdk?.approveCompletion) {
    return sdk.approveCompletion(jobPda);
  }

  return { jobPda, status: 'approved' };
}

export async function getJob(
  jobPda: string,
  connection: Connection = createConnection(),
  walletPublicKey?: string | null
): Promise<JobSummary> {
  const sdk = getSdk(connection, walletPublicKey);
  if (sdk?.getJob) {
    return sdk.getJob(jobPda);
  }

  return {
    jobPda,
    client: 'Unknown',
    provider: 'Unknown',
    amountLamports: BigInt(0),
    deadlineUnix: Math.floor(Date.now() / 1000),
    status: 'mock'
  };
}

export async function getJobsForAgent(
  agentPubkey: string,
  connection: Connection = createConnection(),
  walletPublicKey?: string | null
): Promise<JobSummary[]> {
  const sdk = getSdk(connection, walletPublicKey);
  if (sdk?.getJobsForAgent) {
    return sdk.getJobsForAgent(agentPubkey);
  }

  return [
    {
      jobPda: `mock-job-${Date.now()}`,
      client: agentPubkey,
      provider: 'MockProvider',
      amountLamports: BigInt(1000000000),
      deadlineUnix: Math.floor(Date.now() / 1000) + 3600,
      status: 'open'
    }
  ];
}

export async function getReputation(
  agentPubkey: string,
  connection: Connection = createConnection(),
  walletPublicKey?: string | null
): Promise<ReputationSummary> {
  const sdk = getSdk(connection, walletPublicKey);
  if (sdk?.getReputation) {
    return sdk.getReputation(agentPubkey);
  }

  return {
    completed: 4,
    failed: 1,
    volumeLamports: BigInt(5000000000),
    averageRating: 4.2
  };
}

export async function rateJob(
  jobPda: string,
  score: number,
  tags: string[],
  comment: string | undefined,
  connection: Connection = createConnection(),
  walletPublicKey?: string | null
) {
  const sdk = getSdk(connection, walletPublicKey);
  if (sdk?.rateJob) {
    return sdk.rateJob(jobPda, score, tags, comment);
  }

  return { jobPda, score, tags, comment, status: 'rated' };
}
