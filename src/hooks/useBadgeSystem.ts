import { useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocation } from 'react-router-dom';

export function useBadgeSystem() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !profile) return;

    // Detect context
    const path = location.pathname;
    const isReading = ['/blog', '/stories', '/news', '/laws'].some(p => path.startsWith(p) && path.split('/').length > 2);

    if (!isReading) return;

    const pointsPerMinute = 1.5;
    const source = `Reading ${path.split('/')[1]}`;

    timerRef.current = setInterval(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const currentProgress = (profile.progress || 0) + pointsPerMinute;
        
        let updateData: any = {
          progress: increment(pointsPerMinute),
          lastActive: serverTimestamp()
        };

        // Badge Leveling (10 progress points = 1 badge)
        if (currentProgress >= 10) {
          const badgesToEarn = Math.floor(currentProgress / 10);
          updateData.progress = currentProgress % 10;
          updateData.totalBadges = increment(badgesToEarn);
          
          // Log each badge
          for(let i=0; i<badgesToEarn; i++) {
             const badgeName = `Elite ${profile.totalBadges + i + 1}`;
             await addDoc(collection(db, `users/${user.uid}/badgeHistory`), {
                badgeName,
                earnedAt: serverTimestamp(),
                pointsAtTime: 10
             });
          }
        }

        // Log progress activity
        await addDoc(collection(db, `users/${user.uid}/progressLogs`), {
          points: pointsPerMinute,
          source: source,
          timestamp: serverTimestamp()
        });

        await updateDoc(userRef, updateData);
      } catch (err) {
        console.error("Progress update failed:", err);
      }
    }, 60000); // Every 1 minute

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, profile, location.pathname]);
}
