/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('sets').insert([
    {
      id: 1,
      exercise_id: 1,
      workout_id: 1,
      set_number: 1,
      reps: 5,
      load: 10.5,
      rir: 3,
      note: '',
    },
    {
      id: 2,
      exercise_id: 1,
      workout_id: 1,
      set_number: 2,
      reps: 6,
      load: 8,
      rir: 3.5,
      note: 'Shoulder pain',
    },
    {
      id: 3,
      exercise_id: 1,
      workout_id: 1,
      set_number: 3,
      reps: 4,
      load: 8,
      rir: 3.5,
      note: 'Pain free',
    },
  ]);
};
