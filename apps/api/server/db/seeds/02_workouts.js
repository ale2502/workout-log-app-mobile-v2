/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('workouts').insert([
    { id: 1, performed_on: '2026-04-20' },
    { id: 2, performed_on: '2026-04-21' },
    { id: 3, performed_on: '2026-04-22' },
  ]);
};
