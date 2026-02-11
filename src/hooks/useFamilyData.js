
import { useEffect, useState, useCallback } from "react";
import { auth } from "../config/firebase";

import  dataService  from "../services/dataService";

/**
 * useFamilyData
 * Centralized hook to load + manage all family-related data (people, marriages, trees, events, stories).
 */
export function useFamilyData(treeId) {
  const [people, setPeople] = useState([]);
  const [marriages, setMarriages] = useState([]);
  const [tree, setTree] = useState(null);
  const [events, setEvents] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

  console.log("DEBUG: Checking permissions for treeId:", treeId);
  console.log("DEBUG: Checking permissions for userId:", auth.currentUser?.uid);

    try {
      if (!treeId) {
        setTree(null);
        setPeople([]);
        setMarriages([]);
        setEvents([]);
        setStories([]);
        setLoading(false);
        return;
      }

      // 1. Load the tree
      const t = await dataService.getTree(treeId);
      setTree(t);

      if (!t) {
        setPeople([]);
        setMarriages([]);
        setEvents([]);
        setStories([]);
        setLoading(false);
        return;
      }

      // 2. Load people
      let p = await dataService.getPeopleByTreeId(treeId);

      // Filter out only cascade deleted persons
      p = p.filter(person => !(person.isDeleted && person.deletionMode === "cascade"));

      p = p.map(person => {
        return {
          ...person,
          role: (!person.isDeceased && person.linkedUserId) ? (t.members?.find(m => m.userId === person.linkedUserId)?.role || null) : null
        };
      });

      // 3. Load marriages
      const m = await dataService.getAllMarriages(treeId);
      const personIds = new Set(p.map(per => per.id));
      const mFiltered = m.filter(marr => {
        // Filter out deleted marriages
        if (marr.isDeleted || marr.pendingDeletion) {
          return false;
        }
        
        if (marr.marriageType === "monogamous") {
          return marr.spouses?.some(id => personIds.has(id));
        }
        if (marr.marriageType === "polygamous") {
          return (
            personIds.has(marr.husbandId) ||
            (marr.wives || []).some(w => personIds.has(w.wifeId))
          );
        }
        return false;
      });

     
      if (t.currentRootId) {
        const rootId = t.currentRootId;

        // find root person
        const rootPerson = p.find(per => per.id === rootId);

        if (rootPerson) {
          // mark root explicitly
          rootPerson.variant = "root";

          // find marriages where root is a spouse
          const rootMarriages = mFiltered.filter(marr =>
            marr.spouses?.includes(rootId) ||
            marr.husbandId === rootId ||
            (marr.wives || []).some(w => w.wifeId === rootId)
          );

          // for each spouse, if they were "root", downgrade them to "spouse"
          rootMarriages.forEach(marr => {
            const spouseIds = marr.spouses?.filter(id => id !== rootId) ||
              (marr.husbandId === rootId
                ? (marr.wives || []).map(w => w.wifeId)
                : [marr.husbandId]);

            spouseIds.forEach(sid => {
              const spouse = p.find(per => per.id === sid);
              if (spouse && spouse.variant === "root") {
                spouse.variant = "spouse";
              }
            });
          });
        }
      }

      setPeople(p);
      setMarriages(mFiltered);

      // 4. Load events
      const evts = await dataService.getAllEvents(treeId);
      const evtsFiltered = evts.filter(e =>
        e.personIds?.some(pid => personIds.has(pid))
      );
      setEvents(evtsFiltered);

      // 5. Load stories
      const sts = await dataService.getAllStories(treeId);
      const stsFiltered = sts.filter(
        s =>
          personIds.has(s.personId) ||
          (s.personIds || []).some(pid => personIds.has(pid))
      );
      setStories(stsFiltered);

      console.log(
        `DBG:useFamilyData.reload -> loaded people:${p.length}, marriages:${mFiltered.length}, events:${evtsFiltered.length}, stories:${stsFiltered.length}`
      );
    } catch (err) {
      console.error("useFamilyData.reload -> error:", err);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    if (!treeId) {
      setPeople([]);
      setMarriages([]);
      setTree(null);
      setEvents([]);
      setStories([]);
      setLoading(false);
      return;
    }
    reload();
  }, [treeId, reload]);

  return {
    tree,
    people,
    marriages,
    events,
    stories,
    loading,
    reload,
  };
}
