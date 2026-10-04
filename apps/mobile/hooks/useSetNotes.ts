import { useState } from 'react';
import { SetDisplay } from '../../api/server/models/set';

type UseSetNotesOptions = {
  sets: SetDisplay[];
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
};

export function useSetNotes({ sets, onSaved, onError }: UseSetNotesOptions) {
  const [notesModalSetId, setNotesModalSetId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  function openNotes(selectedSet: SetDisplay) {
    setNotesModalSetId(selectedSet.id);
    setNotesDraft(selectedSet.note ?? '');
  }

  function closeNotes() {
    setNotesModalSetId(null);
    setNotesDraft('');
  }

  function clearNotes() {
    setNotesDraft('');
  }

  async function saveNotes() {
    if (notesModalSetId === null) {
      return;
    }

    const selectedSet = sets.find((set) => set.id === notesModalSetId);

    if (selectedSet === undefined) {
      onError('Could not find selected set');
      return;
    }

    setIsSavingNote(true);

    const requestBody = {
      workoutId: selectedSet.workoutId,
      exerciseId: selectedSet.exerciseId,
      exerciseVariantId: selectedSet.exerciseVariantId,
      setNumber: selectedSet.setNumber,
      reps: selectedSet.reps,
      load: selectedSet.load,
      rir: selectedSet.rir,
      note: notesDraft === '' ? null : notesDraft,
    };

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/sets/${notesModalSetId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      await onSaved();
      closeNotes();
    } catch {
      onError('Could not save note');
    } finally {
      setIsSavingNote(false);
    }
  }

  return {
    notesModalSetId,
    notesDraft,
    isSavingNote,
    setNotesDraft,
    openNotes,
    closeNotes,
    clearNotes,
    saveNotes,
  };
}
