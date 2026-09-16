import { useCallback, useEffect, useState } from 'react';
import { fetchProfile, updateProfile, uploadAvatar } from '../services/profileService.js';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchProfile();
      setProfile(data);
      setStatus('success');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Admin-only actions. Public usages of this hook (PublicLayout, Hero,
   * About, Contact, Footer) only ever destructure `profile`/`status`, so
   * adding these doesn't change any existing call site's behavior.
   */
  const saveProfile = useCallback(
    async (fields) => {
      if (!profile?.id) throw new Error('Profile not loaded yet.');
      const updated = await updateProfile(profile.id, fields);
      setProfile(updated);
      return updated;
    },
    [profile]
  );

  const changeAvatar = useCallback(
    async (file) => {
      if (!profile?.id) throw new Error('Profile not loaded yet.');
      const avatar_url = await uploadAvatar(file);
      const updated = await updateProfile(profile.id, { avatar_url });
      setProfile(updated);
      return updated;
    },
    [profile]
  );

  return { profile, status, error, refetch: load, saveProfile, changeAvatar };
}
