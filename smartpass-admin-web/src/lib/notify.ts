import { message, notification } from 'antd';
import { MESSAGES } from '../constants/messages';

// Configure Ant Design message and notification placements and durations
message.config({
  top: 24,
  duration: 3,
  maxCount: 3,
});

notification.config({
  placement: 'topRight',
  duration: 4.5,
});

export interface NormalizedHttpError {
  status: number;
  message: string;
  isNetworkError: boolean;
}

export const notify = {
  success: (keyOrText: string) => {
    const text = (MESSAGES as Record<string, string>)[keyOrText] || keyOrText;
    message.success(text);
  },

  error: (keyOrText: string) => {
    const text = (MESSAGES as Record<string, string>)[keyOrText] || keyOrText;
    message.error(text);
  },

  warning: (keyOrText: string) => {
    const text = (MESSAGES as Record<string, string>)[keyOrText] || keyOrText;
    message.warning(text);
  },

  info: (keyOrText: string) => {
    const text = (MESSAGES as Record<string, string>)[keyOrText] || keyOrText;
    message.info(text);
  },

  fieldErrors: (_errorMap?: Record<string, string>) => {
    message.warning(MESSAGES.FORM_VALIDATION_FAILED);
  },

  realtime: (notif: { title: string; body: string; priority?: string; onClick?: () => void }) => {
    notification.open({
      message: notif.title,
      description: notif.body,
      placement: 'bottomRight',
      duration: notif.priority === 'URGENT' ? 10 : 5,
      onClick: notif.onClick,
    });
  },

  serverError: (error: any) => {
    if (!error) {
      message.error(MESSAGES.GENERIC_ERROR);
      return;
    }

    if (typeof error === 'string') {
      message.error((MESSAGES as Record<string, string>)[error] || error);
      return;
    }

    if (error.isNetworkError) {
      if (typeof error.message === 'string' && error.message.toLowerCase().includes('timeout')) {
        message.error(MESSAGES.NETWORK_TIMEOUT);
      } else {
        message.error(MESSAGES.NETWORK_OFFLINE);
      }
      return;
    }

    const status = error.status || error.response?.status;
    const msg = error.message || error.response?.data?.message;

    if (status === 401) {
      message.error(msg || MESSAGES.AUTH_SESSION_EXPIRED);
    } else if (status === 403) {
      message.error(msg || MESSAGES.AUTH_FORBIDDEN);
    } else if (status === 500) {
      message.error(MESSAGES.SERVER_ERROR_500);
    } else if (status === 502) {
      message.error(MESSAGES.SERVER_ERROR_502);
    } else if (status === 503) {
      message.error(MESSAGES.SERVER_ERROR_503);
    } else if (status === 504) {
      message.error(MESSAGES.SERVER_ERROR_504);
    } else if (msg) {
      // 400, 404, 409 verbatim backend message
      message.error(msg);
    } else {
      message.error(MESSAGES.GENERIC_ERROR);
    }
  },
};

