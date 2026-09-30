import React from 'react';
import { DatabaseState, User } from '../types/clinic';
import { PrintContentType } from '../components/PrintModal';
import { ReceptionPC } from './reception/ReceptionPC';

interface CashierModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: User;
  onPrint: (content: PrintContentType) => void;
  onOpenOverride: (desc: string, onConfirm: (reason: string, authorizedBy: string) => void) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const CashierModule: React.FC<CashierModuleProps> = (props) => {
  return <ReceptionPC {...props} />;
};
