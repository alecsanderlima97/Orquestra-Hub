export function tenantPath(tenantId: string) {
  return `tenants/${tenantId}`;
}

export function tenantCollectionPath(tenantId: string, collectionName: string) {
  return `${tenantPath(tenantId)}/${collectionName}`;
}
