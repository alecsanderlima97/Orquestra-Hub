export type PortalSnapshotSyncSummary = {
  clientCount: number;
  contractVersion: "v1";
  dataVersion: number;
  generatedAt: string;
  onlineUserCount: number;
  payloadBytes: number;
  updatedAt: string;
  userCount: number;
};

export type PortalSnapshotSyncResponse = {
  ok: boolean;
  summary: PortalSnapshotSyncSummary;
};
