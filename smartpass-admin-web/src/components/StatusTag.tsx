import React from 'react';
import { Tag } from 'antd';
import {
  ROLE_MAP,
  CARD_STATUS_MAP,
  ATTENDANCE_STATUS_MAP,
  LIBRARY_LOAN_STATUS_MAP,
  CANTEEN_TX_TYPE_MAP,
  PARKING_STATUS_MAP,
  ROOM_BOOKING_STATUS_MAP,
  ACCOUNT_STATE_MAP,
  QR_TYPE_MAP,
  QR_STATUS_MAP,
} from '../constants/labels';

type StatusType =
  | 'role'
  | 'card'
  | 'attendance'
  | 'library'
  | 'canteen'
  | 'parking'
  | 'room'
  | 'account'
  | 'qr_type'
  | 'qr_status';

interface StatusTagProps {
  type: StatusType;
  value: string | boolean | undefined | null;
}

export const StatusTag: React.FC<StatusTagProps> = ({ type, value }) => {
  if (value === undefined || value === null) {
    return <Tag>-</Tag>;
  }

  const strVal = String(value);

  let label = strVal;
  let color = 'default';

  switch (type) {
    case 'role': {
      const meta = ROLE_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'card': {
      const meta = CARD_STATUS_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'attendance': {
      const meta = ATTENDANCE_STATUS_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'library': {
      const meta = LIBRARY_LOAN_STATUS_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'canteen': {
      const meta = CANTEEN_TX_TYPE_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'parking': {
      const meta = PARKING_STATUS_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'room': {
      const meta = ROOM_BOOKING_STATUS_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'account': {
      const meta = ACCOUNT_STATE_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'qr_type': {
      const meta = QR_TYPE_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
    case 'qr_status': {
      const meta = QR_STATUS_MAP[strVal];
      if (meta) {
        label = meta.label;
        color = meta.color;
      }
      break;
    }
  }

  return <Tag color={color}>{label}</Tag>;
};

