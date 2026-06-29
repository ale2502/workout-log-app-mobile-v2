/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('sets').del();
  await knex('exercise_variants').del();
  await knex('workouts').del();
  await knex('gyms').del();
  await knex('exercises').del();
  await knex('gyms').insert([
    { id: 1, name: 'City Fitness Newmarket' },
  ]);
  await knex('exercises').insert([
    { id: 1, name: 'Barbell Bench Press', muscle_group: 'Chest' },
    { id: 2, name: 'Barbell Back Squat', muscle_group: 'Quadriceps' },
    { id: 3, name: 'Sumo Deadlift', muscle_group: 'Posterior Chain' },
  ]);
};
