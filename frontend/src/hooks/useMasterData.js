import { useState, useEffect } from 'react';
import { getCategories, getDepartments, getStatuses, getPriorities, getSeverities } from '../services/complaints';

export function useMasterData() {
  const [data, setData] = useState({
    categories: [],
    departments: [],
    statuses: [],
    priorities: [],
    severities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cats, depts, stats, prios, sevs] = await Promise.all([
          getCategories(),
          getDepartments(),
          getStatuses(),
          getPriorities(),
          getSeverities(),
        ]);

        setData({
          categories: cats.data || cats,
          departments: depts.data || depts,
          statuses: stats.data || stats,
          priorities: prios.data || prios,
          severities: sevs.data || sevs,
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return { ...data, loading, error };
}
