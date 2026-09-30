import React from 'react';
import { DatabaseState, User } from '../types/clinic';
import { PrintContentType } from '../components/PrintModal';
import { PharmacyPC } from './pharmacy/PharmacyPC';

interface PharmacyModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: User;
  onPrint: (content: PrintContentType) => void;
  onOpenOverride: (desc: string, onConfirm: (reason: string, authorizedBy: string) => void) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const PharmacyModule: React.FC<PharmacyModuleProps> = (props) => {
  return <PharmacyPC {...props} />;
};
