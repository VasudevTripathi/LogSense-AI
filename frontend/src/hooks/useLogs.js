import { useState } from 'react';

export function useLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return {
    logs,
    loading,
    error,
    setLogs,
  };
}
