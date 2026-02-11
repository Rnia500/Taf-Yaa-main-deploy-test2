export const formatArrivalTime = ({createdAt}) => {
    try {
      const now = new Date();
      const ts = createdAt ? new Date(createdAt) : now;
      const diffMs = Math.max(0, now - ts);
      const sec = Math.floor(diffMs / 1000);
      const min = Math.floor(sec / 60);
      const hr = Math.floor(min / 60);
      const day = Math.floor(hr / 24);
      if (day > 0) return `${day}d ago`;
      if (hr > 0) return `${hr}h ago`;
      if (min > 0) return `${min}m ago`;
      return `just now`;
    } catch {
      return `just now`;
    }
  }

