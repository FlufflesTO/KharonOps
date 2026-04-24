import React, { createContext, useContext, type ReactNode } from "react";
import type { Role } from "@kharon/domain";

interface RolePermissions {
  canAccessPeopleDirectory: boolean;
  canGenerateDocuments: boolean;
  isAdmin: boolean;
  canManageSchedules: boolean;
  canReadFinanceData: boolean;
  canModifyUser: boolean;
  canCreateJob: boolean;
  canDeleteJob: boolean;
  canReadUser: boolean;
  canModifyFinanceData: boolean;
}

interface RolePermissionsContextProps {
  effectiveRole: Role | null;
  children: ReactNode;
}

const RolePermissionsContext = createContext<RolePermissions | undefined>(undefined);

export function RolePermissionsProvider({ 
  effectiveRole, 
  children 
}: RolePermissionsContextProps) {
  const permissions: RolePermissions = {
    canAccessPeopleDirectory: 
      effectiveRole === "dispatcher" || 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin",
    
    canGenerateDocuments: 
      effectiveRole === "technician" || 
      effectiveRole === "dispatcher" || 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin",
    
    isAdmin: 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin",
    
    canManageSchedules: 
      effectiveRole === "dispatcher" || 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin",
    
    canReadFinanceData: 
      effectiveRole === "finance" || 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin",
    
    canModifyUser: 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin",
    
    canCreateJob: 
      effectiveRole === "admin" || 
      effectiveRole === "dispatcher" || 
      effectiveRole === "super_admin",
    
    canDeleteJob: 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin",
    
    canReadUser: 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin",
    
    canModifyFinanceData: 
      effectiveRole === "finance" || 
      effectiveRole === "admin" || 
      effectiveRole === "super_admin"
  };

  return (
    <RolePermissionsContext.Provider value={permissions}>
      {children}
    </RolePermissionsContext.Provider>
  );
}

export function useRolePermissions(): RolePermissions {
  const context = useContext(RolePermissionsContext);
  if (context === undefined) {
    throw new Error("useRolePermissions must be used within a RolePermissionsProvider");
  }
  return context;
}